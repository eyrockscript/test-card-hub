/**
 * Card domain: pure functions, no DOM / chrome / storage access.
 * Errors are returned as stable string codes; the UI maps them to locale text.
 *
 * @typedef {'approved'|'declined'|'insufficient'|'review'|'other'} Outcome
 * @typedef {{ id: string, cardNumber: string, cardResponse: string, outcome: Outcome, note?: string }} Card
 * @typedef {{ cardNumber: string, cardResponse: string, outcome?: string, id?: string, note?: string|null }} CardInput
 */

export const CARD_LIMITS = Object.freeze({ minDigits: 12, maxDigits: 19, maxResponseLength: 120, maxNoteLength: 160 });

export const OUTCOMES = Object.freeze(['approved', 'declined', 'insufficient', 'review', 'other']);

// Evaluated in order: the first matching rule wins. Keywords are accent-free and
// lowercase because the text is folded before matching. Negated approvals and
// insufficient funds are checked before plain approvals / declines on purpose.
const OUTCOME_RULES = Object.freeze([
  ['insufficient', ['fondos', 'insufficient', 'funds']],
  [
    'declined',
    [/\bno aprob/, /\bnot approv/, 'rechaz', 'declin', 'invalid', 'no valid', 'denied',
      'error', 'expir', /\brobad/, 'stolen', 'fraud'],
  ],
  ['review', ['3ds', 'autentic', 'authentication', 'review', 'revision', 'pendiente', 'pending']],
  ['approved', ['aprob', 'approved', 'success', 'exitos']],
]);

/** @param {unknown} raw @returns {string} ASCII digits only */
export function normalizeCardNumber(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[^0-9]/g, '');
}

/** @param {unknown} digits @returns {boolean} */
export function isLuhnValid(digits) {
  if (typeof digits !== 'string' || !/^[0-9]+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

const prefixNumber = (digits, length) => Number(digits.slice(0, length));
const inRange = (value, min, max) => value >= min && value <= max;

const BRAND_MATCHERS = Object.freeze([
  ['amex', (d) => /^3[47]/.test(d)],
  ['diners', (d) => /^3(0[0-5]|[689])/.test(d)],
  ['jcb', (d) => d.length >= 4 && inRange(prefixNumber(d, 4), 3528, 3589)],
  ['visa', (d) => d.startsWith('4')],
  ['mastercard', (d) => /^5[1-5]/.test(d) || (d.length >= 4 && inRange(prefixNumber(d, 4), 2221, 2720))],
  ['discover', (d) => /^(6011|64[4-9]|65)/.test(d)],
  ['unionpay', (d) => d.startsWith('62')],
]);

/**
 * @param {unknown} digits normalized digits
 * @returns {'visa'|'mastercard'|'amex'|'discover'|'diners'|'jcb'|'unionpay'|'unknown'}
 */
export function detectBrand(digits) {
  if (typeof digits !== 'string' || digits === '') return 'unknown';
  const match = BRAND_MATCHERS.find(([, test]) => test(digits));
  return match ? match[0] : 'unknown';
}

function groupBy(digits, sizes) {
  const groups = [];
  let offset = 0;
  for (const size of sizes) {
    if (offset >= digits.length) break;
    groups.push(digits.slice(offset, offset + size));
    offset += size;
  }
  return groups.join(' ');
}

/** @param {unknown} digits @returns {string} display string, e.g. "4242 4242 4242 4242" */
export function formatCardNumber(digits) {
  const clean = normalizeCardNumber(digits);
  const brand = detectBrand(clean);
  if (brand === 'amex') return groupBy(clean, [4, 6, 5]);
  if (brand === 'diners' && clean.length === 14) return groupBy(clean, [4, 6, 4]);
  return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
}

const foldText = (text) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** @param {unknown} responseText @returns {Outcome} */
export function inferOutcome(responseText) {
  if (typeof responseText !== 'string') return 'other';
  const folded = foldText(responseText);
  const matches = (k) => (typeof k === 'string' ? folded.includes(k) : k.test(folded));
  const rule = OUTCOME_RULES.find(([, keywords]) => keywords.some(matches));
  return rule ? rule[0] : 'other';
}

function validateNumber(cardNumber) {
  if (typeof cardNumber !== 'string') return ['card.number_type'];
  const length = normalizeCardNumber(cardNumber).length;
  const ok = length >= CARD_LIMITS.minDigits && length <= CARD_LIMITS.maxDigits;
  return ok ? [] : ['card.number_length'];
}

function validateResponse(cardResponse) {
  if (typeof cardResponse !== 'string') return ['card.response_type'];
  const trimmed = cardResponse.trim();
  if (trimmed === '') return ['card.response_required'];
  return trimmed.length > CARD_LIMITS.maxResponseLength ? ['card.response_length'] : [];
}

function validateId(id) {
  if (id === undefined) return [];
  return typeof id === 'string' && id !== '' ? [] : ['card.id_type'];
}

function validateNote(note) {
  if (note === undefined || note === null) return [];
  if (typeof note !== 'string') return ['card.note_type'];
  return note.trim().length > CARD_LIMITS.maxNoteLength ? ['card.note_length'] : [];
}

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Optional `note` is trimmed; it is omitted from the card when null/empty.
 * @param {CardInput} input
 * @returns {{ ok: true, value: Card } | { ok: false, errors: string[] }}
 */
export function createCard(input) {
  if (!isPlainObject(input)) return { ok: false, errors: ['card.invalid_input'] };
  const { cardNumber, cardResponse, outcome, id, note } = input;
  const errors = [
    ...validateNumber(cardNumber),
    ...validateResponse(cardResponse),
    ...validateId(id),
    ...validateNote(note),
  ];
  if (errors.length > 0) return { ok: false, errors };
  const response = cardResponse.trim();
  const trimmedNote = typeof note === 'string' ? note.trim() : '';
  const value = Object.freeze({
    id: id ?? globalThis.crypto.randomUUID(),
    cardNumber: normalizeCardNumber(cardNumber),
    cardResponse: response,
    outcome: OUTCOMES.includes(outcome) ? outcome : inferOutcome(response),
    ...(trimmedNote === '' ? {} : { note: trimmedNote }),
  });
  return { ok: true, value };
}

/**
 * Duplicate identity inside an environment: same normalized number AND same
 * response (trimmed, case-insensitive). One number may legitimately appear with
 * several responses (e.g. Mercado Pago outcome depends on the cardholder name).
 * @param {{ cardNumber: string, cardResponse: string }} card @returns {string}
 */
export function cardIdentityKey(card) {
  return `${normalizeCardNumber(card.cardNumber)}|${card.cardResponse.trim().toLowerCase()}`;
}

/**
 * True when the number is in the curated set of known test numbers. The UI uses
 * this to warn when a Luhn-valid number is NOT known (it may be a real card).
 * @param {string} digits @param {Set<string>} knownNumbers @returns {boolean}
 */
export function isKnownTestNumber(digits, knownNumbers) {
  if (!(knownNumbers instanceof Set)) return false;
  return knownNumbers.has(normalizeCardNumber(digits));
}
