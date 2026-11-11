/**
 * MCP delivery layer: registers tools and prompts, maps use-case results to MCP responses.
 * Transport-agnostic: the bin entrypoint connects it to stdio.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OUTCOMES, createDefaultEnvironments } from '../../core/domain/index.js';
import { buildKnownNumbers } from '../../core/ui/view-model.js';
import { RESULT_LIMITS, findCards, listEnvironments, listGateways } from '../application/catalog.js';
import { validateCard } from '../application/validate-card.js';
import { registerPrompts } from './prompts.js';
import { registerQaTools } from './qa-tools.js';
import { READ_ONLY, failure, json, langSchema, loadEnvironmentNumbers } from './responses.js';

const BRANDS = ['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay', 'unknown'];

const NOT_CONFIGURED = 'No backup file configured. In the extension use "Export", then start the server '
  + 'with --backup <path> or TEST_CARD_HUB_BACKUP=<path>. Gateway presets work without it.';

/**
 * @param {{ version: string, presets: object[], now: () => Date, research?: Record<string, object>,
 *   loadEnvironments: () => Promise<import('../infrastructure/backup-file.js').BackupLoad> }} deps
 */
export function createServer(options) {
  const deps = { research: {}, ...options };
  const server = new McpServer({ name: 'test-card-hub', version: deps.version });
  const knownNumbers = buildKnownNumbers(deps.presets, createDefaultEnvironments());
  registerGatewayTools(server, deps);
  registerEnvironmentTools(server, deps);
  registerValidateTool(server, deps, knownNumbers);
  registerQaTools(server, deps, knownNumbers);
  registerPrompts(server, deps.presets);
  return server;
}

function registerGatewayTools(server, deps) {
  server.registerTool('list_gateways', {
    title: 'List payment gateways',
    description: 'Lists the payment gateway sandboxes with official test cards (Stripe, Mercado Pago MX, Conekta, '
      + 'Openpay, NetPay, Kushki, Clip, PayU, dLocal, Adyen): id, docs URL, date verified, card count per outcome, '
      + 'and the gateway hint (expiry/CVV/cardholder-name rules). Call first to pick a gateway id.',
    inputSchema: { lang: langSchema },
    annotations: READ_ONLY,
  }, async ({ lang }) => json(listGateways(deps.presets, lang ?? 'en')));

  server.registerTool('find_test_cards', {
    title: 'Find test cards',
    description: 'Returns sandbox test cards to type into a checkout, filtered by gateway, outcome and brand. '
      + 'Each card includes the number, brand, expected outcome, gateway notes and generic fill values '
      + '(expiry, CVV, postal code). When gatewayHint contradicts fill values, the hint wins '
      + `(e.g. Mercado Pago decides the outcome by cardholder name). Returns at most ${RESULT_LIMITS.maxCards} cards `
      + `(default ${RESULT_LIMITS.defaultCards}); total tells how many matched.`,
    inputSchema: {
      gateway: z.string().optional().describe('Gateway id from list_gateways, e.g. "stripe".'),
      environment: z.string().optional().describe('User environment name from list_environments.'),
      source: z.enum(['all', 'gateways', 'environments']).optional().describe('Default "all".'),
      outcome: z.enum(OUTCOMES).optional().describe('Expected result of the charge.'),
      brand: z.enum(BRANDS).optional(),
      lang: langSchema,
      limit: z.number().int().min(1).max(RESULT_LIMITS.maxCards).optional(),
    },
    annotations: READ_ONLY,
  }, async (query) => {
    const backup = await deps.loadEnvironments();
    const result = findCards(query, { presets: deps.presets, environments: backup.environments, now: deps.now(), research: deps.research });
    if (!result.ok && query.environment && (backup.error || !backup.configured)) {
      return failure(backup.error ?? NOT_CONFIGURED);
    }
    if (!result.ok) return failure(result.error);
    const { ok, ...payload } = result;
    return json(backup.error ? { ...payload, backupError: backup.error } : payload);
  });
}

function registerEnvironmentTools(server, deps) {
  server.registerTool('list_environments', {
    title: 'List my environments',
    description: 'Lists the environments saved in the Test Card Hub extension (development, staging, a client), '
      + 'read from the exported backup file configured on the server. Use the names with find_test_cards.',
    inputSchema: {},
    annotations: READ_ONLY,
  }, async () => {
    const backup = await deps.loadEnvironments();
    if (!backup.configured) return failure(NOT_CONFIGURED);
    if (backup.error) return failure(backup.error);
    const environments = listEnvironments(backup.environments);
    return json(backup.warnings ? { environments, warnings: backup.warnings } : { environments });
  });
}

function registerValidateTool(server, deps, knownNumbers) {
  server.registerTool('validate_card', {
    title: 'Validate a card number',
    description: 'Checks a card number before using it in a checkout: Luhn, length, brand, and whether it is a '
      + 'known sandbox test number. verdict "possibly_real_card" means stop: never type it into a form.',
    inputSchema: { number: z.string().max(40).describe('Card number, spaces and dashes allowed.') },
    annotations: READ_ONLY,
  }, async ({ number }) => {
    const environmentNumbers = await loadEnvironmentNumbers(deps.loadEnvironments);
    return json(validateCard(number, { knownNumbers, environmentNumbers }));
  });
}
