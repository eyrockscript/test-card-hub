import { describe, it, expect } from 'vitest';
import {
  normalizeCardNumber,
  isLuhnValid,
  detectBrand,
  formatCardNumber,
  OUTCOMES,
  inferOutcome,
  createCard,
  isKnownTestNumber,
  CARD_LIMITS,
  cardIdentityKey,
} from '../../src/domain/card.js';

describe('normalizeCardNumber', () => {
  it('strips spaces, dashes and other non-digits', () => {
    expect(normalizeCardNumber(' 4242-4242 4242\t4242 ')).toBe('4242424242424242');
  });
  it('returns empty string for non-string input', () => {
    expect(normalizeCardNumber(null)).toBe('');
    expect(normalizeCardNumber(undefined)).toBe('');
    expect(normalizeCardNumber(4242)).toBe('');
  });
  it('drops non-ASCII digits and emoji', () => {
    expect(normalizeCardNumber('42a42😀٤')).toBe('4242');
  });
});

describe('isLuhnValid', () => {
  it.each([
    '4242424242424242',
    '5555555555554444',
    '378282246310005',
    '6011111111111117',
    '30569309025904',
    '3530111333300000',
    '6200000000000005',
  ])('accepts %s', (n) => expect(isLuhnValid(n)).toBe(true));

  it('rejects checksum failures', () => {
    expect(isLuhnValid('4242424242424241')).toBe(false);
  });
  it('rejects empty, non-digit and non-string input', () => {
    expect(isLuhnValid('')).toBe(false);
    expect(isLuhnValid('4242 4242')).toBe(false);
    expect(isLuhnValid(null)).toBe(false);
    expect(isLuhnValid(4242424242424242)).toBe(false);
  });
});

describe('detectBrand', () => {
  it.each([
    ['4242424242424242', 'visa'],
    ['5555555555554444', 'mastercard'],
    ['5105105105105100', 'mastercard'],
    ['2221000000000009', 'mastercard'],
    ['2720999999999996', 'mastercard'],
    ['378282246310005', 'amex'],
    ['341111111111111', 'amex'],
    ['6011111111111117', 'discover'],
    ['6445644564456445', 'discover'],
    ['6511111111111117', 'discover'],
    ['30569309025904', 'diners'],
    ['36227206271667', 'diners'],
    ['38520000023237', 'diners'],
    ['3530111333300000', 'jcb'],
    ['3589000000000000', 'jcb'],
    ['6200000000000005', 'unionpay'],
  ])('%s -> %s', (digits, brand) => expect(detectBrand(digits)).toBe(brand));

  it('treats 2220 and 2721 as unknown (outside Mastercard 2-series)', () => {
    expect(detectBrand('2220000000000000')).toBe('unknown');
    expect(detectBrand('2721000000000000')).toBe('unknown');
  });
  it('returns unknown for 3527 / 3590 (outside JCB range)', () => {
    expect(detectBrand('3527000000000000')).toBe('unknown');
    expect(detectBrand('3590000000000000')).toBe('unknown');
  });
  it('returns unknown for empty or non-string', () => {
    expect(detectBrand('')).toBe('unknown');
    expect(detectBrand(undefined)).toBe('unknown');
    expect(detectBrand('9999')).toBe('unknown');
  });
});

describe('formatCardNumber', () => {
  it('groups by 4 by default', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatCardNumber('4242424242424242123')).toBe('4242 4242 4242 4242 123');
  });
  it('formats amex as 4-6-5', () => {
    expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005');
  });
  it('formats 14-digit diners as 4-6-4', () => {
    expect(formatCardNumber('30569309025904')).toBe('3056 930902 5904');
  });
  it('formats 16-digit diners in groups of 4', () => {
    expect(formatCardNumber('3056930902590400')).toBe('3056 9309 0259 0400');
  });
  it('normalizes input and handles partial / empty values', () => {
    expect(formatCardNumber('4242 42')).toBe('4242 42');
    expect(formatCardNumber('')).toBe('');
    expect(formatCardNumber(null)).toBe('');
    expect(formatCardNumber('37828')).toBe('3782 8');
  });
});

describe('inferOutcome', () => {
  it('exposes a frozen list of outcomes', () => {
    expect(OUTCOMES).toEqual(['approved', 'declined', 'insufficient', 'review', 'other']);
    expect(Object.isFrozen(OUTCOMES)).toBe(true);
  });

  it.each([
    ['Transacción aprobada', 'approved'],
    ['APPROVED', 'approved'],
    ['Payment success', 'approved'],
    ['Pago exitoso', 'approved'],
    ['Tarjeta sin fondos', 'insufficient'],
    ['Insufficient funds', 'insufficient'],
    ['Rechazada por fondos insuficientes', 'insufficient'],
    ['Tarjeta no válida', 'declined'],
    ['Tarjeta inválida', 'declined'],
    ['Rechazada', 'declined'],
    ['Card declined', 'declined'],
    ['Invalid CVC', 'declined'],
    ['Do not honor - denied', 'declined'],
    ['Processing error', 'declined'],
    ['Tarjeta expirada', 'declined'],
    ['Tarjeta robada', 'declined'],
    ['Stolen card', 'declined'],
    ['Suspected fraud', 'declined'],
    ['No aprobada', 'declined'],
    ['Not approved', 'declined'],
    ['Transaccion aprobada', 'approved'],
    ['Requiere 3DS', 'review'],
    ['Autenticación requerida', 'review'],
    ['Authentication required', 'review'],
    ['Manual review', 'review'],
    ['En revisión', 'review'],
    ['Pendiente', 'review'],
    ['Pending', 'review'],
    ['Something else', 'other'],
    ['', 'other'],
  ])('"%s" -> %s', (text, outcome) => expect(inferOutcome(text)).toBe(outcome));

  it('returns other for non-string input', () => {
    expect(inferOutcome(null)).toBe('other');
    expect(inferOutcome(42)).toBe('other');
  });
});

describe('createCard', () => {
  const valid = { cardNumber: '4242 4242 4242 4242', cardResponse: '  Transacción aprobada ' };

  it('creates a normalized card with inferred outcome and a uuid', () => {
    const result = createCard(valid);
    expect(result.ok).toBe(true);
    expect(result.value).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      cardNumber: '4242424242424242',
      cardResponse: 'Transacción aprobada',
      outcome: 'approved',
    });
    expect(Object.isFrozen(result.value)).toBe(true);
  });

  it('keeps a given id and a valid explicit outcome', () => {
    const result = createCard({ ...valid, id: 'abc', outcome: 'review' });
    expect(result.value.id).toBe('abc');
    expect(result.value.outcome).toBe('review');
  });

  it('infers outcome when the given one is unknown', () => {
    expect(createCard({ ...valid, outcome: 'nope' }).value.outcome).toBe('approved');
  });

  it('does not mutate the input', () => {
    const input = { ...valid };
    createCard(input);
    expect(input).toEqual(valid);
  });

  it('generates distinct ids', () => {
    expect(createCard(valid).value.id).not.toBe(createCard(valid).value.id);
  });

  it.each([
    ['12 digits', '424242424242', true],
    ['19 digits', '4242424242424242424', true],
    ['11 digits', '42424242424', false],
    ['20 digits', '42424242424242424242', false],
    ['empty', '', false],
  ])('number length boundary: %s', (_label, cardNumber, ok) => {
    const result = createCard({ ...valid, cardNumber });
    expect(result.ok).toBe(ok);
    if (!ok) expect(result.errors).toEqual(['card.number_length']);
  });

  it.each([
    ['1 char', 'a', true],
    ['120 chars', 'x'.repeat(120), true],
    ['121 chars', 'x'.repeat(121), false],
  ])('response length boundary: %s', (_label, cardResponse, ok) => {
    const result = createCard({ ...valid, cardResponse });
    expect(result.ok).toBe(ok);
    if (!ok) expect(result.errors).toEqual(['card.response_length']);
  });

  it('rejects whitespace-only response as required', () => {
    expect(createCard({ ...valid, cardResponse: '   ' }).errors).toEqual(['card.response_required']);
  });

  it('rejects non-string fields with type errors and reports all at once', () => {
    const result = createCard({ cardNumber: 4242424242424242, cardResponse: null, id: 5 });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(['card.number_type', 'card.response_type', 'card.id_type']);
  });

  it('rejects empty id string', () => {
    expect(createCard({ ...valid, id: '' }).errors).toEqual(['card.id_type']);
  });

  it.each([null, undefined, 'x', 42, []])('rejects non-object input %p', (input) => {
    expect(createCard(input)).toEqual({ ok: false, errors: ['card.invalid_input'] });
  });

  it('accepts unicode / special chars in response', () => {
    const result = createCard({ ...valid, cardResponse: "Rechazada 'OR 1=1 -- 日本語" });
    expect(result.ok).toBe(true);
    expect(result.value.outcome).toBe('declined');
  });

  it('exposes limits', () => {
    expect(CARD_LIMITS).toEqual({ minDigits: 12, maxDigits: 19, maxResponseLength: 120, maxNoteLength: 160 });
  });

  describe('note', () => {
    it('is trimmed and kept when present', () => {
      expect(createCard({ ...valid, note: '  Titular: APRO ' }).value.note).toBe('Titular: APRO');
    });
    it.each([undefined, null, '', '   '])('is omitted for %p', (note) => {
      expect('note' in createCard({ ...valid, note }).value).toBe(false);
    });
    it('accepts 160 chars and rejects 161', () => {
      expect(createCard({ ...valid, note: 'n'.repeat(160) }).ok).toBe(true);
      expect(createCard({ ...valid, note: 'n'.repeat(161) }).errors).toEqual(['card.note_length']);
    });
    it('rejects non-string notes', () => {
      expect(createCard({ ...valid, note: 5 }).errors).toEqual(['card.note_type']);
    });
  });
});

describe('cardIdentityKey', () => {
  it('combines number and trimmed lowercase response', () => {
    const a = cardIdentityKey({ cardNumber: '4242424242424242', cardResponse: ' APRO ' });
    const b = cardIdentityKey({ cardNumber: '4242 4242 4242 4242', cardResponse: 'apro' });
    const c = cardIdentityKey({ cardNumber: '4242424242424242', cardResponse: 'OTHE' });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe('isKnownTestNumber', () => {
  const known = new Set(['4242424242424242']);
  it('matches known numbers after normalization', () => {
    expect(isKnownTestNumber('4242 4242 4242 4242', known)).toBe(true);
  });
  it('returns false for unknown numbers', () => {
    expect(isKnownTestNumber('5555555555554444', known)).toBe(false);
  });
  it('returns false when the set is missing or invalid', () => {
    expect(isKnownTestNumber('4242424242424242', null)).toBe(false);
    expect(isKnownTestNumber('4242424242424242', ['4242424242424242'])).toBe(false);
  });
});
