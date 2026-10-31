/**
 * Merges already-parsed environments (e.g. from parseImportPayload) into state.
 * All-or-nothing: the first limit violation aborts and state stays unchanged.
 */
import { cardIdentityKey } from './card.js';
import { ENVIRONMENT_LIMITS, colorKeyFor, createEnvironment, isPlainObject, nameKey, withEnvironment } from './environment-model.js';
import { restoreState } from './environment-import.js';

export const MERGE_STRATEGIES = Object.freeze(['merge', 'rename']);

const fail = (code, env) => ({ ok: false, errors: [env === undefined ? { code } : { code, env }] });

const freshCards = (cards) =>
  cards.map((card) => Object.freeze({ ...card, id: globalThis.crypto.randomUUID() }));

const findByName = (state, name) => state.find((e) => nameKey(e.environment) === nameKey(name));

/** Returns `name`, or `name (2)`, `name (3)`... truncated to fit the name limit. */
function uniqueName(state, name) {
  if (!findByName(state, name)) return name;
  for (let n = 2; ; n += 1) {
    const suffix = ` (${n})`;
    const base = name.slice(0, ENVIRONMENT_LIMITS.maxNameLength - suffix.length).trimEnd();
    const candidate = `${base}${suffix}`;
    if (!findByName(state, candidate)) return candidate;
  }
}

function mergeInto(acc, target, incoming, index) {
  const known = new Set(target.cards.map(cardIdentityKey));
  const additions = freshCards(incoming.cards.filter((c) => !known.has(cardIdentityKey(c))));
  if (target.cards.length + additions.length > ENVIRONMENT_LIMITS.maxCards) {
    return fail('environment.cards_limit', index);
  }
  const updated = withEnvironment(target, { cards: [...target.cards, ...additions] });
  return {
    ok: true,
    state: acc.state.map((e) => (e.id === target.id ? updated : e)),
    meta: {
      ...acc.meta,
      addedCards: acc.meta.addedCards + additions.length,
      skippedDuplicates: acc.meta.skippedDuplicates + incoming.cards.length - additions.length,
    },
  };
}

function appendNew(acc, incoming) {
  if (acc.state.length >= ENVIRONMENT_LIMITS.maxEnvironments) return fail('state.environments_limit');
  const env = withEnvironment(incoming, {
    id: globalThis.crypto.randomUUID(),
    environment: uniqueName(acc.state, incoming.environment),
    colorKey: colorKeyFor(acc.state.length),
    cards: freshCards(incoming.cards),
  });
  return {
    ok: true,
    state: [...acc.state, env],
    meta: {
      ...acc.meta,
      addedEnvironments: acc.meta.addedEnvironments + 1,
      addedCards: acc.meta.addedCards + env.cards.length,
    },
  };
}

/**
 * @param {readonly object[]} state current Environment[]
 * @param {readonly object[]} incoming Environment[] to bring in
 * @param {'merge'|'rename'} strategy merge: append non-duplicate cards into the
 *   same-named env (case-insensitive); rename: add as "name (2)", "name (3)"...
 * @returns {{ ok: true, value: object[], meta: { addedEnvironments: number, addedCards: number, skippedDuplicates: number } } | { ok: false, errors: object[] }}
 */
export function mergeEnvironments(state, incoming, strategy) {
  if (!MERGE_STRATEGIES.includes(strategy)) return fail('merge.invalid_strategy');
  if (!Array.isArray(incoming)) return fail('merge.invalid_input');
  const validated = restoreState(incoming);
  if (!validated.ok) return { ok: false, errors: validated.errors };
  let acc = { ok: true, state: [...state], meta: { addedEnvironments: 0, addedCards: 0, skippedDuplicates: 0 } };
  for (const [index, env] of validated.value.entries()) {
    const target = strategy === 'merge' ? findByName(acc.state, env.environment) : undefined;
    acc = target ? mergeInto(acc, target, env, index) : appendNew(acc, env);
    if (!acc.ok) return acc;
  }
  return { ok: true, value: Object.freeze(acc.state), meta: acc.meta };
}

/**
 * Builds (does not add) an Environment from a curated preset
 * `{ name, cards: [{cardNumber, cardResponse, outcome, note?}] }`. Extra card
 * props such as `cardResponseEn` are ignored; the UI passes the localized
 * `cardResponse`. Name conflicts use the rename strategy. Strict: any invalid
 * card fails the whole preset. Caller appends: `[...state, result.value]`.
 * @returns {{ ok: true, value: object } | { ok: false, errors: object[] }}
 */
export function createEnvironmentFromPreset(preset, existingState = []) {
  if (!isPlainObject(preset)) return fail('preset.invalid_input');
  if (existingState.length >= ENVIRONMENT_LIMITS.maxEnvironments) return fail('state.environments_limit');
  const cards = Array.isArray(preset.cards)
    ? preset.cards.map((c) => (isPlainObject(c)
      ? { cardNumber: c.cardNumber, cardResponse: c.cardResponse, outcome: c.outcome, note: c.note }
      : c))
    : preset.cards;
  const name = typeof preset.name === 'string' ? uniqueName(existingState, preset.name.trim()) : preset.name;
  const result = createEnvironment({ environment: name, cards }, existingState.length, { preserveIdentity: false });
  return result.ok ? { ok: true, value: result.value } : { ok: false, errors: result.errors };
}
