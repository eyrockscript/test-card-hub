/**
 * Persistence adapter for Environment[] state.
 *
 * - `area` is anything with Promise-based get(keys) / set(obj), e.g. chrome.storage.local.
 * - `legacyStorage` is anything with getItem(key), e.g. window.localStorage (v2.x data).
 *
 * Stored shape in `area`: { schemaVersion: 3, environments: Environment[] }.
 *
 * ROLLBACK SAFETY: the legacy localStorage key is only ever READ, never written
 * or deleted. If v3 has to be rolled back to v2.x, the old popup still finds the
 * user's data exactly where it left it. Changes made in v3 are not copied back.
 */
import { parseImportPayload, restoreState } from '../domain/environment.js';
import { createDefaultEnvironments } from '../domain/default-data.js';

export const SCHEMA_VERSION = 3;
export const STORAGE_KEYS = Object.freeze({ schemaVersion: 'schemaVersion', environments: 'environments', corruptBackup: 'corruptBackup' });

const storageError = (code) => Object.assign(new Error(code), { code });

function assertDependencies(area, legacyStorage) {
  if (!area || typeof area.get !== 'function' || typeof area.set !== 'function') {
    throw storageError('storage.invalid_area');
  }
  if (!legacyStorage || typeof legacyStorage.getItem !== 'function') {
    throw storageError('storage.invalid_legacy_storage');
  }
}

function readLegacyRaw(legacyStorage, legacyKey, logger) {
  try {
    return legacyStorage.getItem(legacyKey);
  } catch (error) {
    logger.warn('[storage] legacy read failed', error);
    return null;
  }
}

function decodeLegacy(raw, logger) {
  try {
    return { data: JSON.parse(raw) };
  } catch (error) {
    logger.warn('[storage] legacy data is not valid JSON', error);
    return { data: undefined };
  }
}

/** Legacy data -> state. Invalid cards/envs are dropped; nothing usable -> defaults. */
function migrateLegacy(legacyStorage, legacyKey, logger, language) {
  const raw = readLegacyRaw(legacyStorage, legacyKey, logger);
  if (raw === null || raw === undefined) return createDefaultEnvironments(language);
  const { data } = decodeLegacy(raw, logger);
  // An empty legacy array means the user deleted every environment: honor it.
  if (Array.isArray(data) && data.length === 0) return Object.freeze([]);
  const result = parseImportPayload(data ?? null);
  if (result.errors.length > 0) logger.warn('[storage] legacy items dropped during migration', result.errors);
  return result.value.length > 0 ? result.value : createDefaultEnvironments(language);
}

async function readArea(area, logger) {
  try {
    return { stored: await area.get([STORAGE_KEYS.schemaVersion, STORAGE_KEYS.environments, STORAGE_KEYS.corruptBackup]) };
  } catch (error) {
    logger.error('[storage] read failed', error);
    return { readFailed: true };
  }
}

async function writeMigration(area, environments, corruptBackup, logger) {
  const payload = { schemaVersion: SCHEMA_VERSION, environments };
  try {
    // One set() call: chrome.storage writes all keys of one call together.
    await area.set(corruptBackup === undefined ? payload : { ...payload, corruptBackup });
  } catch (error) {
    // The user still sees their data for this session; migration retries next load.
    logger.error('[storage] migration write failed', error);
  }
}

/**
 * @param {{ area: { get: Function, set: Function }, legacyStorage: { getItem: Function },
 *   legacyKey?: string, defaultLanguage?: 'es'|'en', logger?: { warn: Function, error: Function } }} deps
 * @returns {{ load(): Promise<object[]>, save(state: object[]): Promise<void> }}
 */
export function createStorageRepository({ area, legacyStorage, legacyKey = 'creditCardEnvironments', logger = console, defaultLanguage = 'es' }) {
  assertDependencies(area, legacyStorage);

  async function load() {
    const { stored, readFailed } = await readArea(area, logger);
    // If we could not read, do not write: we might overwrite data we never saw.
    if (readFailed) return migrateLegacy(legacyStorage, legacyKey, logger, defaultLanguage);
    if (stored[STORAGE_KEYS.schemaVersion] === SCHEMA_VERSION) {
      const restored = restoreState(stored[STORAGE_KEYS.environments]);
      if (restored.ok) return restored.value;
      logger.error('[storage] stored v3 data is partly or fully invalid', restored.errors);
      // Keep whatever is still valid; only fall back when nothing usable remains.
      const recovered = restored.value.length > 0
        ? restored.value
        : migrateLegacy(legacyStorage, legacyKey, logger, defaultLanguage);
      // Never overwrite an earlier backup: it may hold the only copy of older data.
      const backup = stored[STORAGE_KEYS.corruptBackup] === undefined
        ? { schemaVersion: stored[STORAGE_KEYS.schemaVersion], environments: stored[STORAGE_KEYS.environments] }
        : undefined;
      await writeMigration(area, recovered, backup, logger);
      return recovered;
    }
    const migrated = migrateLegacy(legacyStorage, legacyKey, logger, defaultLanguage);
    await writeMigration(area, migrated, undefined, logger);
    return migrated;
  }

  /** Validates then persists. Rejects with code 'storage.invalid_state' or the area error. */
  async function save(state) {
    const validated = restoreState(state);
    if (!validated.ok) throw storageError('storage.invalid_state');
    await area.set({ schemaVersion: SCHEMA_VERSION, environments: validated.value });
  }

  return Object.freeze({ load, save });
}
