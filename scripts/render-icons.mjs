// Renders the extension icons (PNG) from the SVG sources in assets/brand/.
// Usage: pnpm icons
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = [
  { source: 'assets/brand/icon-16.svg', output: 'icon-16.png', size: 16 },
  { source: 'assets/brand/icon-toolbar.svg', output: 'icon-48.png', size: 48 },
  { source: 'assets/brand/icon.svg', output: 'icon-128.png', size: 128 },
];

async function renderIcon(page, { source, output, size }) {
  const svg = await readFile(path.join(REPO_ROOT, source), 'utf8');
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">` +
      `<div style="width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div>` +
      `</body></html>`,
  );
  await page.screenshot({
    path: path.join(REPO_ROOT, output),
    omitBackground: true,
    clip: { x: 0, y: 0, width: size, height: size },
  });
  console.log(`${output} (${size}x${size})`);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const target of TARGETS) {
    await renderIcon(page, target);
  }
} finally {
  await browser.close();
}
