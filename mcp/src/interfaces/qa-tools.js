/**
 * QA tools: real-card scanner, Playwright test generator and decline-code explainer.
 */
import { z } from 'zod';
import { OUTCOMES } from '../../core/domain/index.js';
import { explainDecline } from '../application/explain-decline.js';
import { renderPlaywrightSpec } from '../application/generate-tests.js';
import { SCAN_LIMITS, scanForRealCards } from '../application/scan-cards.js';
import { buildScenarios } from '../application/scenarios.js';
import { READ_ONLY, failure, json, langSchema, loadEnvironmentNumbers } from './responses.js';

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {{ version: string, presets: object[], now: () => Date, research: Record<string, object>,
 *   loadEnvironments: () => Promise<{ environments: object[] }> }} deps
 * @param {Set<string>} knownNumbers
 */
export function registerQaTools(server, deps, knownNumbers) {
  registerScan(server, deps, knownNumbers);
  registerGenerate(server, deps);
  registerExplain(server, deps);
}

function registerScan(server, deps, knownNumbers) {
  server.registerTool('scan_for_real_cards', {
    title: 'Scan text for real card numbers',
    description: 'Scans text (source code, test fixtures, logs, seed data) for card numbers that may be REAL: '
      + 'Luhn-valid, a known brand, and not a published sandbox number. Findings are masked (first 6 + last 4; '
      + 'last 4 only under 16 digits) and include line and column. Detects digits that are contiguous or grouped by '
      + 'single spaces or dashes; numbers split across lines or by dots are not detected. '
      + `Pass the file contents as text; this server never reads files. `
      + `Limits: ${SCAN_LIMITS.maxChars} characters per call, ${SCAN_LIMITS.maxFindings} findings shown.`,
    inputSchema: { text: z.string().max(SCAN_LIMITS.maxChars).describe('Text to scan, e.g. a file\'s contents.') },
    annotations: READ_ONLY,
  }, async ({ text }) => {
    const environmentNumbers = await loadEnvironmentNumbers(deps.loadEnvironments);
    return json(scanForRealCards(text, { knownNumbers, environmentNumbers }));
  });
}

function registerGenerate(server, deps) {
  server.registerTool('generate_checkout_tests', {
    title: 'Generate checkout tests',
    description: 'Writes a Playwright test file (TypeScript) with one test per sandbox scenario of a gateway: card, '
      + 'expiry, CVV, and the extra fields the gateway needs (e.g. NetPay customer email, Mercado Pago or Adyen '
      + 'cardholder name), taken from official docs. Selectors in fillCheckout/expectOutcome are a starting point '
      + 'the user must map to their checkout. Returns the file contents; the server writes nothing to disk.',
    inputSchema: {
      gateway: z.string().describe('Gateway id from list_gateways, e.g. "netpay".'),
      checkoutUrl: z.url({ protocol: /^https?$/ }).describe('http(s) URL of the checkout in test mode.'),
      outcomes: z.array(z.enum(OUTCOMES)).max(OUTCOMES.length).optional().describe('Only these outcomes. Default: all.'),
      lang: langSchema,
    },
    annotations: READ_ONLY,
  }, async ({ gateway, checkoutUrl, outcomes, lang }) => {
    const preset = deps.presets.find((p) => p.id === gateway);
    if (!preset) return failure(`Unknown gateway "${gateway}". Valid ids: ${deps.presets.map((p) => p.id).join(', ')}.`);
    const scenarios = buildScenarios(preset, deps.research[gateway], { now: deps.now(), lang: lang ?? 'en', outcomes });
    if (scenarios.length === 0) return failure(`No ${gateway} cards for outcomes: ${outcomes.join(', ')}.`);
    const code = renderPlaywrightSpec({ gatewayName: preset.name, docsUrl: preset.docsUrl, verifiedAt: preset.verifiedAt, checkoutUrl, version: deps.version, scenarios });
    const summary = {
      filename: `${gateway}-checkout.spec.ts`,
      scenarios: scenarios.length,
      fieldSources: Object.fromEntries(scenarios.map((s) => [s.name, s.fieldSources])),
      nextSteps: ['Save the file under your Playwright tests folder.', 'Map fillCheckout/expectOutcome to your checkout selectors.', 'Run with CHECKOUT_URL pointing at a sandbox checkout.'],
    };
    return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }, { type: 'text', text: code }] };
  });
}

function registerExplain(server, deps) {
  const gateways = Object.keys(deps.research).filter((id) => deps.research[id].declineCodes?.length);
  server.registerTool('explain_decline', {
    title: 'Explain a decline code',
    description: 'Explains a payment decline / error code of a gateway: the official meaning and source URL (from '
      + 'the gateway docs) plus a SUGGESTED customer message (es/en) and merchant action. Omit code to list the '
      + `known codes of a gateway. Gateways: ${gateways.join(', ')}.`,
    inputSchema: {
      gateway: z.string().describe('Gateway id, e.g. "stripe".'),
      code: z.string().max(80).optional().describe('Decline/error code exactly as the gateway returned it.'),
      lang: langSchema,
    },
    annotations: READ_ONLY,
  }, async ({ gateway, code, lang }) => {
    const result = explainDecline({ gateway, code, lang }, deps.research);
    return result.ok ? json(result.value) : failure(result.error);
  });
}
