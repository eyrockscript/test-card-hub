/**
 * Launches Chromium (new headless, extensions supported) with the REAL unpacked extension.
 * Shared by the e2e fixtures and scripts/store-assets.mjs.
 */
import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdtempSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Chrome derives an unpacked extension id from its absolute path: sha256, first 16 bytes, hex a-p. */
export function extensionIdFromPath(directory) {
  const digest = createHash('sha256').update(realpathSync(directory)).digest('hex').slice(0, 32);
  return [...digest].map((c) => String.fromCharCode('a'.charCodeAt(0) + parseInt(c, 16))).join('');
}

/** @returns {Promise<{ context: import('@playwright/test').BrowserContext, userDataDir: string, extensionId: string }>} */
export async function launchExtension({ deviceScaleFactor = 1 } = {}) {
  const userDataDir = mkdtempSync(path.join(tmpdir(), 'tch-e2e-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'en-US',
    deviceScaleFactor,
    acceptDownloads: true,
    args: [`--disable-extensions-except=${REPO_ROOT}`, `--load-extension=${REPO_ROOT}`, '--lang=en-US'],
  });
  return { context, userDataDir, extensionId: extensionIdFromPath(REPO_ROOT) };
}
