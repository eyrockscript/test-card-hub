/**
 * E2E fixtures: launch Chromium with the REAL unpacked extension and open
 * popup.html as a 380x560 page. Every test gets a fresh profile.
 */
import { test as base, expect } from '@playwright/test';
import { rmSync } from 'node:fs';
import { REPO_ROOT, extensionIdFromPath, launchExtension } from './launch.js';

export { REPO_ROOT, extensionIdFromPath } from './launch.js';
export const POPUP_SIZE = Object.freeze({ width: 380, height: 560 });

const CSP_PROBE = `
  window.__violations = [];
  document.addEventListener('securitypolicyviolation', (e) => {
    window.__violations.push(e.violatedDirective + ' ' + e.blockedURI);
  });
`;

/** Attaches console/pageerror/CSP collectors to a page. */
export function watchPage(page, problems) {
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) problems.push(`console.${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
}

export const test = base.extend({
  extensionId: [async ({}, use) => use(extensionIdFromPath(REPO_ROOT)), { scope: 'test' }],

  context: async ({}, use) => {
    const { context, userDataDir } = await launchExtension();
    await use(context);
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  },

  /** Array of console errors/warnings and page errors; asserted empty after every test. */
  problems: async ({}, use) => {
    const problems = [];
    await use(problems);
    expect(problems, 'console/page errors').toEqual([]);
  },

  openPopup: async ({ context, extensionId, problems }, use) => {
    const open = async (query = '', { colorScheme = 'light' } = {}) => {
      const page = await context.newPage();
      await page.setViewportSize(POPUP_SIZE);
      await page.emulateMedia({ colorScheme });
      await page.addInitScript(CSP_PROBE);
      watchPage(page, problems);
      await page.goto(`chrome-extension://${extensionId}/popup.html${query}`);
      await page.locator('#app > *').first().waitFor();
      return page;
    };
    await use(open);
  },

  page: async ({ openPopup }, use) => use(await openPopup()),
});

export { expect };

export const violations = (page) => page.evaluate(() => window.__violations ?? []);
export const readStorage = (page) => page.evaluate(() => chrome.storage.local.get(null));
export const digitsOf = (text) => text.replace(/\D/g, '');

const READER_ORIGIN = 'https://clipboard-reader.test';

/**
 * Playwright and CDP refuse to grant clipboard-read to a chrome-extension:// origin, so
 * the clipboard (shared by the whole browser) is read from a routed https page instead.
 * The extension page itself still copies with its real navigator.clipboard.writeText.
 */
export async function createClipboardReader(context) {
  await context.route(`${READER_ORIGIN}/`, (route) => route.fulfill({ contentType: 'text/html', body: '<title>reader</title>' }));
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: READER_ORIGIN });
  const reader = await context.newPage();
  await reader.goto(`${READER_ORIGIN}/`);
  return async () => {
    await reader.bringToFront();
    return reader.evaluate(() => navigator.clipboard.readText());
  };
}

/** Opens Add > Gateways, adds a preset by name, returns to main. */
export async function addPreset(page, name) {
  await page.getByRole('button', { name: 'Add cards' }).click();
  await page.getByRole('tab', { name: 'Gateways' }).click();
  await page.getByRole('button', { name: `Add ${name} pack` }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
}
