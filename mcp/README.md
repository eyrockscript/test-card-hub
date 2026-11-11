# test-card-hub-mcp

MCP server that gives AI agents the official sandbox test cards of Latin American and global payment gateways, so they can test a checkout end to end: approved, declined, insufficient funds and 3DS/review scenarios.

Companion to the [Test Card Hub Chrome extension](https://chromewebstore.google.com/detail/nkpgepoonipokhghifbocnohiaoigaeg). Same data, same validation code.

Gateways: Stripe, Mercado Pago MX, Conekta, Openpay MX, NetPay MX, Clip, Kushki MX, PayU Latam MX, dLocal and Adyen. Every number is copied from the gateway's official documentation, with the URL and verification date ([sources](https://github.com/eyrockscript/test-card-hub/blob/main/docs/gateway-sources.md)).

Test environments only. The server never generates card numbers and never calls a gateway.

## Install

Claude Code:

```bash
claude mcp add test-card-hub -- pnpm dlx test-card-hub-mcp
```

Claude Desktop, Cursor and other clients (`mcpServers` config):

```json
{
  "mcpServers": {
    "test-card-hub": {
      "command": "pnpm",
      "args": ["dlx", "test-card-hub-mcp"]
    }
  }
}
```

`npx -y test-card-hub-mcp` works too. Requires Node.js 20 or newer.

Desktop apps (Claude Desktop, Cursor) do not load your shell profile. If Node.js comes from nvm, fnm or asdf, the app cannot find `node` and the server fails with `env: node: No such file or directory`. Pass your Node.js bin directory in `env.PATH` (find it with `dirname "$(which node)"`):

```json
{
  "mcpServers": {
    "test-card-hub": {
      "command": "pnpm",
      "args": ["dlx", "test-card-hub-mcp"],
      "env": {
        "PATH": "/Users/you/.nvm/versions/node/v22.23.4/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
      }
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `list_gateways` | Gateways with docs URL, verification date, card count per outcome and the gateway hint (expiry, CVV, cardholder-name rules). |
| `find_test_cards` | Cards filtered by `gateway`, `outcome`, `brand`, `environment` or `source`. Each card includes everything to type in the checkout: expiry, CVV, postal code, and the fields some sandboxes need, such as the NetPay customer email or the Mercado Pago, PayU and Adyen cardholder name. Max 50 per call; the response says how many matched. |
| `validate_card` | Luhn, length, brand and whether the number is a known test number. Verdict `possibly_real_card` tells the agent to stop. |
| `list_environments` | Your own environments from the extension, read from an exported backup file. |
| `generate_checkout_tests` | Writes a Playwright test file (TypeScript) with one test per sandbox scenario of a gateway, with every field filled from the official rules. Map the `fillCheckout` and `expectOutcome` helpers to your checkout's selectors. The server returns the file; it writes nothing to disk. |
| `scan_for_real_cards` | Scans text (code, fixtures, logs, seed data) for card numbers that may be real: Luhn-valid, a known brand, and not a published sandbox number. Findings are masked to first 6 + last 4 digits (last 4 only for numbers under 16 digits), with line and column. Numbers split across lines or separated by dots are not detected. Up to 200,000 characters per call. |
| `explain_decline` | Explains a gateway decline or error code: the official meaning with its source URL, plus a suggested customer message (es/en) and merchant action. The suggestions are ours and labelled as such. Omit `code` to list a gateway's known codes. |

All tools are read-only. Descriptions accept `lang: "es"` for Spanish texts.

### Where the data comes from

Card numbers come from each gateway's official test-card page. Field rules (expiry, CVV, cardholder name, email) and decline codes come from the official docs listed in `src/data/gateway-research/<gateway>.json`, each with its `sources`, `verifiedAt` date and `gaps`: what the docs did not state. Every scenario says where each value came from (`fieldSources`: `gateway_docs`, `any_future_date` or `any_value`). Decline categories (`insufficient_funds`, `fraud_suspected`, ...) are our classification; gateways do not publish them.

Known gaps on 2026-11-10: Kushki's docs are behind a password, so `explain_decline` has no Kushki codes and its field rules could not be re-verified. Gateways do not document which decline code each sandbox scenario returns, so `generate_checkout_tests` checks the outcome shown to the customer, not a specific code.

Prompt `checkout_test_matrix` (`checkoutUrl`, `gateway`): runs every outcome against your checkout with a browser tool such as Playwright MCP and returns a pass/fail table.

## Use with Playwright MCP

```bash
claude mcp add playwright -- pnpm dlx @playwright/mcp@latest
claude mcp add test-card-hub -- pnpm dlx test-card-hub-mcp
```

Then ask: "Test the checkout at http://localhost:3000/pay with Conekta: approved, declined and insufficient funds."

## Your own environments

1. In the extension, open "Manage environments" and click "Export backup".
2. Start the server with the file path:

```bash
claude mcp add test-card-hub -- pnpm dlx test-card-hub-mcp --backup /path/to/test-card-hub-backup.json
```

Or set `TEST_CARD_HUB_BACKUP=/path/to/file.json`. The file is re-read on every call, so a new export is picked up without restarting. The path comes only from server configuration, never from a tool argument.

## Español

Servidor MCP con las tarjetas de prueba oficiales de pasarelas de pago (Stripe, Mercado Pago, Conekta, Openpay, NetPay, Clip, Kushki, PayU, dLocal, Adyen) para que un agente de IA pruebe un checkout de punta a punta. Instalación en Claude Code:

```bash
claude mcp add test-card-hub -- pnpm dlx test-card-hub-mcp
```

Usa `lang: "es"` para recibir descripciones y notas en español. Para tus propios ambientes, exporta el respaldo desde la extensión y pasa la ruta con `--backup`.

## Development

```bash
pnpm install
pnpm --filter test-card-hub-mcp test:coverage
```

`src/domain`, `src/data` and `src/ui/view-model.js` of the extension are copied into `mcp/core` by `scripts/sync-core.mjs` before tests and before packing. Do not edit `mcp/core`.

Made by [Cenzontle](https://cenzontle.cloud). MIT license.
