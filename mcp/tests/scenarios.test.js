import { describe, expect, it } from 'vitest';
import { GATEWAY_PRESETS } from '../core/data/gateway-presets.js';
import { buildScenarios } from '../src/application/scenarios.js';
import { GATEWAY_RESEARCH } from '../src/data/gateway-research/index.js';

const NOW = new Date('2026-11-10T12:00:00Z');
const preset = (id) => GATEWAY_PRESETS.find((p) => p.id === id);
const build = (id, options = {}) => buildScenarios(preset(id), GATEWAY_RESEARCH[id], { now: NOW, lang: 'es', ...options });

describe('buildScenarios with official field rules', () => {
  it('NetPay: the customer email decides the outcome', () => {
    const emails = build('netpay').map((s) => [s.outcome, s.email]);
    expect(emails).toContainEqual(['approved', 'accept@netpay.com.mx']);
    expect(emails).toContainEqual(['declined', 'reject@netpay.com.mx']);
    expect(emails).toContainEqual(['review', 'review@netpay.com.mx']);
    expect(build('netpay').every((s) => s.fieldSources.email === 'gateway_docs')).toBe(true);
  });

  it('Mercado Pago: cardholder name, fixed expiry and CVV from the docs', () => {
    const [approved] = build('mercado-pago', { outcomes: ['approved'] });
    expect(approved).toMatchObject({ cardholderName: 'APRO', expiry: '11/30', cvv: '123' });
    expect(approved.fieldSources).toMatchObject({ cardholderName: 'gateway_docs', expiry: 'gateway_docs', cvv: 'gateway_docs' });
  });

  it('PayU: name, CVV and expiry month follow the outcome', () => {
    const scenarios = build('payu-latam');
    const amex = scenarios.find((s) => s.brand === 'amex');
    expect(amex).toMatchObject({ cardholderName: 'APPROVED', cvv: '7777' });
    expect(amex.expiry.startsWith('05/')).toBe(true);
    const declined = scenarios.find((s) => s.outcome === 'declined');
    expect(declined).toMatchObject({ cardholderName: 'REJECTED', cvv: '666' });
    expect(declined.expiry.startsWith('07/')).toBe(true);
  });

  it('Adyen: fixed expiry 03/2030 and CVC 737 for every card', () => {
    const scenarios = build('adyen');
    expect(scenarios.every((s) => s.expiry === '03/2030')).toBe(true);
    expect(scenarios.filter((s) => s.brand !== 'amex').every((s) => s.cvv === '737')).toBe(true);
  });

  it('Stripe: any future date and any CVC, labelled as such', () => {
    const [first] = build('stripe');
    expect(first).toMatchObject({ expiry: '12/30', cvv: '123' });
    expect(first.fieldSources).toMatchObject({ expiry: 'any_future_date', cvv: 'any_value' });
  });

  it('works without research data and filters by outcome', () => {
    const scenarios = buildScenarios(preset('kushki'), undefined, { now: NOW, lang: 'en', outcomes: ['declined'] });
    expect(scenarios.length).toBeGreaterThan(0);
    expect(scenarios.every((s) => s.outcome === 'declined')).toBe(true);
    expect(scenarios[0].name).toMatch(/^[A-Z]/);
  });

  it('keeps one scenario per preset card', () => {
    for (const p of GATEWAY_PRESETS) expect(build(p.id)).toHaveLength(p.cards.length);
  });
});

describe('gateway research data integrity', () => {
  const CATEGORIES = new Set(['insufficient_funds', 'card_declined', 'expired_card', 'incorrect_cvc', 'incorrect_number',
    'fraud_suspected', 'authentication_required', 'processing_error', 'limit_exceeded', 'do_not_honor', 'invalid_request', 'other']);

  it('has research for every preset gateway', () => {
    expect(Object.keys(GATEWAY_RESEARCH).sort()).toEqual(GATEWAY_PRESETS.map((p) => p.id).sort());
  });

  it('every decline code has a meaning, a known category and an https source', () => {
    for (const [id, data] of Object.entries(GATEWAY_RESEARCH)) {
      for (const d of data.declineCodes) {
        expect(typeof d.code, `${id} code`).toBe('string');
        expect(d.officialMeaning, `${id} ${d.code}`).toBeTruthy();
        expect(CATEGORIES.has(d.category), `${id} ${d.code} category ${d.category}`).toBe(true);
        expect(d.sourceUrl, `${id} ${d.code}`).toMatch(/^https:\/\//);
      }
    }
  });

  it('documents what the docs did not state', () => {
    for (const data of Object.values(GATEWAY_RESEARCH)) expect(Array.isArray(data.gaps)).toBe(true);
  });
});
