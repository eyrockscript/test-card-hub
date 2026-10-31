/**
 * Immutable operations on Environment[] state. Each returns
 * `{ ok: true, value: newState, meta? }` or `{ ok: false, errors: DomainError[] }`.
 * Unchanged environments are shared by reference (structural sharing).
 */
import { createCard } from './card.js';
import {
  ENVIRONMENT_LIMITS,
  buildCards,
  createEnvironment,
  hasDuplicateCard,
  isPlainObject,
  nameKey,
  validateName,
  withEnvironment,
} from './environment-model.js';

const cardErrors = (codes) => ({ ok: false, errors: codes.map((code) => ({ code })) });
const fail = (...codes) => cardErrors(codes);
const succeed = (value, meta) =>
  (meta ? { ok: true, value: Object.freeze(value), meta } : { ok: true, value: Object.freeze(value) });

const findEnv = (state, envId) => state.find((e) => e.id === envId);
const findByName = (state, name) => state.find((e) => nameKey(e.environment) === nameKey(name));
const replaceEnv = (state, updated) => state.map((e) => (e.id === updated.id ? updated : e));

function appendCard(state, env, card) {
  if (hasDuplicateCard(env, card)) return fail('card.duplicate');
  if (env.cards.length >= ENVIRONMENT_LIMITS.maxCards) return fail('environment.cards_limit');
  const updated = withEnvironment(env, { cards: [...env.cards, card] });
  return succeed(replaceEnv(state, updated), { environmentId: env.id, cardId: card.id, createdEnvironment: false });
}

/** Adds a card to the env named `envName` (case-insensitive), creating it if missing. */
export function addCardToEnvironment(state, envName, cardInput) {
  const nameErrors = validateName(envName);
  if (nameErrors.length > 0) return { ok: false, errors: nameErrors };
  const card = createCard(cardInput);
  if (!card.ok) return cardErrors(card.errors);
  const existing = findByName(state, envName);
  if (existing) return appendCard(state, existing, card.value);
  if (state.length >= ENVIRONMENT_LIMITS.maxEnvironments) return fail('state.environments_limit');
  const { value: env } = createEnvironment({ environment: envName, cards: [card.value] }, state.length);
  return succeed([...state, env], { environmentId: env.id, cardId: card.value.id, createdEnvironment: true });
}

function resolveOutcome(patch, current) {
  if (!('outcome' in patch)) return current.outcome;
  return patch.outcome === null ? undefined : patch.outcome;
}

const resolveNote = (patch, current) => ('note' in patch ? patch.note : current.note);

/**
 * Patches `{cardNumber?, cardResponse?, outcome?, note?}`. Outcome is kept unless
 * the patch has an `outcome` key; pass `outcome: null` to re-infer from the
 * response. Note is kept unless patched; `note: null` or '' removes it.
 */
export function updateCard(state, envId, cardId, patch) {
  if (!isPlainObject(patch)) return fail('card.invalid_input');
  const env = findEnv(state, envId);
  if (!env) return fail('environment.not_found');
  const current = env.cards.find((c) => c.id === cardId);
  if (!current) return fail('card.not_found');
  const result = createCard({
    id: current.id,
    cardNumber: patch.cardNumber ?? current.cardNumber,
    cardResponse: patch.cardResponse ?? current.cardResponse,
    outcome: resolveOutcome(patch, current),
    note: resolveNote(patch, current),
  });
  if (!result.ok) return cardErrors(result.errors);
  if (hasDuplicateCard(env, result.value, cardId)) return fail('card.duplicate');
  const cards = env.cards.map((c) => (c.id === cardId ? result.value : c));
  return succeed(replaceEnv(state, withEnvironment(env, { cards })));
}

export function removeCard(state, envId, cardId) {
  const env = findEnv(state, envId);
  if (!env) return fail('environment.not_found');
  if (!env.cards.some((c) => c.id === cardId)) return fail('card.not_found');
  const cards = env.cards.filter((c) => c.id !== cardId);
  return succeed(replaceEnv(state, withEnvironment(env, { cards })));
}

export function renameEnvironment(state, envId, newName) {
  const env = findEnv(state, envId);
  if (!env) return fail('environment.not_found');
  const nameErrors = validateName(newName);
  if (nameErrors.length > 0) return { ok: false, errors: nameErrors };
  const clash = state.some((e) => e.id !== envId && nameKey(e.environment) === nameKey(newName));
  if (clash) return fail('environment.duplicate');
  return succeed(replaceEnv(state, withEnvironment(env, { environment: newName.trim() })));
}

export function removeEnvironment(state, envId) {
  if (!findEnv(state, envId)) return fail('environment.not_found');
  return succeed(state.filter((e) => e.id !== envId));
}

/** Keeps a pasted card id only when it exists in `env` and is not repeated; others get fresh ids. */
function trustKnownIds(cardsInput, env) {
  const known = new Set(env.cards.map((c) => c.id));
  const used = new Set();
  return cardsInput.map((input) => {
    if (!isPlainObject(input)) return input;
    const keep = typeof input.id === 'string' && known.has(input.id) && !used.has(input.id);
    if (keep) used.add(input.id);
    return keep ? input : { ...input, id: undefined };
  });
}

/** Replaces all cards of an env. All-or-nothing: any invalid card aborts. */
export function replaceCards(state, envId, cardsInput) {
  const env = findEnv(state, envId);
  if (!env) return fail('environment.not_found');
  if (!Array.isArray(cardsInput)) return fail('environment.cards_type');
  if (cardsInput.length > ENVIRONMENT_LIMITS.maxCards) return fail('environment.cards_limit');
  const { cards, errors } = buildCards(trustKnownIds(cardsInput, env), { preserveIdentity: true });
  if (errors.length > 0) return { ok: false, errors };
  return succeed(replaceEnv(state, withEnvironment(env, { cards })));
}
