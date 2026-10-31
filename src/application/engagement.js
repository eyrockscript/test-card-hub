/**
 * Local-only engagement counters used to decide when to show the rating
 * banner. Persisted under the 'engagement' preference key; never transmitted.
 */
import { EMPTY_ENGAGEMENT, shouldShowRatingPrompt } from '../ui/view-model.js';

const KEY = 'engagement';

const PROMPT_STATES = Object.freeze(['none', 'dismissed', 'rated']);
const COUNTER_KEYS = Object.freeze(['firstSeenAt', 'copyCount', 'dismissedAt', 'dismissCount']);

/** Stored values are untrusted: anything off-type falls back to the empty default. */
export function sanitizeEngagement(stored) {
  const source = stored !== null && typeof stored === 'object' ? stored : {};
  const clean = { ...EMPTY_ENGAGEMENT };
  for (const key of COUNTER_KEYS) {
    if (typeof source[key] === 'number' && Number.isFinite(source[key]) && source[key] >= 0) clean[key] = source[key];
  }
  if (PROMPT_STATES.includes(source.promptState)) clean.promptState = source.promptState;
  return clean;
}

export async function createEngagement({ preferences, now = () => Date.now() }) {
  let data = sanitizeEngagement(await preferences.get(KEY, {}));

  async function update(patch) {
    data = { ...data, ...patch };
    await preferences.set(KEY, data);
  }

  if (data.firstSeenAt <= 0) await update({ firstSeenAt: now() });

  return Object.freeze({
    get: () => data,
    recordCopy: () => update({ copyCount: data.copyCount + 1 }),
    dismiss: () => update({ promptState: 'dismissed', dismissedAt: now(), dismissCount: data.dismissCount + 1 }),
    markRated: () => update({ promptState: 'rated' }),
    shouldShowPrompt: () => shouldShowRatingPrompt(data, now()),
  });
}
