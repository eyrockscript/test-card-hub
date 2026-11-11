/**
 * Prompt templates surfaced by MCP clients (slash commands in Claude Code / Desktop).
 */
import { z } from 'zod';

/** @param {string} checkoutUrl @param {string} gateway */
export function checkoutMatrixPrompt(checkoutUrl, gateway) {
  return [
    `Test the checkout at ${checkoutUrl} against the ${gateway} sandbox, one scenario per outcome.`,
    '',
    `1. Call list_gateways and read the hint for "${gateway}" (expiry, CVV and cardholder-name rules).`,
    `2. Call find_test_cards with gateway "${gateway}" once per outcome: approved, declined, insufficient, review.`,
    '3. Before typing any number, call validate_card. Stop if the verdict is "possibly_real_card".',
    '4. With a browser tool (e.g. Playwright MCP), open the checkout and type every value in the card\'s "fill" '
      + 'object (card, expiry, CVV, postal code, and the cardholder name or email when present), then submit.',
    '5. Record what the UI showed for each scenario and whether it matches the expected outcome. When the '
      + 'checkout or its API returns a decline code, call explain_decline to check the message shown to the customer.',
    '',
    'Finish with a table: outcome | card (last 4) | expected | observed | pass/fail. '
      + 'Flag any scenario where the checkout shows success for a declined card, or a generic error with no message. '
      + `Offer to save the scenarios as a regression suite with generate_checkout_tests (gateway "${gateway}").`,
  ].join('\n');
}

/** @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server @param {{ id: string }[]} presets */
export function registerPrompts(server, presets) {
  const gatewayIds = presets.map((p) => p.id);
  server.registerPrompt('checkout_test_matrix', {
    title: 'Checkout test matrix',
    description: 'Runs approved / declined / insufficient funds / review scenarios against a checkout with a browser tool.',
    argsSchema: {
      checkoutUrl: z.url({ protocol: /^https?$/ }).describe('http(s) URL of the checkout page in test mode.'),
      gateway: z.enum(gatewayIds).describe(`Gateway id: ${gatewayIds.join(', ')}.`),
    },
  }, ({ checkoutUrl, gateway }) => ({
    messages: [{ role: 'user', content: { type: 'text', text: checkoutMatrixPrompt(checkoutUrl, gateway) } }],
  }));
}
