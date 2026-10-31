import { describe, expect, it } from 'vitest';
import { createDefaultEnvironments } from '../../src/domain/index.js';
import { GATEWAY_PRESETS } from '../../src/data/gateway-presets.js';
import {
  RATING_RULES, brandLabel, buildKnownNumbers, cardsToPublicJson, countCards, filterCards,
  formatVerifiedDate, formatWithCaret, isPresetAdded, numberFieldStatus, outcomeIcon,
  presetForLanguage, quickValues, shouldShowRatingPrompt,
} from '../../src/ui/view-model.js';

const DAY = 24 * 60 * 60 * 1000;
const cards = [
  { id: '1', cardNumber: '4242424242424242', cardResponse: 'Aprobada', outcome: 'approved' },
  { id: '2', cardNumber: '4000000000000002', cardResponse: 'Rechazada genérica', outcome: 'declined', note: 'Código generic_decline' },
];

describe('filterCards', () => {
  it('keeps everything for an empty query', () => {
    expect(filterCards(cards, '  ')).toBe(cards);
  });
  it('matches number digits ignoring spaces', () => {
    expect(filterCards(cards, '4000 0000').map((c) => c.id)).toEqual(['2']);
  });
  it('matches response and note text case-insensitively', () => {
    expect(filterCards(cards, 'APROB').map((c) => c.id)).toEqual(['1']);
    expect(filterCards(cards, 'generic_decline').map((c) => c.id)).toEqual(['2']);
  });
});

describe('quickValues', () => {
  it('uses current year plus four, two digits', () => {
    expect(quickValues(new Date('2026-10-29T12:00:00'), 'es').expiry).toBe('12/30');
    expect(quickValues(new Date('2097-01-01T12:00:00'), 'en').expiry).toBe('12/01');
  });
  it('picks the postal code by language', () => {
    const now = new Date('2026-01-01T12:00:00');
    expect(quickValues(now, 'es').postal).toBe('06600');
    expect(quickValues(now, 'en').postal).toBe('10001');
    expect(quickValues(now, 'en').cvv).toBe('123');
  });
});

describe('known numbers and presets', () => {
  const known = buildKnownNumbers(GATEWAY_PRESETS, createDefaultEnvironments());
  it('includes preset and default numbers', () => {
    expect(known.has('4242424242424242')).toBe(true);
    expect(known.has('5451951574925480')).toBe(true);
    expect(known.has('4916688123456741')).toBe(false);
  });
  it('detects an already added preset by name, ignoring case', () => {
    const state = [{ environment: ' stripe ', cards: [] }];
    expect(isPresetAdded(state, { name: 'Stripe' })).toBe(true);
    expect(isPresetAdded(state, { name: 'Conekta' })).toBe(false);
  });
  it('maps preset texts to the requested language', () => {
    const preset = GATEWAY_PRESETS.find((p) => p.id === 'stripe');
    const withNote = (input) => input.cards.find((c) => c.note);
    expect(presetForLanguage(preset, 'en').cards[0].cardResponse).toBe('Approved (Visa)');
    expect(presetForLanguage(preset, 'es').cards[0].cardResponse).toBe('Aprobada (Visa)');
    expect(withNote(presetForLanguage(preset, 'en')).note).toMatch(/Decline code/);
    expect(withNote(presetForLanguage(preset, 'es')).note).toMatch(/Código de rechazo/);
  });
  it('formats the verification date per language', () => {
    expect(formatVerifiedDate('2026-10-29', 'es')).toBe('29/10/2026');
    expect(formatVerifiedDate('2026-10-29', 'en')).toBe('10/29/2026');
  });
});

describe('display helpers', () => {
  it('labels brands and outcomes', () => {
    expect(brandLabel('4242424242424242')).toBe('VISA');
    expect(brandLabel('5555555555554444')).toBe('MC');
    expect(brandLabel('378282246310005')).toBe('AMEX');
    expect(brandLabel('')).toBe('—');
    expect(outcomeIcon('approved')).toBe('check');
    expect(outcomeIcon('other')).toBeNull();
  });
  it('serializes cards as public JSON without ids', () => {
    const json = JSON.parse(cardsToPublicJson({ cards }));
    expect(json[1]).toEqual({ cardNumber: '4000000000000002', cardResponse: 'Rechazada genérica', outcome: 'declined', note: 'Código generic_decline' });
    expect(json[0]).not.toHaveProperty('id');
    expect(json[0]).not.toHaveProperty('note');
  });
  it('counts cards across environments', () => {
    expect(countCards([{ cards }, { cards: [cards[0]] }])).toBe(3);
  });
});

describe('formatWithCaret', () => {
  it('formats and puts the caret after the same digit', () => {
    expect(formatWithCaret('42424', 5)).toEqual({ value: '4242 4', caret: 6 });
    expect(formatWithCaret('4242 42', 2)).toEqual({ value: '4242 42', caret: 2 });
    expect(formatWithCaret('42424242', 4)).toEqual({ value: '4242 4242', caret: 4 });
  });
  it('strips non digits and handles empty input', () => {
    expect(formatWithCaret('ab', 2)).toEqual({ value: '', caret: 0 });
    expect(formatWithCaret('4a2', 3).value).toBe('42');
  });
  it('uses Amex grouping', () => {
    expect(formatWithCaret('378282246310005', 15).value).toBe('3782 822463 10005');
  });
});

describe('numberFieldStatus', () => {
  const known = new Set(['4242424242424242']);
  it('classifies the number', () => {
    expect(numberFieldStatus('', known)).toBe('empty');
    expect(numberFieldStatus('4242', known)).toBe('short');
    expect(numberFieldStatus('4242424242424241', known)).toBe('luhn_failed');
    expect(numberFieldStatus('4916688123456741', known)).toBe('luhn_failed');
    expect(numberFieldStatus('4111111111111111', known)).toBe('unknown_number');
    expect(numberFieldStatus('4242424242424242', known)).toBe('known');
  });
});

describe('shouldShowRatingPrompt', () => {
  const now = 1_800_000_000_000;
  const base = { firstSeenAt: now - 6 * DAY, copyCount: RATING_RULES.minCopies, promptState: 'none', dismissedAt: 0, dismissCount: 0 };

  it('shows when both thresholds are met', () => {
    expect(shouldShowRatingPrompt(base, now)).toBe(true);
  });
  it('waits for 20 copies', () => {
    expect(shouldShowRatingPrompt({ ...base, copyCount: 19 }, now)).toBe(false);
  });
  it('waits for 5 days since first seen', () => {
    expect(shouldShowRatingPrompt({ ...base, firstSeenAt: now - 4.9 * DAY }, now)).toBe(false);
    expect(shouldShowRatingPrompt({ ...base, firstSeenAt: now - 5 * DAY }, now)).toBe(true);
  });
  it('never shows again once rated', () => {
    expect(shouldShowRatingPrompt({ ...base, promptState: 'rated' }, now)).toBe(false);
  });
  it('does not show without a first-seen date', () => {
    expect(shouldShowRatingPrompt({ ...base, firstSeenAt: 0 }, now)).toBe(false);
  });
  it('waits 60 days after the first dismissal', () => {
    const dismissed = { ...base, promptState: 'dismissed', dismissCount: 1 };
    expect(shouldShowRatingPrompt({ ...dismissed, dismissedAt: now - 59 * DAY }, now)).toBe(false);
    expect(shouldShowRatingPrompt({ ...dismissed, dismissedAt: now - 60 * DAY }, now)).toBe(true);
  });
  it('caps the prompt at two showings', () => {
    const twice = { ...base, promptState: 'dismissed', dismissCount: 2, dismissedAt: now - 365 * DAY };
    expect(shouldShowRatingPrompt(twice, now)).toBe(false);
  });
  it('ignores unknown prompt states', () => {
    expect(shouldShowRatingPrompt({ ...base, promptState: 'weird' }, now)).toBe(false);
  });
});

describe('gateway presets', () => {
  it('only link to https docs', () => {
    for (const preset of GATEWAY_PRESETS) expect(preset.docsUrl.startsWith('https://')).toBe(true);
  });
});
