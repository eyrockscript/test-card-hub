/**
 * Reads the backup JSON produced by the extension's "Export" button.
 * The path comes only from server configuration (CLI flag or env var), never from
 * a tool argument, so a prompt-injected agent cannot make the server read other files.
 */
import { parseImportPayload } from '../../core/domain/index.js';

export const MAX_BACKUP_BYTES = 1024 * 1024;

/**
 * @typedef {{ environments: object[], configured: boolean, error?: string, warnings?: string[] }} BackupLoad
 * @param {string|undefined} path
 * @param {{ readFile: (path: string) => Promise<string>, statSize: (path: string) => Promise<number> }} fs
 * @returns {Promise<BackupLoad>}
 */
export async function loadBackup(path, fs) {
  if (!path) return { environments: [], configured: false };
  try {
    if ((await fs.statSize(path)) > MAX_BACKUP_BYTES) {
      return { environments: [], configured: true, error: `Backup file is larger than ${MAX_BACKUP_BYTES} bytes.` };
    }
    const result = parseImportPayload(await fs.readFile(path));
    if (result.value.length === 0) {
      const codes = result.errors.map((e) => e.code).join(', ');
      return { environments: [], configured: true, error: `Backup file has no valid environments (${codes}).` };
    }
    const warnings = result.errors.map((e) => e.code);
    return { environments: result.value, configured: true, ...(warnings.length ? { warnings } : {}) };
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : 'read_failed';
    return { environments: [], configured: true, error: `Cannot read backup file (${code}).` };
  }
}
