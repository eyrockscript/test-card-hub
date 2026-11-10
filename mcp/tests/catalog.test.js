import { describe, expect, it } from 'vitest';
import { GATEWAY_PRESETS } from '../core/data/gateway-presets.js';
import { RESULT_LIMITS, findCards, listEnvironments, listGateways } from '../src/application/catalog.js';

const NOW = new Date('2026-11-10T12:00:00Z');
const ENVIRONMENTS = [
  {
    environment: 'Staging',
    cards: [
      { cardNumber: '4242424242424242', cardResponse: 'Aprobada', outcome: 'approved' },
      { cardNumber: '378282246310005', cardResponse: 'Rechazada', outcome: 'declined', note: 'Amex' },
    ],
  },
];
const data = { presets: GATEWAY_PRESETS, environments: ENVIRONMENTS, now: NOW };

describe('listGateways', () => {
  it('lists every preset with outcome counts and an English hint by default', () => {
    const gateways = listGateways(GATEWAY_PRESETS, 'en');
    expect(gateways.map((g) => g.id)).toContain('stripe');
    const stripe = gateways.find((g) => g.id === 'stripe');
    expect(stripe.hint).toBe(GATEWAY_PRESETS[0].hintEn);
    expect(Object.values(stripe.outcomes).reduce((a, b) => a + b, 0)).toBe(stripe.cardCount);
  });

  it('returns the Spanish hint for lang es', () => {
    expect(listGateways(GATEWAY_PRESETS, 'es')[0].hint).toBe(GATEWAY_PRESETS[0].hint);
  });
});

describe('listEnvironments', () => {
  it('summarizes user environments', () => {
    expect(listEnvironments(ENVIRONMENTS)).toEqual([
      { name: 'Staging', cardCount: 2, outcomes: { approved: 1, declined: 1, insufficient: 0, review: 0, other: 0 } },
    ]);
  });
});

describe('findCards', () => {
  it('filters by gateway and outcome', () => {
    const result = findCards({ gateway: 'stripe', outcome: 'insufficient' }, data);
    expect(result.ok).toBe(true);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]).toMatchObject({ source: 'gateway', gateway: 'stripe', cardNumber: '4000000000009995', brand: 'visa' });
    expect(result.cards[0].fill).toEqual({ expiry: '12/30', cvv: '123', postalCode: '10001' });
  });

  it('uses Spanish texts and a Mexican postal code for lang es', () => {
    const [card] = findCards({ gateway: 'stripe', outcome: 'insufficient', lang: 'es' }, data).cards;
    expect(card.description).toBe('Rechazada: fondos insuficientes');
    expect(card.note).toContain('Código de rechazo');
    expect(card.fill.postalCode).toBe('06600');
  });

  it('gives a 4-digit CVV for American Express', () => {
    const result = findCards({ source: 'environments', brand: 'amex' }, data);
    expect(result.cards[0]).toMatchObject({ source: 'environment', environment: 'Staging', note: 'Amex' });
    expect(result.cards[0].fill.cvv).toBe('1234');
  });

  it('matches environment names case-insensitively and can skip gateways', () => {
    const result = findCards({ environment: 'staging', source: 'environments' }, data);
    expect(result.total).toBe(2);
  });

  it('includes both sources by default', () => {
    const sources = new Set(findCards({ limit: 50 }, { ...data, presets: GATEWAY_PRESETS.slice(0, 1) }).cards.map((c) => c.source));
    expect(sources).toEqual(new Set(['gateway', 'environment']));
  });

  it('states truncation when more cards match than the limit', () => {
    const result = findCards({}, data);
    expect(result.shown).toBe(RESULT_LIMITS.defaultCards);
    expect(result.total).toBeGreaterThan(RESULT_LIMITS.defaultCards);
    expect(result.notice).toMatch(/^Showing 10 of \d+ cards/);
  });

  it('caps the limit at the maximum', () => {
    expect(findCards({ limit: 500 }, data).shown).toBeLessThanOrEqual(RESULT_LIMITS.maxCards);
  });

  it('omits the notice when everything fits', () => {
    expect(findCards({ gateway: 'stripe', outcome: 'approved' }, data).notice).toBeUndefined();
  });

  it('rejects an unknown gateway listing valid ids', () => {
    const result = findCards({ gateway: 'paypal' }, data);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('stripe');
  });

  it('rejects an unknown environment', () => {
    expect(findCards({ environment: 'prod' }, data)).toMatchObject({ ok: false });
  });

  it('falls back to the Spanish note when a preset has no English note', () => {
    const preset = { ...GATEWAY_PRESETS[0], id: 'x', cards: [{ cardNumber: '4242424242424242', cardResponse: 'A', cardResponseEn: 'A', outcome: 'approved', note: 'Solo español' }] };
    const [card] = findCards({ gateway: 'x' }, { ...data, presets: [preset] }).cards;
    expect(card.note).toBe('Solo español');
  });
});
