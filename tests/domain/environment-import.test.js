import { describe, it, expect } from 'vitest';
import {
  COLOR_KEYS,
  ENVIRONMENT_LIMITS,
  colorKeyFor,
  createEnvironment,
  parseImportPayload,
  restoreState,
  serializeBackup,
} from '../../src/domain/environment.js';

const legacyCard = (cardNumber, cardResponse) => ({
  cardNumber,
  cardLogo: 'default-logo.png',
  cardNumberDisplay: cardNumber.replace(/(\d{4})(?=\d)/g, '$1 '),
  cardResponse,
});

const legacyEnv = (environment, cards) => ({ environment, color: 'hsl(1, 50%, 15%)', cards });

describe('colorKeyFor', () => {
  it('cycles deterministically through COLOR_KEYS', () => {
    expect(COLOR_KEYS).toEqual(['slate', 'teal', 'amber', 'rose', 'indigo', 'olive']);
    expect([0, 1, 5, 6, 13].map(colorKeyFor)).toEqual(['slate', 'teal', 'olive', 'slate', 'teal']);
  });
  it('falls back to the first key for invalid indexes', () => {
    expect(colorKeyFor(-1)).toBe('slate');
    expect(colorKeyFor(1.5)).toBe('slate');
    expect(colorKeyFor('2')).toBe('slate');
  });
});

describe('createEnvironment', () => {
  it('builds a frozen environment with trimmed name, id and colorKey', () => {
    const result = createEnvironment({ environment: '  Stripe ', cards: [] }, 2);
    expect(result.ok).toBe(true);
    expect(result.value).toEqual({ id: expect.any(String), environment: 'Stripe', colorKey: 'amber', cards: [] });
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.cards)).toBe(true);
  });
  it('keeps a valid given id and colorKey', () => {
    const result = createEnvironment({ id: 'e1', environment: 'x', colorKey: 'rose', cards: [] }, 0);
    expect(result.value).toMatchObject({ id: 'e1', colorKey: 'rose' });
  });
  it('replaces an unknown colorKey with the indexed one', () => {
    expect(createEnvironment({ environment: 'x', colorKey: 'purple', cards: [] }, 1).value.colorKey).toBe('teal');
  });
  it.each([
    ['', 'environment.name_length'],
    ['   ', 'environment.name_length'],
    ['x'.repeat(41), 'environment.name_length'],
    [42, 'environment.name_type'],
  ])('rejects name %p', (environment, code) => {
    expect(createEnvironment({ environment, cards: [] }, 0).errors).toEqual([{ code }]);
  });
  it('accepts a 40-char name', () => {
    expect(createEnvironment({ environment: 'x'.repeat(40), cards: [] }, 0).ok).toBe(true);
  });
  it('rejects non-array cards and non-object input', () => {
    expect(createEnvironment({ environment: 'x', cards: {} }, 0).errors).toEqual([{ code: 'environment.cards_type' }]);
    expect(createEnvironment(null, 0).errors).toEqual([{ code: 'environment.invalid_input' }]);
  });
  it('rejects invalid ids', () => {
    expect(createEnvironment({ id: 3, environment: 'x', cards: [] }, 0).errors).toEqual([{ code: 'environment.id_type' }]);
  });
  it('reports indexed card errors, duplicates and limit without throwing', () => {
    const cards = [
      { cardNumber: '4242424242424242', cardResponse: 'ok' },
      { cardNumber: '42', cardResponse: 'bad' },
      { cardNumber: '4242 4242 4242 4242', cardResponse: ' OK ' },
    ];
    const result = createEnvironment({ environment: 'x', cards }, 0);
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      { code: 'card.number_length', card: 1 },
      { code: 'card.duplicate', card: 2 },
    ]);
    expect(result.value.cards).toHaveLength(1);
  });
  it('enforces the per-environment card limit', () => {
    const cards = Array.from({ length: ENVIRONMENT_LIMITS.maxCards + 1 }, (_, i) => ({
      cardNumber: String(4000000000000000 + i),
      cardResponse: 'ok',
    }));
    const result = createEnvironment({ environment: 'big', cards }, 0);
    expect(result.errors).toEqual([{ code: 'environment.cards_limit' }]);
    expect(result.value.cards).toHaveLength(200);
  });
});

describe('parseImportPayload', () => {
  it('accepts a legacy single environment and strips unknown props', () => {
    const payload = legacyEnv('Stripe', [legacyCard('4242424242424242', 'Pago exitoso')]);
    const result = parseImportPayload(payload);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.value).toHaveLength(1);
    const [env] = result.value;
    expect(env).toEqual({
      id: expect.any(String),
      environment: 'Stripe',
      colorKey: 'slate',
      cards: [{ id: expect.any(String), cardNumber: '4242424242424242', cardResponse: 'Pago exitoso', outcome: 'approved' }],
    });
  });

  it('accepts an array of legacy environments with cycling colors', () => {
    const result = parseImportPayload([
      legacyEnv('a', [legacyCard('4242424242424242', 'ok')]),
      legacyEnv('b', []),
    ]);
    expect(result.ok).toBe(true);
    expect(result.value.map((e) => [e.environment, e.colorKey])).toEqual([['a', 'slate'], ['b', 'teal']]);
  });

  it('accepts a v3 backup and keeps explicit outcomes', () => {
    const backup = {
      format: 'test-card-hub',
      version: 3,
      exportedAt: '2026-10-29T00:00:00.000Z',
      environments: [{ environment: 'MP', cards: [{ cardNumber: '5031755734530604', cardResponse: 'APRO', outcome: 'approved' }] }],
    };
    const result = parseImportPayload(backup);
    expect(result.ok).toBe(true);
    expect(result.value[0].cards[0].outcome).toBe('approved');
  });

  it('accepts a JSON string', () => {
    const result = parseImportPayload(JSON.stringify(legacyEnv('s', [])));
    expect(result.ok).toBe(true);
    expect(result.value[0].environment).toBe('s');
  });

  it('regenerates ids instead of trusting imported ones', () => {
    const result = parseImportPayload({ id: 'evil', environment: 'x', cards: [{ id: 'c', cardNumber: '4242424242424242', cardResponse: 'ok' }] });
    expect(result.value[0].id).not.toBe('evil');
    expect(result.value[0].cards[0].id).not.toBe('c');
  });

  it.each([
    ['invalid JSON', '{nope', 'import.invalid_json'],
    ['null', null, 'import.invalid_shape'],
    ['a number', 7, 'import.invalid_shape'],
    ['an unrelated object', { foo: 1 }, 'import.invalid_shape'],
    ['an empty array', [], 'import.empty'],
    ['a wrong backup version', { format: 'test-card-hub', version: 2, environments: [] }, 'import.unsupported_version'],
    ['a backup without environments', { format: 'test-card-hub', version: 3 }, 'import.invalid_shape'],
  ])('rejects %s', (_label, payload, code) => {
    expect(parseImportPayload(payload)).toEqual({ ok: false, value: [], errors: [{ code }] });
  });

  it('reports per-card errors with env and card indexes and keeps valid data', () => {
    const result = parseImportPayload([
      legacyEnv('a', [legacyCard('4242424242424242', 'ok')]),
      legacyEnv('b', [legacyCard('4242424242424242', 'ok'), legacyCard('4242424242424242', 'ok'), { cardNumber: '1', cardResponse: 'x' }]),
    ]);
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      { code: 'card.duplicate', env: 1, card: 1 },
      { code: 'card.number_length', env: 1, card: 2 },
    ]);
    expect(result.value.map((e) => e.cards.length)).toEqual([1, 1]);
  });

  it('drops environments with invalid names or duplicate names (case-insensitive)', () => {
    const result = parseImportPayload([legacyEnv('', []), legacyEnv('Prod', []), legacyEnv('prod ', []), 'junk']);
    expect(result.errors).toEqual([
      { code: 'environment.name_length', env: 0 },
      { code: 'environment.duplicate', env: 2 },
      { code: 'environment.invalid_input', env: 3 },
    ]);
    expect(result.value.map((e) => e.environment)).toEqual(['Prod']);
    expect(result.value[0].colorKey).toBe('slate');
  });

  it('truncates beyond the environment limit and reports it', () => {
    const many = Array.from({ length: 51 }, (_, i) => legacyEnv(`env ${i}`, []));
    const result = parseImportPayload(many);
    expect(result.value).toHaveLength(50);
    expect(result.errors).toEqual([{ code: 'import.environments_limit' }]);
  });
});

describe('restoreState', () => {
  it('preserves ids and colorKeys of stored environments', () => {
    const stored = [{ id: 'e1', environment: 'a', colorKey: 'olive', cards: [{ id: 'c1', cardNumber: '4242424242424242', cardResponse: 'ok', outcome: 'review' }] }];
    const result = restoreState(stored);
    expect(result.ok).toBe(true);
    expect(result.value).toEqual(stored);
  });
  it('rejects non-arrays and propagates validation errors', () => {
    expect(restoreState({})).toEqual({ ok: false, value: [], errors: [{ code: 'state.invalid_shape' }] });
    const bad = restoreState([{ id: 'e1', environment: '', colorKey: 'slate', cards: [] }]);
    expect(bad.ok).toBe(false);
    expect(bad.errors).toEqual([{ code: 'environment.name_length', env: 0 }]);
  });
  it('accepts an empty state', () => {
    expect(restoreState([])).toEqual({ ok: true, value: [], errors: [] });
  });
});

describe('serializeBackup', () => {
  it('produces pretty JSON without ids or colorKey', () => {
    const { value } = parseImportPayload(legacyEnv('Stripe', [legacyCard('4242424242424242', 'Pago exitoso')]));
    const json = serializeBackup(value, new Date('2026-10-29T12:00:00.000Z'));
    expect(json).toContain('\n  "format"');
    expect(JSON.parse(json)).toEqual({
      format: 'test-card-hub',
      version: 3,
      exportedAt: '2026-10-29T12:00:00.000Z',
      environments: [{ environment: 'Stripe', cards: [{ cardNumber: '4242424242424242', cardResponse: 'Pago exitoso', outcome: 'approved' }] }],
    });
  });
  it('includes note only when present and keeps same-number cards with different responses', () => {
    const { value } = parseImportPayload({ environment: 'MP', cards: [
      { cardNumber: '5031755734530604', cardResponse: 'APRO', note: 'Titular APRO' },
      { cardNumber: '5031755734530604', cardResponse: 'OTHE' },
    ] });
    const parsed = JSON.parse(serializeBackup(value));
    expect(parsed.environments[0].cards).toEqual([
      { cardNumber: '5031755734530604', cardResponse: 'APRO', outcome: 'other', note: 'Titular APRO' },
      { cardNumber: '5031755734530604', cardResponse: 'OTHE', outcome: 'other' },
    ]);
    expect(parseImportPayload(serializeBackup(value)).value[0].cards[0].note).toBe('Titular APRO');
  });

  it('round-trips through parseImportPayload', () => {
    const { value } = parseImportPayload([legacyEnv('a', [legacyCard('4242424242424242', 'Rechazada')]), legacyEnv('b', [])]);
    const again = parseImportPayload(serializeBackup(value));
    expect(again.ok).toBe(true);
    expect(again.value.map(({ environment, cards }) => ({ environment, cards: cards.map((c) => c.outcome) })))
      .toEqual([{ environment: 'a', cards: ['declined'] }, { environment: 'b', cards: [] }]);
  });
  it('defaults exportedAt to now', () => {
    const parsed = JSON.parse(serializeBackup([]));
    expect(Number.isNaN(Date.parse(parsed.exportedAt))).toBe(false);
  });
});
