import { describe, expect, it } from 'vitest';
import { renderPlaywrightSpec } from '../src/application/generate-tests.js';

const base = {
  gatewayName: 'NetPay (México)',
  docsUrl: 'https://docs.netpay.com.mx/reference/matriz-de-pruebas-2',
  verifiedAt: '2026-10-29',
  checkoutUrl: 'http://localhost:3000/pay',
  version: '9.9.9',
  scenarios: [
    { name: 'Aprobada (Visa)', outcome: 'approved', cardNumber: '4000000000000002', expiry: '12/30', cvv: '123', email: 'accept@netpay.com.mx' },
    { name: 'Rechazada (Visa)', outcome: 'declined', cardNumber: '4000000000000002', expiry: '12/30', cvv: '123', email: 'reject@netpay.com.mx', cardholderName: '' },
  ],
};

describe('renderPlaywrightSpec', () => {
  it('embeds every scenario, the source and the checkout URL', () => {
    const spec = renderPlaywrightSpec(base);
    expect(spec).toContain("import { test, expect, type Page } from '@playwright/test';");
    expect(spec).toContain('// Source: https://docs.netpay.com.mx/reference/matriz-de-pruebas-2');
    expect(spec).toContain('process.env.CHECKOUT_URL ?? "http://localhost:3000/pay"');
    expect(spec).toContain('{ name: "Aprobada (Visa)", outcome: "approved", cardNumber: "4000000000000002", expiry: "12/30", cvv: "123", email: "accept@netpay.com.mx" },');
    expect(spec).toContain('test.describe("NetPay (México) checkout (sandbox)"');
  });

  it('omits empty optional fields', () => {
    expect(renderPlaywrightSpec(base)).not.toContain('cardholderName: ""');
  });

  it('keeps hostile values inside string literals', () => {
    const spec = renderPlaywrightSpec({
      ...base,
      checkoutUrl: 'http://x/"); process.exit(1); ("',
      scenarios: [{ ...base.scenarios[0], name: '"}]; require("fs") //' }],
    });
    expect(spec).toContain('?? "http://x/\\"); process.exit(1); (\\""');
    expect(spec).toContain('name: "\\"}]; require(\\"fs\\") //"');
  });
});

describe('renderPlaywrightSpec review fixes', () => {
  it('numbers test titles so two cards with the same label never collide', () => {
    const spec = renderPlaywrightSpec({ ...base, scenarios: [base.scenarios[0], base.scenarios[0]] });
    expect(spec).toContain('scenarios.forEach((s, i) => {');
    expect(spec).toContain('test(`${i + 1}. ${s.name}`');
  });

  it('says which values are generic instead of claiming every field is official', () => {
    expect(renderPlaywrightSpec(base)).toContain('fieldSources');
  });

  it('keeps header comments on one line even with hostile metadata', () => {
    const spec = renderPlaywrightSpec({ ...base, gatewayName: 'X */\nprocess.exit(1)', docsUrl: 'https://a\nb' });
    expect(spec).not.toContain('\nprocess.exit(1)');
    expect(spec).not.toContain('\nb\n');
  });
});
