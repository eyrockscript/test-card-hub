// Copies the extension's pure modules (domain, gateway presets, view-model helpers)
// into mcp/core so the published npm package is self-contained. The extension source
// stays the single source of truth; mcp/core is generated and git-ignored.
// Usage: node scripts/sync-core.mjs   (runs automatically before test and pack)
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const mcpRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const extensionSrc = resolve(mcpRoot, '..', 'src');
const target = join(mcpRoot, 'core');

const ENTRIES = ['domain', 'data', join('ui', 'view-model.js')];

const missing = ENTRIES.filter((entry) => !existsSync(join(extensionSrc, entry)));
if (missing.length > 0) {
  console.error(`sync-core: missing extension sources: ${missing.join(', ')}`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
for (const entry of ENTRIES) {
  const destination = join(target, entry);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(join(extensionSrc, entry), destination, {
    recursive: true,
    filter: (source) => !source.endsWith('.test.js'),
  });
}
