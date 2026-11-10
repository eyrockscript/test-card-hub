/**
 * Resolves the backup path from `--backup <path>`, `--backup=<path>` or TEST_CARD_HUB_BACKUP.
 * The flag wins over the env var. A flag without a value is an error, not a silent fallback.
 * @param {string[]} argv arguments after the script name
 * @param {Record<string, string|undefined>} env
 * @returns {{ ok: true, path?: string } | { ok: false, error: string }}
 */
export function parseBackupPath(argv, env) {
  const inline = argv.find((arg) => arg.startsWith('--backup='));
  if (inline !== undefined) {
    const value = inline.slice('--backup='.length);
    return value ? { ok: true, path: value } : { ok: false, error: '--backup needs a file path' };
  }
  const index = argv.indexOf('--backup');
  if (index >= 0) {
    const value = argv[index + 1];
    return value && !value.startsWith('--') ? { ok: true, path: value } : { ok: false, error: '--backup needs a file path' };
  }
  return env.TEST_CARD_HUB_BACKUP ? { ok: true, path: env.TEST_CARD_HUB_BACKUP } : { ok: true };
}
