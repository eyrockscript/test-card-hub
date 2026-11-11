import { describe, expect, it } from 'vitest';
import { SCAN_LIMITS, maskCardNumber, scanForRealCards } from '../src/application/scan-cards.js';

const sets = {
  knownNumbers: new Set(['4242424242424242', '4000000000000002']),
  environmentNumbers: new Set(['5555555555554444']),
};
// Luhn-valid Visa that is not a published test number.
const SUSPECT = '4912345678901230';

describe('maskCardNumber', () => {
  it('keeps the first 6 and last 4 digits only (PCI DSS display rule)', () => {
    expect(maskCardNumber(SUSPECT)).toBe('491234******1230');
  });
});

describe('scanForRealCards', () => {
  it('flags a Luhn-valid unknown number with its line and column, masked', () => {
    const text = 'const ok = "4242 4242 4242 4242";\nconst bad = "4912 3456 7890 1230";';
    const result = scanForRealCards(text, sets);
    expect(result.findings).toEqual([
      { line: 2, column: 14, masked: '491234******1230', brand: 'visa', digits: 16 },
    ]);
    expect(result.knownTestNumbers).toBe(1);
    expect(JSON.stringify(result)).not.toContain(SUSPECT);
  });

  it('accepts dashes and plain digits', () => {
    expect(scanForRealCards(`a 4912-3456-7890-1230 b ${SUSPECT}`, sets).findings).toHaveLength(2);
  });

  it('ignores Luhn-invalid numbers, unknown brands and saved environment numbers', () => {
    const text = '4912345678901231 9123456789012348 5555 5555 5555 4444';
    const result = scanForRealCards(text, sets);
    expect(result.findings).toEqual([]);
    expect(result.userEnvironmentNumbers).toBe(1);
  });

  it('finds a card followed by its CVV or expiry in the same run of digits', () => {
    const result = scanForRealCards('card 4912 3456 7890 1230 123 12 30', sets);
    expect(result.findings).toEqual([{ line: 1, column: 6, masked: '491234******1230', brand: 'visa', digits: 16 }]);
  });

  it('finds two cards separated by a single space', () => {
    const result = scanForRealCards(`${SUSPECT} 4242424242424242 ${SUSPECT}`, sets);
    expect(result.totalFindings).toBe(2);
    expect(result.knownTestNumbers).toBe(1);
  });

  it('does not join digits that are part of a longer number', () => {
    expect(scanForRealCards(`id=1${SUSPECT}9`, sets).findings).toEqual([]);
  });

  it('caps findings and says so', () => {
    const text = Array.from({ length: SCAN_LIMITS.maxFindings + 5 }, () => SUSPECT).join('\n');
    const result = scanForRealCards(text, sets);
    expect(result.findings).toHaveLength(SCAN_LIMITS.maxFindings);
    expect(result.totalFindings).toBe(SCAN_LIMITS.maxFindings + 5);
    expect(result.notice).toMatch(/Showing 50 of 55/);
  });

  it('returns a clean verdict when nothing suspicious is found', () => {
    const result = scanForRealCards('nothing here 4242424242424242', sets);
    expect(result).toMatchObject({ verdict: 'clean', totalFindings: 0 });
    expect(result.notice).toBeUndefined();
  });

  it('reports possible real cards in the verdict', () => {
    expect(scanForRealCards(SUSPECT, sets).verdict).toBe('possibly_real_cards_found');
  });
});

describe('scanForRealCards review fixes', () => {
  const REAL_LIKE = '5425233430109903';

  it('masks numbers shorter than 16 digits to the last 4 only', () => {
    expect(maskCardNumber('400000000002')).toBe('********0002');
    expect(maskCardNumber('378282246310005')).toBe('***********0005');
  });

  it('does not lose a card merged with a leading group into an unknown-brand number', () => {
    const result = scanForRealCards(`qty 18 ${REAL_LIKE}`, sets);
    expect(result.findings).toEqual([{ line: 1, column: 8, masked: '542523******9903', brand: 'mastercard', digits: 16 }]);
  });

  it('prefers a published test number over a longer merge with its CVV', () => {
    const result = scanForRealCards('4242424242424242 123', sets);
    expect(result).toMatchObject({ verdict: 'clean', knownTestNumbers: 1 });
  });

  it('scans 200,000 characters of findings in linear time', () => {
    const text = `${REAL_LIKE}\n`.repeat(11_764);
    const started = performance.now();
    const result = scanForRealCards(text, sets);
    expect(performance.now() - started).toBeLessThan(1_000);
    expect(result.totalFindings).toBe(11_764);
    expect(result.findings.at(-1)).toMatchObject({ line: SCAN_LIMITS.maxFindings, column: 1 });
  });
});
