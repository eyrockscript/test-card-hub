import { describe, expect, it } from 'vitest';
import { CATEGORY_GUIDANCE, explainDecline } from '../src/application/explain-decline.js';

const data = {
  stripe: {
    gateway: 'stripe',
    verifiedAt: '2026-11-10',
    declineCodes: [
      { code: 'insufficient_funds', officialMeaning: 'The card has insufficient funds.', category: 'insufficient_funds', retryable: false, sourceUrl: 'https://docs.stripe.com/declines/codes' },
      { code: 'weird_code', officialMeaning: 'Something.', category: 'not_a_category', retryable: null, sourceUrl: 'https://docs.stripe.com/declines/codes' },
    ],
  },
};

describe('explainDecline', () => {
  it('separates the official meaning from the suggested guidance', () => {
    const result = explainDecline({ gateway: 'stripe', code: 'INSUFFICIENT_FUNDS ', lang: 'es' }, data);
    expect(result.ok).toBe(true);
    expect(result.value.official).toEqual({
      meaning: 'The card has insufficient funds.', category: 'insufficient_funds', retryable: false,
      sourceUrl: 'https://docs.stripe.com/declines/codes', verifiedAt: '2026-11-10',
    });
    expect(result.value.suggested.customerMessage).toBe(CATEGORY_GUIDANCE.insufficient_funds.es);
    expect(result.value.suggested.note).toMatch(/not gateway documentation/);
  });

  it('defaults to English and falls back to generic guidance for unknown categories', () => {
    const result = explainDecline({ gateway: 'stripe', code: 'weird_code' }, data);
    expect(result.value.suggested.customerMessage).toBe(CATEGORY_GUIDANCE.other.en);
  });

  it('lists the codes when no code is given', () => {
    const result = explainDecline({ gateway: 'stripe' }, data);
    expect(result.value).toMatchObject({ gateway: 'stripe', total: 2, shown: 2 });
    expect(result.value.codes[0]).toEqual({ code: 'insufficient_funds', category: 'insufficient_funds', meaning: 'The card has insufficient funds.' });
  });

  it('rejects unknown gateways and codes with the valid options', () => {
    expect(explainDecline({ gateway: 'paypal', code: 'x' }, data).error).toContain('Available: stripe');
    expect(explainDecline({ gateway: 'stripe', code: 'nope' }, data).error).toContain('Known codes: insufficient_funds, weird_code');
  });

  it('has customer copy in both languages for every category', () => {
    for (const guidance of Object.values(CATEGORY_GUIDANCE)) {
      expect(guidance.es).toBeTruthy();
      expect(guidance.en).toBeTruthy();
      expect(guidance.action).toBeTruthy();
    }
  });
});

describe('explainDecline review fixes', () => {
  it('rejects prototype keys as unknown gateways instead of crashing', () => {
    for (const gateway of ['__proto__', 'constructor', 'toString']) {
      expect(explainDecline({ gateway }, data)).toMatchObject({ ok: false });
    }
  });

  it('explains why a gateway has no codes, using its documented gaps', () => {
    const blocked = { kushki: { gateway: 'kushki', verifiedAt: '2026-11-10', declineCodes: [], gaps: ['BLOCKED: docs need a password.'] } };
    const result = explainDecline({ gateway: 'kushki', code: '017' }, blocked);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('BLOCKED: docs need a password.');
  });
});
