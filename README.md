# Tarjetas de Crédito de Prueba (test-card-hub)

Extensión de Chrome para guardar y copiar números de tarjeta de prueba de sandboxes de pago, agrupados por ambiente. Pensada para desarrolladores y QA que prueban checkouts.

Solo para entornos de prueba. No guardes tarjetas reales. La extensión no genera números de tarjeta.

[Instalar desde Chrome Web Store](https://chromewebstore.google.com/detail/tarjetas-de-cr%C3%A9dito-de-pr/nkpgepoonipokhghifbocnohiaoigaeg)

Si te resulta útil, [califícala en la Chrome Web Store](https://chromewebstore.google.com/detail/nkpgepoonipokhghifbocnohiaoigaeg/reviews).

## Español

### Características

- Ambientes de tarjetas de prueba (desarrollo, staging, un cliente).
- Copiar con un clic o con las teclas 1 a 9. Buscar con `/`.
- Chips para copiar vencimiento, CVV y código postal.
- Agregar tarjetas con formulario: detecta la marca, valida el dígito Luhn y avisa cuando el número no es un número de prueba conocido.
- Importar un archivo JSON.
- Paquetes de pasarelas listos, con números tomados de la documentación oficial de cada una: Stripe, Mercado Pago MX, Conekta, Openpay MX, NetPay MX, Clip, Kushki MX, PayU Latam MX, dLocal y Adyen. Las fuentes están en `docs/gateway-sources.md`.
- Renombrar ambientes, eliminar tarjetas o ambientes con deshacer, editar el JSON, exportar e importar un archivo de respaldo.
- Tema claro y oscuro según el sistema. Interfaz en español e inglés, con selector de idioma en la ventana.
- Atajo de teclado `Alt+Shift+K` para abrirla.
- Los datos de la versión 2 se migran automáticamente.

### Instalación manual (desarrollo)

1. Clona este repositorio.
2. Abre `chrome://extensions` y activa el modo de desarrollador.
3. Haz clic en "Cargar descomprimida" y elige la carpeta del repositorio.

### Formato JSON de importación

Formato de un solo ambiente (el campo `outcome` es opcional):

```json
{
  "environment": "staging",
  "cards": [
    {
      "cardNumber": "4242424242424242",
      "cardResponse": "Aprobada",
      "outcome": "approved"
    },
    {
      "cardNumber": "4000000000000002",
      "cardResponse": "Rechazada",
      "outcome": "declined"
    }
  ]
}
```

Valores válidos de `outcome`: `approved`, `declined`, `insufficient`, `review`, `other`.

Formato de respaldo (el que produce "Exportar"):

```json
{
  "format": "test-card-hub",
  "version": 3,
  "environments": [
    {
      "environment": "staging",
      "cards": [
        { "cardNumber": "4242424242424242", "cardResponse": "Aprobada", "outcome": "approved" }
      ]
    }
  ]
}
```

La estructura exacta de cada ambiente dentro de `environments` la define el código en `src/`; exporta un respaldo desde la extensión para ver un ejemplo real.

### Desarrollo

Requiere Node.js y [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm test       # pruebas unitarias (vitest)
pnpm package    # genera dist/test-card-hub-<versión>.zip para la tienda
```

La extensión no tiene paso de compilación: son módulos ES nativos.

### Privacidad

- Todo se guarda en tu navegador con `chrome.storage.local`.
- Sin peticiones de red, sin analítica, sin cuentas. Las tipografías van incluidas.
- Único permiso: `storage`. CSP estricta.
- Detalle completo en [privacy-policy.md](privacy-policy.md).

### Licencia

MIT. Ver [LICENSE](LICENSE). Las tipografías incluidas (Outfit y JetBrains Mono) usan la licencia SIL OFL 1.1, ver [assets/fonts/LICENSE.md](assets/fonts/LICENSE.md).

---

## English

Chrome extension that stores and copies payment sandbox test card numbers, grouped by environment. Built for developers and QA testers working on checkouts.

For test environments only. Do not store real cards. The extension does not generate card numbers.

[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/tarjetas-de-cr%C3%A9dito-de-pr/nkpgepoonipokhghifbocnohiaoigaeg) | [Rate it](https://chromewebstore.google.com/detail/nkpgepoonipokhghifbocnohiaoigaeg/reviews)

### Features

- Environments of test cards (development, staging, a client project).
- Copy with a click or with keys 1 to 9. Search with `/`.
- Chips to copy expiry date, CVV and postal code.
- Add cards with a form: it detects the brand, checks the Luhn digit and warns when a number is not a known test number.
- JSON import.
- Ready-made gateway packs with numbers taken from each gateway's official docs: Stripe, Mercado Pago MX, Conekta, Openpay MX, NetPay MX, Clip, Kushki MX, PayU Latam MX, dLocal and Adyen. Sources are listed in `docs/gateway-sources.md`.
- Rename environments, delete cards or environments with undo, edit the JSON, export and import a backup file.
- Light and dark theme following the system. Spanish and English UI, with a language switch in the popup.
- `Alt+Shift+K` keyboard shortcut to open it.
- Version 2 data migrates automatically.

### Manual install (development)

1. Clone this repository.
2. Open `chrome://extensions` and turn on Developer mode.
3. Click "Load unpacked" and pick the repository folder.

### JSON import format

Single-environment format (the `outcome` field is optional):

```json
{
  "environment": "staging",
  "cards": [
    {
      "cardNumber": "4242424242424242",
      "cardResponse": "Approved",
      "outcome": "approved"
    }
  ]
}
```

Valid `outcome` values: `approved`, `declined`, `insufficient`, `review`, `other`.

Backup format (what "Export" produces):

```json
{
  "format": "test-card-hub",
  "version": 3,
  "environments": [
    {
      "environment": "staging",
      "cards": [
        { "cardNumber": "4242424242424242", "cardResponse": "Approved", "outcome": "approved" }
      ]
    }
  ]
}
```

The exact shape of each environment inside `environments` is defined by the code in `src/`; export a backup from the extension to see a real example.

### Development

Requires Node.js and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm test       # unit tests (vitest)
pnpm package    # builds dist/test-card-hub-<version>.zip for the store
```

There is no build step: the extension uses native ES modules.

### Privacy

- Everything is stored in your browser with `chrome.storage.local`.
- No network requests, no analytics, no accounts. Fonts are bundled.
- Only permission: `storage`. Strict CSP.
- Full details in [privacy-policy.md](privacy-policy.md).

### License

MIT. See [LICENSE](LICENSE). The bundled fonts (Outfit and JetBrains Mono) use the SIL OFL 1.1 license, see [assets/fonts/LICENSE.md](assets/fonts/LICENSE.md).
