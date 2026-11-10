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

## Tools

| Tool | What it does |
|---|---|
| `list_gateways` | Gateways with docs URL, verification date, card count per outcome and the gateway hint (expiry, CVV, cardholder-name rules). |
| `find_test_cards` | Cards filtered by `gateway`, `outcome`, `brand`, `environment` or `source`. Each card includes fill values (expiry, CVV, postal code). Max 50 per call; the response says how many matched. |
| `validate_card` | Luhn, length, brand and whether the number is a known test number. Verdict `possibly_real_card` tells the agent to stop. |
| `list_environments` | Your own environments from the extension, read from an exported backup file. |

All tools are read-only. Descriptions accept `lang: "es"` for Spanish texts.

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
