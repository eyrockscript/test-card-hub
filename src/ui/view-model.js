/**
 * Pure helpers for the UI layer: no DOM, no chrome.*, no storage access.
 * Everything here is unit-testable in plain Node.
 */
import { detectBrand, formatCardNumber, isKnownTestNumber, isLuhnValid, normalizeCardNumber } from '../domain/index.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export const RATING_RULES = Object.freeze({
  minCopies: 20,
  minDaysSinceFirstSeen: 5,
  minDaysSinceDismissal: 60,
  maxDismissals: 2,
});

const BRAND_LABELS = Object.freeze({
  visa: 'VISA',
  mastercard: 'MC',
  amex: 'AMEX',
  discover: 'DISC',
  diners: 'DIN',
  jcb: 'JCB',
  unionpay: 'UP',
  unknown: '—',
});

const OUTCOME_ICONS = Object.freeze({
  approved: 'check',
  declined: 'x',
  insufficient: 'minus',
  review: 'shield-check',
  other: null,
});

export const brandLabel = (digits) => BRAND_LABELS[detectBrand(normalizeCardNumber(digits))];
export const outcomeIcon = (outcome) => OUTCOME_ICONS[outcome] ?? null;

/** Filters by number digits or by response / note text. Empty query keeps all. */
export function filterCards(cards, query) {
  const text = String(query ?? '').trim().toLowerCase();
  if (text === '') return cards;
  const digits = normalizeCardNumber(text);
  return cards.filter((card) =>
    (digits !== '' && card.cardNumber.includes(digits))
    || card.cardResponse.toLowerCase().includes(text)
    || (card.note ?? '').toLowerCase().includes(text));
}

/** Values the user types in any checkout form; none of them is validated by gateways. */
export function quickValues(now, language) {
  const year = String((now.getFullYear() + 4) % 100).padStart(2, '0');
  return { expiry: `12/${year}`, cvv: '123', postal: language === 'es' ? '06600' : '10001' };
}

/** Numbers that are known test cards: every gateway preset plus the first-run data. */
export function buildKnownNumbers(presets, defaultEnvironments) {
  const numbers = new Set();
  presets.forEach((preset) => preset.cards.forEach((card) => numbers.add(card.cardNumber)));
  defaultEnvironments.forEach((env) => env.cards.forEach((card) => numbers.add(card.cardNumber)));
  return numbers;
}

export function isPresetAdded(state, preset) {
  const key = preset.name.trim().toLowerCase();
  return state.some((env) => env.environment.trim().toLowerCase() === key);
}

/** Preset -> input for createEnvironmentFromPreset, with texts in the given language. */
export function presetForLanguage(preset, language) {
  const english = language === 'en';
  return {
    name: preset.name,
    cards: preset.cards.map((card) => ({
      cardNumber: card.cardNumber,
      cardResponse: english ? card.cardResponseEn : card.cardResponse,
      outcome: card.outcome,
      ...(card.note ? { note: english ? (card.noteEn ?? card.note) : card.note } : {}),
    })),
  };
}

export const presetHint = (preset, language) => (language === 'en' ? preset.hintEn : preset.hint);

/** '2026-10-29' -> '29/10/2026' (es) or '10/29/2026' (en). */
export function formatVerifiedDate(isoDate, language) {
  const [year, month, day] = String(isoDate).split('-');
  return language === 'en' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

/** Public JSON shape for editing one environment's cards. */
export function cardsToPublicJson(environment) {
  const cards = environment.cards.map(({ cardNumber, cardResponse, outcome, note }) =>
    (note ? { cardNumber, cardResponse, outcome, note } : { cardNumber, cardResponse, outcome }));
  return JSON.stringify(cards, null, 2);
}

/**
 * Re-formats a number field while typing and keeps the caret next to the same
 * digit, so editing in the middle does not jump to the end.
 * @returns {{ value: string, caret: number }}
 */
export function formatWithCaret(rawValue, rawCaret) {
  const caretAt = Math.min(rawCaret ?? rawValue.length, rawValue.length);
  const digitsBeforeCaret = normalizeCardNumber(rawValue.slice(0, caretAt)).length;
  const value = formatCardNumber(normalizeCardNumber(rawValue));
  if (digitsBeforeCaret === 0) return { value, caret: 0 };
  let seen = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) seen += 1;
    if (seen === digitsBeforeCaret) return { value, caret: index + 1 };
  }
  return { value, caret: value.length };
}

/**
 * Helper state for the number field.
 * @returns {'empty'|'short'|'luhn_failed'|'unknown_number'|'known'}
 */
export function numberFieldStatus(digits, knownNumbers) {
  if (digits === '') return 'empty';
  if (digits.length < 12) return 'short';
  if (!isLuhnValid(digits)) return 'luhn_failed';
  return isKnownTestNumber(digits, knownNumbers) ? 'known' : 'unknown_number';
}

/** @returns {Array<{code: string, env?: number, card?: number}>} first `limit` errors */
export const firstErrors = (errors, limit = 5) => errors.slice(0, limit);

/** Number of cards that survive a partial import. */
export const countCards = (environments) => environments.reduce((sum, env) => sum + env.cards.length, 0);

export const EMPTY_ENGAGEMENT = Object.freeze({
  firstSeenAt: 0,
  copyCount: 0,
  promptState: 'none',
  dismissedAt: 0,
  dismissCount: 0,
});

/**
 * Rating prompt eligibility. Same rule for every user: no sentiment gating.
 * @param {typeof EMPTY_ENGAGEMENT} engagement
 * @param {number} now epoch ms
 */
export function shouldShowRatingPrompt(engagement, now) {
  const e = { ...EMPTY_ENGAGEMENT, ...engagement };
  if (e.promptState === 'rated') return false;
  if (e.firstSeenAt <= 0 || e.copyCount < RATING_RULES.minCopies) return false;
  if (now - e.firstSeenAt < RATING_RULES.minDaysSinceFirstSeen * DAY_MS) return false;
  if (e.promptState === 'none') return true;
  if (e.promptState !== 'dismissed') return false;
  if (e.dismissCount >= RATING_RULES.maxDismissals) return false;
  return now - e.dismissedAt >= RATING_RULES.minDaysSinceDismissal * DAY_MS;
}
