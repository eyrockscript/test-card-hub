import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';
import { GATEWAY_PRESETS } from '../core/data/gateway-presets.js';
import { GATEWAY_RESEARCH } from '../src/data/gateway-research/index.js';
import { createServer } from '../src/interfaces/server.js';

const STAGING = { environment: 'Staging', cards: [{ cardNumber: '5555555555554444', cardResponse: 'OK', outcome: 'approved' }] };

async function connect(backup) {
  const server = createServer({
    version: 'test',
    presets: GATEWAY_PRESETS,
    research: GATEWAY_RESEARCH,
    now: () => new Date('2026-11-10T12:00:00Z'),
    loadEnvironments: async () => backup,
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

const call = async (client, name, args = {}) => {
  const result = await client.callTool({ name, arguments: args });
  const text = result.content[0].text;
  return { isError: result.isError === true, text, body: result.isError ? null : JSON.parse(text) };
};

const NONE = { environments: [], configured: false };
const LOADED = { environments: [STAGING], configured: true };

describe('MCP server', () => {
  it('exposes the seven read-only tools and the matrix prompt', async () => {
    const client = await connect(NONE);
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      'explain_decline', 'find_test_cards', 'generate_checkout_tests', 'list_environments', 'list_gateways', 'scan_for_real_cards', 'validate_card',
    ]);
    expect(tools.every((t) => t.annotations.readOnlyHint)).toBe(true);
    const { prompts } = await client.listPrompts();
    expect(prompts.map((p) => p.name)).toEqual(['checkout_test_matrix']);
  });

  it('list_gateways returns presets', async () => {
    const { body } = await call(await connect(NONE), 'list_gateways', { lang: 'es' });
    expect(body.length).toBe(GATEWAY_PRESETS.length);
  });

  it('find_test_cards filters and validates its input', async () => {
    const client = await connect(NONE);
    const { body } = await call(client, 'find_test_cards', { gateway: 'stripe', outcome: 'declined' });
    expect(body.cards.every((c) => c.outcome === 'declined' && c.gateway === 'stripe')).toBe(true);
    expect(body.ok).toBeUndefined();
    const invalid = await call(client, 'find_test_cards', { outcome: 'maybe' });
    expect(invalid.isError).toBe(true);
  });

  it('find_test_cards reports unknown gateways as tool errors', async () => {
    const result = await call(await connect(NONE), 'find_test_cards', { gateway: 'paypal' });
    expect(result.isError).toBe(true);
    expect(result.text).toContain('Valid ids');
  });

  it('find_test_cards keeps working with presets when the backup is broken', async () => {
    const { body } = await call(await connect({ environments: [], configured: true, error: 'Cannot read backup file (ENOENT).' }), 'find_test_cards', { gateway: 'conekta' });
    expect(body.total).toBeGreaterThan(0);
    expect(body.backupError).toContain('ENOENT');
  });

  it('find_test_cards reports the backup cause when an environment is requested', async () => {
    const broken = await call(await connect({ environments: [], configured: true, error: 'Cannot read backup file (ENOENT).' }), 'find_test_cards', { environment: 'qa' });
    expect(broken).toMatchObject({ isError: true, text: 'Cannot read backup file (ENOENT).' });
    const unset = await call(await connect(NONE), 'find_test_cards', { environment: 'qa' });
    expect(unset.text).toContain('--backup');
    const missing = await call(await connect(LOADED), 'find_test_cards', { environment: 'prod' });
    expect(missing.text).toContain('Unknown environment');
  });

  it('checkout_test_matrix rejects non-http URLs and unknown gateways', async () => {
    const client = await connect(NONE);
    await expect(client.getPrompt({ name: 'checkout_test_matrix', arguments: { checkoutUrl: 'javascript:alert(1)', gateway: 'stripe' } })).rejects.toThrow();
    await expect(client.getPrompt({ name: 'checkout_test_matrix', arguments: { checkoutUrl: 'https://shop.test/pay', gateway: 'paypal' } })).rejects.toThrow();
  });

  it('list_environments explains how to configure the backup', async () => {
    const result = await call(await connect(NONE), 'list_environments');
    expect(result.isError).toBe(true);
    expect(result.text).toContain('--backup');
  });

  it('list_environments surfaces backup errors and warnings', async () => {
    const broken = await call(await connect({ environments: [], configured: true, error: 'bad' }), 'list_environments');
    expect(broken).toMatchObject({ isError: true, text: 'bad' });
    const warned = await call(await connect({ ...LOADED, warnings: ['environment.duplicate'] }), 'list_environments');
    expect(warned.body).toEqual({
      environments: [{ name: 'Staging', cardCount: 1, outcomes: { approved: 1, declined: 0, insufficient: 0, review: 0, other: 0 } }],
      warnings: ['environment.duplicate'],
    });
  });

  it('list_environments returns loaded environments', async () => {
    const { body } = await call(await connect(LOADED), 'list_environments');
    expect(body.environments[0].name).toBe('Staging');
  });

  it('validate_card knows presets and user environment numbers', async () => {
    const client = await connect(LOADED);
    expect((await call(client, 'validate_card', { number: '4242424242424242' })).body.verdict).toBe('known_test_number');
    expect((await call(client, 'validate_card', { number: '5555555555554444' })).body.verdict).not.toBe('possibly_real_card');
    expect((await call(client, 'validate_card', { number: '4912345678901230' })).body.verdict).toBe('possibly_real_card');
  });

  it('checkout_test_matrix renders the scenario plan', async () => {
    const client = await connect(NONE);
    const prompt = await client.getPrompt({ name: 'checkout_test_matrix', arguments: { checkoutUrl: 'http://localhost:3000/pay', gateway: 'stripe' } });
    const text = prompt.messages[0].content.text;
    expect(text).toContain('http://localhost:3000/pay');
    expect(text).toContain('validate_card');
  });

  it('scan_for_real_cards masks suspects and never echoes the full number', async () => {
    const result = await call(await connect(LOADED), 'scan_for_real_cards', { text: 'a=4242424242424242\nb="4912 3456 7890 1230"\nc=5555555555554444' });
    expect(result.body).toMatchObject({ verdict: 'possibly_real_cards_found', totalFindings: 1, knownTestNumbers: 2, userEnvironmentNumbers: 0 });
    expect(result.body.findings[0]).toEqual({ line: 2, column: 4, masked: '491234******1230', brand: 'visa', digits: 16 });
    expect(result.text).not.toContain('4912345678901230');
  });

  it('generate_checkout_tests returns a summary and the Playwright file', async () => {
    const result = await (await connect(NONE)).callTool({ name: 'generate_checkout_tests', arguments: { gateway: 'netpay', checkoutUrl: 'http://localhost:3000/pay', outcomes: ['approved', 'declined'], lang: 'es' } });
    const summary = JSON.parse(result.content[0].text);
    expect(summary).toMatchObject({ filename: 'netpay-checkout.spec.ts' });
    expect(summary.scenarios).toBeGreaterThan(1);
    const code = result.content[1].text;
    expect(code).toContain("from '@playwright/test'");
    expect(code).toContain('email: "accept@netpay.com.mx"');
    expect(code).toContain('email: "reject@netpay.com.mx"');
  });

  it('generate_checkout_tests rejects unknown gateways and empty selections', async () => {
    const client = await connect(NONE);
    const unknown = await call(client, 'generate_checkout_tests', { gateway: 'paypal', checkoutUrl: 'https://shop.test/pay' });
    expect(unknown.text).toContain('Valid ids');
    const empty = await call(client, 'generate_checkout_tests', { gateway: 'netpay', checkoutUrl: 'https://shop.test/pay', outcomes: ['insufficient'] });
    expect(empty).toMatchObject({ isError: true });
    const badUrl = await call(client, 'generate_checkout_tests', { gateway: 'netpay', checkoutUrl: 'file:///etc/passwd' });
    expect(badUrl.isError).toBe(true);
  });

  it('explain_decline gives the official meaning plus labelled suggestions', async () => {
    const client = await connect(NONE);
    const { body } = await call(client, 'explain_decline', { gateway: 'stripe', code: 'insufficient_funds', lang: 'es' });
    expect(body.official).toMatchObject({ category: 'insufficient_funds', sourceUrl: expect.stringMatching(/^https:\/\/docs\.stripe\.com/) });
    expect(body.suggested.customerMessage).toMatch(/fondos/);
    const list = await call(client, 'explain_decline', { gateway: 'mercado-pago' });
    expect(list.body.total).toBeGreaterThan(10);
    const missing = await call(client, 'explain_decline', { gateway: 'stripe', code: 'not_a_code' });
    expect(missing.isError).toBe(true);
  });
});
