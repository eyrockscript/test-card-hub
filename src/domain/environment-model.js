/**
 * Environment model: a named group of test cards.
 * Errors are objects `{ code, env?, card? }` so the UI can point at the exact item.
 *
 * @typedef {import('./card.js').Card} Card
 * @typedef {{ id: string, environment: string, colorKey: string, cards: readonly Card[] }} Environment
 * @typedef {{ code: string, env?: number, card?: number }} DomainError
 */
import { cardIdentityKey, createCard } from './card.js';

export const ENVIRONMENT_LIMITS = Object.freeze({ maxEnvironments: 50, maxCards: 200, maxNameLength: 40 });

export const COLOR_KEYS = Object.freeze(['slate', 'teal', 'amber', 'rose', 'indigo', 'olive']);

/** @param {number} index @returns {string} deterministic color key, cycling */
export function colorKeyFor(index) {
  if (!Number.isInteger(index) || index < 0) return COLOR_KEYS[0];
  return COLOR_KEYS[index % COLOR_KEYS.length];
}

export const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Case- and whitespace-insensitive comparison key for environment names. */
export const nameKey = (name) => name.trim().toLowerCase();

/** @param {unknown} name @returns {DomainError[]} */
export function validateName(name) {
  if (typeof name !== 'string') return [{ code: 'environment.name_type' }];
  const length = name.trim().length;
  const ok = length >= 1 && length <= ENVIRONMENT_LIMITS.maxNameLength;
  return ok ? [] : [{ code: 'environment.name_length' }];
}

/**
 * Builds cards from inputs, dropping invalid ones and duplicates (by number).
 * @param {unknown[]} inputs
 * @param {{ preserveIdentity: boolean }} options
 * @returns {{ cards: Card[], errors: DomainError[] }}
 */
export function buildCards(inputs, { preserveIdentity }) {
  const cards = [];
  const errors = [];
  const seen = new Set();
  inputs.forEach((input, index) => {
    const safeInput = isPlainObject(input) && !preserveIdentity ? { ...input, id: undefined } : input;
    const result = createCard(safeInput);
    if (!result.ok) {
      errors.push(...result.errors.map((code) => ({ code, card: index })));
      return;
    }
    const key = cardIdentityKey(result.value);
    if (seen.has(key)) {
      errors.push({ code: 'card.duplicate', card: index });
      return;
    }
    seen.add(key);
    cards.push(result.value);
  });
  if (cards.length > ENVIRONMENT_LIMITS.maxCards) {
    errors.push({ code: 'environment.cards_limit' });
  }
  return { cards: cards.slice(0, ENVIRONMENT_LIMITS.maxCards), errors };
}

function validateShape(input, preserveIdentity) {
  if (!isPlainObject(input)) return [{ code: 'environment.invalid_input' }];
  const errors = [...validateName(input.environment)];
  if (!Array.isArray(input.cards)) errors.push({ code: 'environment.cards_type' });
  const idOk = !preserveIdentity || input.id === undefined || (typeof input.id === 'string' && input.id !== '');
  if (!idOk) errors.push({ code: 'environment.id_type' });
  return errors;
}

/**
 * Creates an Environment. Shape errors (name, cards type, id) are fatal; card
 * errors are non-fatal: invalid cards are dropped and reported, so `value` is
 * present whenever the shape is valid even if `ok` is false.
 *
 * @param {object} input `{ environment, cards, id?, colorKey? }`
 * @param {number} index position used for the default colorKey
 * @param {{ preserveIdentity?: boolean }} [options] keep given ids (stored data)
 * @returns {{ ok: boolean, value?: Environment, errors: DomainError[] }}
 */
export function createEnvironment(input, index, { preserveIdentity = true } = {}) {
  const shapeErrors = validateShape(input, preserveIdentity);
  if (shapeErrors.length > 0) return { ok: false, errors: shapeErrors };
  const { cards, errors } = buildCards(input.cards, { preserveIdentity });
  const keepId = preserveIdentity && input.id !== undefined;
  const keepColor = preserveIdentity && COLOR_KEYS.includes(input.colorKey);
  const value = Object.freeze({
    id: keepId ? input.id : globalThis.crypto.randomUUID(),
    environment: input.environment.trim(),
    colorKey: keepColor ? input.colorKey : colorKeyFor(index),
    cards: Object.freeze(cards),
  });
  return { ok: errors.length === 0, value, errors };
}

/**
 * True when an equivalent card (see cardIdentityKey) already exists in the
 * environment, optionally ignoring the card with id `exceptCardId`.
 */
export function hasDuplicateCard(environment, card, exceptCardId) {
  const target = cardIdentityKey(card);
  return environment.cards.some((c) => c.id !== exceptCardId && cardIdentityKey(c) === target);
}

/** Returns a new frozen environment with the given overrides. */
export const withEnvironment = (environment, overrides) =>
  Object.freeze({ ...environment, ...overrides, cards: Object.freeze([...(overrides.cards ?? environment.cards)]) });
