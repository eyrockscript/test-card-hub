// Regenerates the Chrome Web Store assets from the REAL unpacked extension.
// Usage: pnpm store:assets   (needs `pnpm exec playwright install chromium`)
// Output: store/assets/popup/<lang>/*.png (760x1120 popup captures),
//         store/assets/<lang>/screenshot-1..5.png (1280x800), promo tiles (440x280).
import { chromium } from '@playwright/test';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { REPO_ROOT, launchExtension } from '../tests/e2e/launch.js';

const OUT = path.join(REPO_ROOT, 'store', 'assets');
const TEMPLATE = pathToFileURL(path.join(REPO_ROOT, 'store', 'screenshot-template.html')).href;
const ICON = pathToFileURL(path.join(REPO_ROOT, 'icon-128.png')).href;
const POPUP = { width: 380, height: 560 };

const COPY = {
  en: {
    name: 'Test Credit Cards',
    promoSub: 'Sandbox test cards, one click away.',
    shots: [
      ['Copy a test card in one click', 'Grouped by environment. Press 1 to 9 to copy.'],
      ['Add a card in seconds', 'It detects the brand and checks the Luhn digit.'],
      ['Packs from the official docs', 'Stripe, Mercado Pago, Conekta, Openpay and more.'],
      ['Organize by environment', 'Rename, edit, delete with undo, and keep a backup.'],
      ['Light and dark theme', 'It follows your system. Spanish and English included.'],
    ],
    response: 'Transaction approved',
    cardTab: 'Card',
    gatewaysTab: 'Gateways',
    addLabel: 'Add cards',
    manageLabel: 'Manage environments',
    addStripe: 'Add Stripe pack',
    back: 'Back',
    submit: 'Add card',
  },
  es: {
    name: 'Tarjetas de Prueba',
    promoSub: 'Tarjetas de sandbox a un clic.',
    shots: [
      ['Copia una tarjeta de prueba con un clic', 'Agrupadas por ambiente. Pulsa 1 a 9 para copiar.'],
      ['Agrega una tarjeta en segundos', 'Detecta la marca y revisa el dígito Luhn.'],
      ['Paquetes de la documentación oficial', 'Stripe, Mercado Pago, Conekta, Openpay y más.'],
      ['Organiza por ambiente', 'Renombra, edita, borra con deshacer y guarda un respaldo.'],
      ['Tema claro y oscuro', 'Sigue tu sistema. Español e inglés incluidos.'],
    ],
    response: 'Transacción aprobada',
    cardTab: 'Tarjeta',
    gatewaysTab: 'Pasarelas',
    addLabel: 'Agregar tarjetas',
    manageLabel: 'Administrar ambientes',
    addStripe: 'Agregar paquete Stripe',
    back: 'Volver',
    submit: 'Agregar tarjeta',
  },
};

async function openPopup(context, extensionId, colorScheme) {
  const page = await context.newPage();
  await page.setViewportSize(POPUP);
  await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
  await page.goto(`chrome-extension://${extensionId}/popup.html?surface=popup`);
  await page.locator('#app > *').first().waitFor();
  return page;
}

async function settle(page) {
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.activeElement?.blur());
  await page.locator('#toast[data-open="true"]').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
  await page.waitForFunction(() => document.querySelector('#toast')?.dataset.open !== 'true');
  await page.evaluate(() => document.fonts.ready);
}

async function capture(page, file) {
  await settle(page);
  await page.screenshot({ path: file });
}

/** Captures the five popup states for one language through the real UI. */
async function capturePopups(context, extensionId, lang, dir) {
  const c = COPY[lang];
  const page = await openPopup(context, extensionId, 'light');
  await page.evaluate((language) => chrome.storage.local.set({ uiLanguage: language }), lang);
  await page.reload();
  await page.locator('#app > *').first().waitFor();

  await page.getByRole('button', { name: c.addLabel, exact: true }).click();
  await page.getByRole('tab', { name: c.gatewaysTab }).click();
  await page.getByRole('button', { name: c.addStripe }).click();
  await page.getByRole('button', { name: c.back, exact: true }).click();
  await page.getByRole('tab', { name: 'Stripe' }).click();
  await capture(page, path.join(dir, '1-main-light.png'));

  await page.getByRole('button', { name: c.addLabel, exact: true }).click();
  await page.getByRole('tab', { name: c.cardTab }).click();
  await page.locator('#f-number').fill('4242424242424242');
  await page.locator('#f-response').fill(c.response);
  await capture(page, path.join(dir, '2-add-card-light.png'));

  await page.getByRole('button', { name: c.back, exact: true }).click();
  await page.getByRole('button', { name: c.manageLabel }).click();
  await capture(page, path.join(dir, '4-manage-light.png'));
  await page.close();

  const dark = await openPopup(context, extensionId, 'dark');
  await dark.getByRole('tab', { name: 'Stripe' }).click();
  await capture(dark, path.join(dir, '5-main-dark.png'));
  await dark.getByRole('button', { name: c.addLabel, exact: true }).click();
  await dark.getByRole('tab', { name: c.gatewaysTab }).click();
  await capture(dark, path.join(dir, '3-gateways-dark.png'));
  await dark.close();
}

function templateUrl(params) {
  return `${TEMPLATE}?${new URLSearchParams(params)}`;
}

async function compose(browser, lang, popupDir) {
  const c = COPY[lang];
  const outDir = path.join(OUT, lang);
  mkdirSync(outDir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const darkShots = new Set([3, 5]);
  const files = ['1-main-light', '2-add-card-light', '3-gateways-dark', '4-manage-light', '5-main-dark'];
  for (const [index, file] of files.entries()) {
    const [headline, sub] = c.shots[index];
    const theme = darkShots.has(index + 1) ? 'dark' : 'light';
    const image = pathToFileURL(path.join(popupDir, `${file}.png`)).href;
    await page.goto(templateUrl({ layout: 'shot', theme, lang, headline, sub, image }));
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#popup').evaluate((img) => img.decode());
    await page.screenshot({ path: path.join(outDir, `screenshot-${index + 1}.png`) });
  }
  await page.setViewportSize({ width: 440, height: 280 });
  await page.goto(templateUrl({ layout: 'promo', theme: 'light', lang, headline: c.name, sub: c.promoSub, icon: ICON, image: pathToFileURL(path.join(popupDir, `${files[0]}.png`)).href }));
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#icon').evaluate((img) => img.decode());
  await page.locator('#popup').evaluate((img) => img.decode());
  const promoName = lang === 'en' ? 'promo-small-440x280.png' : 'promo-small-440x280.es.png';
  await page.screenshot({ path: path.join(OUT, promoName) });
  await page.setViewportSize({ width: 1400, height: 560 });
  await page.goto(templateUrl({ layout: 'marquee', theme: 'light', lang, headline: c.name, sub: c.promoSub, icon: ICON, image: pathToFileURL(path.join(popupDir, `${files[0]}.png`)).href }));
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#icon').evaluate((img) => img.decode());
  await page.locator('#popup').evaluate((img) => img.decode());
  const marqueeName = lang === 'en' ? 'promo-marquee-1400x560.png' : 'promo-marquee-1400x560.es.png';
  await page.screenshot({ path: path.join(OUT, marqueeName) });
  await page.close();
}

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  for (const lang of Object.keys(COPY)) {
    const popupDir = path.join(OUT, 'popup', lang);
    mkdirSync(popupDir, { recursive: true });
    const { context, userDataDir, extensionId } = await launchExtension({ deviceScaleFactor: 2 });
    try {
      await capturePopups(context, extensionId, lang, popupDir);
    } finally {
      await context.close();
      rmSync(userDataDir, { recursive: true, force: true });
    }
  }
  const browser = await chromium.launch({ channel: 'chromium' });
  try {
    for (const lang of Object.keys(COPY)) await compose(browser, lang, path.join(OUT, 'popup', lang));
  } finally {
    await browser.close();
  }
  console.log(`store assets written to ${path.relative(REPO_ROOT, OUT)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
