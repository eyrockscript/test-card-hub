/**
 * Safety check an agent runs before typing a number into a checkout.
 * The key signal: a Luhn-valid number that is NOT a known test number may be a
 * real card, so the agent must not use it.
 */
import { CARD_LIMITS, detectBrand, formatCardNumber, isKnownTestNumber, isLuhnValid, normalizeCardNumber } from '../../core/domain/index.js';

/** @typedef {'known_test_number'|'user_environment_number'|'invalid_number'|'possibly_real_card'} Verdict */

const MESSAGES = Object.freeze({
  known_test_number: 'Known sandbox test number from an official gateway page. Safe to use in test mode.',
  user_environment_number: 'Not in the official presets. It is saved in one of your environments, which is the user\'s claim, not a verification. Use it only against a sandbox.',
  invalid_number: 'Not a valid card number (bad length or Luhn check). Gateways reject it before any test scenario runs.',
  possibly_real_card: 'Luhn-valid but not a known test number: it may be a real card. Do not use it; pick one from find_test_cards.',
});

/**
 * @param {string} rawNumber
 * @param {{ knownNumbers: Set<string>, environmentNumbers: Set<string> }} sets
 */
export function validateCard(rawNumber, { knownNumbers, environmentNumbers }) {
  const digits = normalizeCardNumber(rawNumber);
  const lengthValid = digits.length >= CARD_LIMITS.minDigits && digits.length <= CARD_LIMITS.maxDigits;
  const luhnValid = isLuhnValid(digits);
  const knownTestNumber = isKnownTestNumber(digits, knownNumbers);
  const inUserEnvironment = environmentNumbers.has(digits);
  /** @type {Verdict} */
  let verdict = 'possibly_real_card';
  if (knownTestNumber) verdict = 'known_test_number';
  else if (!lengthValid || !luhnValid) verdict = 'invalid_number';
  else if (inUserEnvironment) verdict = 'user_environment_number';
  return {
    formatted: formatCardNumber(digits),
    brand: detectBrand(digits),
    lengthValid,
    luhnValid,
    knownTestNumber,
    inUserEnvironment,
    verdict,
    message: MESSAGES[verdict],
  };
}
