// Builds dist/test-card-hub-<version>.zip for the Chrome Web Store.
// Usage: node scripts/package.mjs   (requires the system `zip` command)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED_FILES = [
  'manifest.json',
  'popup.html',
  'styles.css',
  'icon-16.png',
  'icon-48.png',
  'icon-128.png',
];
const REQUIRED_DIRS = ['_locales', 'src', 'assets'];

function fail(message) {
  console.error(`package: ${message}`);
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const toPosix = (p) => relative(root, p).split(sep).join('/');
const isExcluded = (file) => /\.test\.js$/.test(file) || file.endsWith('.DS_Store');

const missing = [
  ...REQUIRED_FILES.filter((f) => !existsSync(join(root, f))),
  ...REQUIRED_DIRS.filter((d) => !existsSync(join(root, d)) || !statSync(join(root, d)).isDirectory()),
];
if (missing.length > 0) {
  fail(`missing required entries: ${missing.join(', ')}`);
}

const { version } = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
if (!version) fail('manifest.json has no "version"');

const files = [
  ...REQUIRED_FILES,
  ...REQUIRED_DIRS.flatMap((d) => walk(join(root, d)).map(toPosix)),
]
  .filter((f) => !isExcluded(f))
  .sort();

const distDir = join(root, 'dist');
const zipPath = join(distDir, `test-card-hub-${version}.zip`);
mkdirSync(distDir, { recursive: true });
rmSync(zipPath, { force: true });

try {
  // -X drops extra file attributes; the file list is passed explicitly via stdin (-@).
  execFileSync('zip', ['-X', '-q', zipPath, '-@'], {
    cwd: root,
    input: `${files.join('\n')}\n`,
  });
} catch (error) {
  fail(`zip command failed: ${error.message}`);
}

console.log(files.join('\n'));
const kib = (statSync(zipPath).size / 1024).toFixed(1);
console.log(`\n${files.length} files -> ${toPosix(zipPath)} (${kib} KiB)`);
