/**
 * Read-only queries over gateway presets and user environments.
 * Pure functions: no MCP SDK, no file system. The interface layer injects data.
 *
 * @typedef {'en'|'es'} Lang
 * @typedef {'approved'|'declined'|'insufficient'|'review'|'other'} Outcome
 * @typedef {{ id: string, name: string, docsUrl: string, verifiedAt: string, hint: string, hintEn: string,
 *   cards: { cardNumber: string, cardResponse: string, cardResponseEn: string, outcome: Outcome, note?: string, noteEn?: string }[] }} Preset
 * @typedef {{ environment: string, cards: { cardNumber: string, cardResponse: string, outcome: Outcome, note?: string }[] }} Environment
 */
import { OUTCOMES, detectBrand, formatCardNumber } from '../../core/domain/index.js';
import { quickValues } from '../../core/ui/view-model.js';

export const RESULT_LIMITS = Object.freeze({ defaultCards: 10, maxCards: 50 });

const AMEX_CVV = '1234';

const countOutcomes = (cards) =>
  Object.fromEntries(OUTCOMES.map((outcome) => [outcome, cards.filter((c) => c.outcome === outcome).length]));

const sameText = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Generic checkout values. Gateways do not validate them, except where the
 * gateway hint says otherwise (the hint always wins).
 * @param {string} brand @param {Date} now @param {Lang} lang
 */
function fillValues(brand, now, lang) {
  const quick = quickValues(now, lang);
  return {
    expiry: quick.expiry,
    cvv: brand === 'amex' ? AMEX_CVV : quick.cvv,
    postalCode: quick.postal,
  };
}

/** @param {Preset[]} presets @param {Lang} lang */
export function listGateways(presets, lang) {
  return presets.map((preset) => ({
    id: preset.id,
    name: preset.name,
    docsUrl: preset.docsUrl,
    verifiedAt: preset.verifiedAt,
    hint: lang === 'es' ? preset.hint : preset.hintEn,
    cardCount: preset.cards.length,
    outcomes: countOutcomes(preset.cards),
  }));
}

/** @param {Environment[]} environments */
export function listEnvironments(environments) {
  return environments.map((env) => ({
    name: env.environment,
    cardCount: env.cards.length,
    outcomes: countOutcomes(env.cards),
  }));
}

function presetCardView(preset, card, now, lang) {
  const brand = detectBrand(card.cardNumber);
  const note = lang === 'es' ? card.note : (card.noteEn ?? card.note);
  return {
    source: 'gateway',
    gateway: preset.id,
    cardNumber: card.cardNumber,
    formatted: formatCardNumber(card.cardNumber),
    brand,
    outcome: card.outcome,
    description: lang === 'es' ? card.cardResponse : card.cardResponseEn,
    ...(note ? { note } : {}),
    gatewayHint: lang === 'es' ? preset.hint : preset.hintEn,
    fill: fillValues(brand, now, lang),
  };
}

function environmentCardView(env, card, now, lang) {
  const brand = detectBrand(card.cardNumber);
  return {
    source: 'environment',
    environment: env.environment,
    cardNumber: card.cardNumber,
    formatted: formatCardNumber(card.cardNumber),
    brand,
    outcome: card.outcome,
    description: card.cardResponse,
    ...(card.note ? { note: card.note } : {}),
    fill: fillValues(brand, now, lang),
  };
}

function collectCards(query, { presets, environments, now }) {
  const lang = query.lang ?? 'en';
  const source = query.source ?? 'all';
  const fromGateways = source === 'environments' ? [] : presets
    .filter((p) => !query.gateway || p.id === query.gateway)
    .flatMap((p) => p.cards.map((c) => presetCardView(p, c, now, lang)));
  const fromEnvironments = source === 'gateways' ? [] : environments
    .filter((e) => !query.environment || sameText(e.environment, query.environment))
    .flatMap((e) => e.cards.map((c) => environmentCardView(e, c, now, lang)));
  return [...fromGateways, ...fromEnvironments];
}

/**
 * @param {{ gateway?: string, environment?: string, source?: 'all'|'gateways'|'environments',
 *   outcome?: Outcome, brand?: string, lang?: Lang, limit?: number }} query
 * @param {{ presets: Preset[], environments: Environment[], now: Date }} data
 * @returns {{ ok: true, total: number, shown: number, cards: object[], notice?: string } | { ok: false, error: string }}
 */
export function findCards(query, data) {
  if (query.gateway && !data.presets.some((p) => p.id === query.gateway)) {
    return { ok: false, error: `Unknown gateway "${query.gateway}". Valid ids: ${data.presets.map((p) => p.id).join(', ')}.` };
  }
  if (query.environment && !data.environments.some((e) => sameText(e.environment, query.environment))) {
    return { ok: false, error: `Unknown environment "${query.environment}". Call list_environments to see the available names.` };
  }
  const matches = collectCards(query, data)
    .filter((card) => !query.outcome || card.outcome === query.outcome)
    .filter((card) => !query.brand || card.brand === query.brand);
  const limit = Math.min(query.limit ?? RESULT_LIMITS.defaultCards, RESULT_LIMITS.maxCards);
  const cards = matches.slice(0, limit);
  const notice = matches.length > cards.length
    ? `Showing ${cards.length} of ${matches.length} cards. Narrow the filters or raise limit (max ${RESULT_LIMITS.maxCards}).`
    : undefined;
  return { ok: true, total: matches.length, shown: cards.length, cards, ...(notice ? { notice } : {}) };
}
