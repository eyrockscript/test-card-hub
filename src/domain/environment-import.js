/**
 * Import / export / restore of Environment[] state.
 *
 * Result contract for parse/restore: `{ ok, value, errors }` where `value` always
 * holds the usable (valid) part, and `ok` is true only when nothing was dropped.
 * Strict callers (UI import) check `ok`; lenient callers (migration) use `value`.
 */
import { ENVIRONMENT_LIMITS, createEnvironment, isPlainObject, nameKey } from './environment-model.js';

export const BACKUP_FORMAT = 'test-card-hub';
export const BACKUP_VERSION = 3;

const failure = (code) => ({ ok: false, value: [], errors: [{ code }] });

const withEnv = (errors, env) => errors.map((e) => ({ code: e.code, env, ...(e.card === undefined ? {} : { card: e.card }) }));

/**
 * Validates a list of raw environments, dropping invalid / duplicate-named ones.
 * @param {unknown[]} list
 * @param {{ preserveIdentity: boolean }} options
 */
function buildEnvironments(list, { preserveIdentity }) {
  const value = [];
  const errors = [];
  const names = new Set();
  list.forEach((raw, index) => {
    const result = createEnvironment(raw, value.length, { preserveIdentity });
    errors.push(...withEnv(result.errors, index));
    if (!result.value) return;
    const key = nameKey(result.value.environment);
    if (names.has(key)) {
      errors.push({ code: 'environment.duplicate', env: index });
      return;
    }
    names.add(key);
    value.push(result.value);
  });
  if (value.length > ENVIRONMENT_LIMITS.maxEnvironments) {
    errors.push({ code: 'import.environments_limit' });
  }
  const capped = Object.freeze(value.slice(0, ENVIRONMENT_LIMITS.maxEnvironments));
  return { ok: errors.length === 0, value: capped, errors };
}

function decode(payload) {
  if (typeof payload !== 'string') return { data: payload };
  try {
    return { data: JSON.parse(payload) };
  } catch {
    return { error: 'import.invalid_json' };
  }
}

/** Resolves any accepted payload shape into a raw list, or an error code. */
function extractList(data) {
  if (Array.isArray(data)) return { list: data };
  if (!isPlainObject(data)) return { error: 'import.invalid_shape' };
  if (data.format === BACKUP_FORMAT) {
    if (data.version !== BACKUP_VERSION) return { error: 'import.unsupported_version' };
    return Array.isArray(data.environments) ? { list: data.environments } : { error: 'import.invalid_shape' };
  }
  if ('environment' in data && 'cards' in data) return { list: [data] };
  return { error: 'import.invalid_shape' };
}

/**
 * Accepts: legacy single env `{environment, cards}`, an array of those, or a v3
 * backup `{format:'test-card-hub', version:3, environments}`; also a JSON string
 * of any of them. Imported ids, colors and display props are ignored.
 * @param {unknown} payload
 * @returns {{ ok: boolean, value: import('./environment-model.js').Environment[], errors: import('./environment-model.js').DomainError[] }}
 */
export function parseImportPayload(payload) {
  const decoded = decode(payload);
  if (decoded.error) return failure(decoded.error);
  const extracted = extractList(decoded.data);
  if (extracted.error) return failure(extracted.error);
  if (extracted.list.length === 0) return failure('import.empty');
  return buildEnvironments(extracted.list, { preserveIdentity: false });
}

/**
 * Re-validates persisted state, keeping ids and color keys.
 * @param {unknown} stored
 */
export function restoreState(stored) {
  if (!Array.isArray(stored)) return failure('state.invalid_shape');
  return buildEnvironments(stored, { preserveIdentity: true });
}

/**
 * @param {readonly import('./environment-model.js').Environment[]} state
 * @param {Date} [now]
 * @returns {string} pretty-printed JSON backup (no ids, no colorKey; note only when set)
 */
export function serializeBackup(state, now = new Date()) {
  const environments = state.map(({ environment, cards }) => ({
    environment,
    cards: cards.map(({ cardNumber, cardResponse, outcome, note }) =>
      (note ? { cardNumber, cardResponse, outcome, note } : { cardNumber, cardResponse, outcome })),
  }));
  const backup = { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString(), environments };
  return JSON.stringify(backup, null, 2);
}
