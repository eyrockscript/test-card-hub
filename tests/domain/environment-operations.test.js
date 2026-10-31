import { describe, it, expect } from 'vitest';
import {
  addCardToEnvironment,
  updateCard,
  removeCard,
  renameEnvironment,
  removeEnvironment,
  replaceCards,
  mergeEnvironments,
  restoreState,
  parseImportPayload,
} from '../../src/domain/environment.js';

const VISA = '4242424242424242';
const MC = '5555555555554444';
const AMEX = '378282246310005';

function makeState() {
  const { value } = restoreState([
    { id: 'e1', environment: 'Default', colorKey: 'slate', cards: [
      { id: 'c1', cardNumber: VISA, cardResponse: 'Aprobada', outcome: 'approved' },
      { id: 'c2', cardNumber: MC, cardResponse: 'Rechazada', outcome: 'declined' },
    ] },
    { id: 'e2', environment: 'Stripe', colorKey: 'teal', cards: [] },
  ]);
  return value;
}

const codes = (result) => result.errors.map((e) => e.code);

describe('addCardToEnvironment', () => {
  it('appends to an existing environment (case-insensitive name) without mutating state', () => {
    const state = makeState();
    const result = addCardToEnvironment(state, ' default ', { cardNumber: AMEX, cardResponse: 'Sin fondos' });
    expect(result.ok).toBe(true);
    expect(result.value[0].cards.map((c) => c.cardNumber)).toEqual([VISA, MC, AMEX]);
    expect(result.value[0].cards[2].outcome).toBe('insufficient');
    expect(result.meta).toEqual({ environmentId: 'e1', cardId: result.value[0].cards[2].id, createdEnvironment: false });
    expect(state[0].cards).toHaveLength(2);
    expect(result.value[1]).toBe(state[1]);
  });

  it('creates a new environment with the next color key', () => {
    const result = addCardToEnvironment(makeState(), 'Conekta', { cardNumber: VISA, cardResponse: 'ok' });
    expect(result.ok).toBe(true);
    expect(result.value[2]).toMatchObject({ environment: 'Conekta', colorKey: 'amber' });
    expect(result.meta.createdEnvironment).toBe(true);
  });

  it('rejects duplicates (same number AND same response, case/space-insensitive)', () => {
    const result = addCardToEnvironment(makeState(), 'Default', { cardNumber: '4242 4242 4242 4242', cardResponse: '  APROBADA ' });
    expect(result).toEqual({ ok: false, errors: [{ code: 'card.duplicate' }] });
  });

  it('allows the same number with a different response (e.g. Mercado Pago)', () => {
    const result = addCardToEnvironment(makeState(), 'Default', { cardNumber: VISA, cardResponse: 'Rechazada', note: ' Titular: OTHE ' });
    expect(result.ok).toBe(true);
    expect(result.value[0].cards[2]).toMatchObject({ cardNumber: VISA, outcome: 'declined', note: 'Titular: OTHE' });
  });

  it('propagates card and name validation errors', () => {
    expect(codes(addCardToEnvironment(makeState(), 'Default', { cardNumber: '1', cardResponse: '' })))
      .toEqual(['card.number_length', 'card.response_required']);
    expect(codes(addCardToEnvironment(makeState(), '  ', { cardNumber: VISA, cardResponse: 'x' })))
      .toEqual(['environment.name_length']);
    expect(codes(addCardToEnvironment(makeState(), null, { cardNumber: VISA, cardResponse: 'x' })))
      .toEqual(['environment.name_type']);
  });

  it('enforces the card and environment limits', () => {
    const cards = Array.from({ length: 200 }, (_, i) => ({ cardNumber: String(4000000000000000 + i), cardResponse: 'ok' }));
    const { value: full } = restoreState([{ id: 'e', environment: 'full', colorKey: 'slate', cards }]);
    expect(codes(addCardToEnvironment(full, 'full', { cardNumber: VISA, cardResponse: 'x' }))).toEqual(['environment.cards_limit']);

    const envs = Array.from({ length: 50 }, (_, i) => ({ id: `e${i}`, environment: `env ${i}`, colorKey: 'slate', cards: [] }));
    const { value: many } = restoreState(envs);
    expect(codes(addCardToEnvironment(many, 'new', { cardNumber: VISA, cardResponse: 'x' }))).toEqual(['state.environments_limit']);
    expect(addCardToEnvironment(many, 'env 3', { cardNumber: VISA, cardResponse: 'x' }).ok).toBe(true);
  });
});

describe('updateCard', () => {
  it('patches fields and keeps id and outcome when outcome is not in the patch', () => {
    const state = makeState();
    const result = updateCard(state, 'e1', 'c1', { cardResponse: 'Rechazada ahora' });
    expect(result.ok).toBe(true);
    expect(result.value[0].cards[0]).toEqual({ id: 'c1', cardNumber: VISA, cardResponse: 'Rechazada ahora', outcome: 'approved' });
    expect(state[0].cards[0].cardResponse).toBe('Aprobada');
  });

  it('re-infers outcome when outcome is null and accepts explicit outcomes', () => {
    expect(updateCard(makeState(), 'e1', 'c1', { cardResponse: 'Rechazada', outcome: null }).value[0].cards[0].outcome).toBe('declined');
    expect(updateCard(makeState(), 'e1', 'c1', { outcome: 'review' }).value[0].cards[0].outcome).toBe('review');
  });

  it('allows keeping its own number but rejects another card number', () => {
    expect(updateCard(makeState(), 'e1', 'c1', { cardNumber: VISA }).ok).toBe(true);
    expect(codes(updateCard(makeState(), 'e1', 'c1', { cardNumber: MC, cardResponse: 'rechazada' }))).toEqual(['card.duplicate']);
    expect(updateCard(makeState(), 'e1', 'c1', { cardNumber: MC }).ok).toBe(true);
  });

  it('sets, keeps and clears the note', () => {
    const withNote = updateCard(makeState(), 'e1', 'c1', { note: ' CVV 123 ' }).value;
    expect(withNote[0].cards[0].note).toBe('CVV 123');
    const kept = updateCard(withNote, 'e1', 'c1', { cardResponse: 'Otra' }).value;
    expect(kept[0].cards[0].note).toBe('CVV 123');
    const cleared = updateCard(kept, 'e1', 'c1', { note: null }).value;
    expect('note' in cleared[0].cards[0]).toBe(false);
    expect(codes(updateCard(kept, 'e1', 'c1', { note: 'x'.repeat(161) }))).toEqual(['card.note_length']);
  });

  it('reports not-found and validation errors', () => {
    expect(codes(updateCard(makeState(), 'nope', 'c1', {}))).toEqual(['environment.not_found']);
    expect(codes(updateCard(makeState(), 'e1', 'nope', {}))).toEqual(['card.not_found']);
    expect(codes(updateCard(makeState(), 'e1', 'c1', { cardNumber: '12' }))).toEqual(['card.number_length']);
    expect(codes(updateCard(makeState(), 'e1', 'c1', null))).toEqual(['card.invalid_input']);
  });

  it('ignores attempts to change the id', () => {
    expect(updateCard(makeState(), 'e1', 'c1', { id: 'x' }).value[0].cards[0].id).toBe('c1');
  });
});

describe('removeCard', () => {
  it('removes a card immutably', () => {
    const state = makeState();
    const result = removeCard(state, 'e1', 'c2');
    expect(result.value[0].cards.map((c) => c.id)).toEqual(['c1']);
    expect(state[0].cards).toHaveLength(2);
  });
  it('reports not found', () => {
    expect(codes(removeCard(makeState(), 'e9', 'c1'))).toEqual(['environment.not_found']);
    expect(codes(removeCard(makeState(), 'e1', 'c9'))).toEqual(['card.not_found']);
  });
});

describe('renameEnvironment', () => {
  it('renames with trimming and allows a case change of its own name', () => {
    expect(renameEnvironment(makeState(), 'e2', ' Stripe Test ').value[1].environment).toBe('Stripe Test');
    expect(renameEnvironment(makeState(), 'e1', 'DEFAULT').value[0].environment).toBe('DEFAULT');
  });
  it('rejects empty, too long, wrong type and duplicate names', () => {
    expect(codes(renameEnvironment(makeState(), 'e2', ''))).toEqual(['environment.name_length']);
    expect(codes(renameEnvironment(makeState(), 'e2', 'x'.repeat(41)))).toEqual(['environment.name_length']);
    expect(codes(renameEnvironment(makeState(), 'e2', 3))).toEqual(['environment.name_type']);
    expect(codes(renameEnvironment(makeState(), 'e2', 'default'))).toEqual(['environment.duplicate']);
    expect(codes(renameEnvironment(makeState(), 'zz', 'new'))).toEqual(['environment.not_found']);
  });
});

describe('removeEnvironment', () => {
  it('removes by id and allows an empty state', () => {
    const once = removeEnvironment(makeState(), 'e1');
    expect(once.value.map((e) => e.id)).toEqual(['e2']);
    expect(removeEnvironment(once.value, 'e2').value).toEqual([]);
  });
  it('reports not found', () => {
    expect(codes(removeEnvironment(makeState(), 'x'))).toEqual(['environment.not_found']);
  });
});

describe('replaceCards', () => {
  it('replaces the whole card list atomically', () => {
    const result = replaceCards(makeState(), 'e2', [{ cardNumber: AMEX, cardResponse: 'Pendiente' }, { cardNumber: VISA, cardResponse: 'ok', outcome: 'approved' }]);
    expect(result.ok).toBe(true);
    expect(result.value[1].cards.map((c) => [c.cardNumber, c.outcome])).toEqual([[AMEX, 'review'], [VISA, 'approved']]);
  });
  it('fails without changes when any card is invalid, with indexes', () => {
    const result = replaceCards(makeState(), 'e2', [{ cardNumber: VISA, cardResponse: 'ok' }, { cardNumber: VISA, cardResponse: 'ok' }, 'junk']);
    expect(result).toEqual({ ok: false, errors: [{ code: 'card.duplicate', card: 1 }, { code: 'card.invalid_input', card: 2 }] });
  });
  it('allows one number with different responses and keeps notes', () => {
    const result = replaceCards(makeState(), 'e2', [
      { cardNumber: VISA, cardResponse: 'APRO', note: 'Titular APRO' },
      { cardNumber: VISA, cardResponse: 'OTHE', note: 'Titular OTHE' },
    ]);
    expect(result.ok).toBe(true);
    expect(result.value[1].cards.map((c) => c.note)).toEqual(['Titular APRO', 'Titular OTHE']);
  });
  it('keeps a pasted id only when it exists in the env and is not repeated', () => {
    const existing = 'c1';
    const result = replaceCards(makeState(), 'e1', [
      { id: existing, cardNumber: VISA, cardResponse: 'a' },
      { id: existing, cardNumber: AMEX, cardResponse: 'b' },
      { id: 'forged', cardNumber: MC, cardResponse: 'c' },
    ]);
    const ids = result.value[0].cards.map((c) => c.id);
    expect(ids[0]).toBe(existing);
    expect(ids[1]).not.toBe(existing);
    expect(ids[2]).not.toBe('forged');
    expect(new Set(ids).size).toBe(3);
  });
  it('rejects non-array input, unknown env and too many cards', () => {
    expect(codes(replaceCards(makeState(), 'e2', {}))).toEqual(['environment.cards_type']);
    expect(codes(replaceCards(makeState(), 'x', []))).toEqual(['environment.not_found']);
    const cards = Array.from({ length: 201 }, (_, i) => ({ cardNumber: String(4000000000000000 + i), cardResponse: 'ok' }));
    expect(codes(replaceCards(makeState(), 'e2', cards))).toEqual(['environment.cards_limit']);
  });
});

describe('mergeEnvironments', () => {
  const incoming = () => parseImportPayload([
    { environment: 'default', cards: [{ cardNumber: VISA, cardResponse: ' aprobada' }, { cardNumber: AMEX, cardResponse: 'new' }] },
    { environment: 'Conekta', cards: [{ cardNumber: VISA, cardResponse: 'ok' }] },
  ]).value;

  it('merge: appends non-duplicate cards into same-named env and adds new envs', () => {
    const state = makeState();
    const result = mergeEnvironments(state, incoming(), 'merge');
    expect(result.ok).toBe(true);
    expect(result.value[0].cards.map((c) => c.cardNumber)).toEqual([VISA, MC, AMEX]);
    expect(result.value[2]).toMatchObject({ environment: 'Conekta', colorKey: 'amber' });
    expect(result.meta).toEqual({ addedEnvironments: 1, addedCards: 2, skippedDuplicates: 1 });
    expect(state[0].cards).toHaveLength(2);
  });

  it('merge: appends a same-number card when its response differs', () => {
    const { value: other } = parseImportPayload({ environment: 'Default', cards: [{ cardNumber: VISA, cardResponse: 'Pendiente', note: 'n' }] });
    const result = mergeEnvironments(makeState(), other, 'merge');
    expect(result.value[0].cards).toHaveLength(3);
    expect(result.value[0].cards[2]).toMatchObject({ cardNumber: VISA, outcome: 'review', note: 'n' });
    expect(result.meta.skippedDuplicates).toBe(0);
  });

  it('rename: adds suffixed copies instead of merging', () => {
    const first = mergeEnvironments(makeState(), incoming(), 'rename');
    expect(first.value.map((e) => e.environment)).toEqual(['Default', 'Stripe', 'default (2)', 'Conekta']);
    const second = mergeEnvironments(first.value, incoming(), 'rename');
    expect(second.value.slice(4).map((e) => e.environment)).toEqual(['default (3)', 'Conekta (2)']);
    expect(second.meta).toEqual({ addedEnvironments: 2, addedCards: 3, skippedDuplicates: 0 });
  });

  it('rename: truncates long names so the suffix fits in 40 chars', () => {
    const long = 'x'.repeat(40);
    const { value: state } = restoreState([{ id: 'a', environment: long, colorKey: 'slate', cards: [] }]);
    const result = mergeEnvironments(state, [{ ...state[0], id: 'b' }], 'rename');
    expect(result.value[1].environment).toBe(`${'x'.repeat(36)} (2)`);
  });

  it('gives incoming environments and cards fresh ids', () => {
    const state = makeState();
    const result = mergeEnvironments(state, state, 'rename');
    const ids = new Set(result.value.map((e) => e.id));
    expect(ids.size).toBe(4);
    expect(result.value[2].cards[0].id).not.toBe('c1');
  });

  it('fails atomically on limits and invalid strategy', () => {
    expect(codes(mergeEnvironments(makeState(), incoming(), 'overwrite'))).toEqual(['merge.invalid_strategy']);
    expect(codes(mergeEnvironments(makeState(), 'nope', 'merge'))).toEqual(['merge.invalid_input']);
    const envs = Array.from({ length: 50 }, (_, i) => ({ id: `e${i}`, environment: `env ${i}`, colorKey: 'slate', cards: [] }));
    const { value: many } = restoreState(envs);
    expect(codes(mergeEnvironments(many, incoming(), 'merge'))).toEqual(['state.environments_limit']);
    const cards = Array.from({ length: 199 }, (_, i) => ({ cardNumber: String(4000000000000000 + i), cardResponse: 'ok' }));
    const { value: nearlyFull } = restoreState([{ id: 'd', environment: 'default', colorKey: 'slate', cards }]);
    const result = mergeEnvironments(nearlyFull, incoming(), 'merge');
    expect(result.errors).toEqual([{ code: 'environment.cards_limit', env: 0 }]);
  });

  it('rejects an incoming batch with duplicate names (case-insensitive)', () => {
    const batch = [
      { id: 'n1', environment: 'New', colorKey: 'slate', cards: [{ id: 'x1', cardNumber: VISA, cardResponse: 'a', outcome: 'other' }] },
      { id: 'n2', environment: 'new', colorKey: 'slate', cards: [{ id: 'x2', cardNumber: MC, cardResponse: 'b', outcome: 'other' }] },
    ];
    const result = mergeEnvironments([], batch, 'merge');
    expect(result).toEqual({ ok: false, errors: [{ code: 'environment.duplicate', env: 1 }] });
  });

  it('merges into an env created earlier in the same batch when names collide only after rename', () => {
    const { value: batch } = parseImportPayload([{ environment: 'A', cards: [] }, { environment: 'B', cards: [] }]);
    const result = mergeEnvironments([], batch, 'merge');
    expect(result.value.map((e) => [e.environment, e.colorKey])).toEqual([['A', 'slate'], ['B', 'teal']]);
  });
});
