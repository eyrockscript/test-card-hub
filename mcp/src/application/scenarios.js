/**
 * Builds complete checkout scenarios (card + every field the sandbox needs) from a
 * gateway preset and the gateway's documented field rules.
 * Field rules come from official docs (src/data/gateway-research/*.json); when a rule
 * says "any value", we use the extension's generic values and say so in `fieldSources`.
 */
import { detectBrand } from '../../core/domain/index.js';
import { quickValues } from '../../core/ui/view-model.js';

/** Field names differ between gateway docs; map them to ours. */
const FIELD_ALIASES = Object.freeze({
  holderName: 'cardholderName', cardholderName: 'cardholderName', name: 'cardholderName',
  email: 'email', customerEmail: 'email',
  expiry: 'expiry', expiration: 'expiry',
  cvv: 'cvv', cvc: 'cvv',
});

const pickLiteral = (fields) => Object.fromEntries(Object.entries(fields ?? {})
  .filter(([key, value]) => FIELD_ALIASES[key] && typeof value === 'string')
  .map(([key, value]) => [FIELD_ALIASES[key], value]));

function ruleOf(defaults, ...keys) {
  for (const key of keys) if (defaults?.[key] && typeof defaults[key] === 'object') return defaults[key];
  return undefined;
}

// PayU: the expiry MONTH drives the outcome (below 6 approves, above 6 declines), year in the future.
const MONTH_BY_OUTCOME = Object.freeze({ approved: '05', declined: '07' });

function resolveExpiry(defaults, generic, outcome) {
  const rule = ruleOf(defaults, 'expiry');
  if (rule?.rule === 'fixed' && rule.value) return { value: rule.value, source: 'gateway_docs' };
  if (rule?.rule === 'month_and_future_year_by_outcome' && MONTH_BY_OUTCOME[outcome]) {
    return { value: `${MONTH_BY_OUTCOME[outcome]}/${generic.expiry.split('/')[1]}`, source: 'gateway_docs' };
  }
  return { value: generic.expiry, source: 'any_future_date' };
}

function resolveCvv(defaults, brand, generic) {
  const rule = ruleOf(defaults, 'cvv', 'cvc');
  if (rule?.rule === 'fixed' && rule.value) {
    return { value: brand === 'amex' && rule.amexValue ? rule.amexValue : rule.value, source: 'gateway_docs' };
  }
  return { value: brand === 'amex' ? '1234' : generic.cvv, source: 'any_value' };
}

/**
 * @param {{ id: string, cards: { cardNumber: string, cardResponse: string, cardResponseEn: string, outcome: string, note?: string, noteEn?: string }[] }} preset
 * @param {{ scenarioFields?: { defaults?: object, byCard?: { cardNumber: string, outcome: string, fields: object }[] } } | undefined} research
 * @param {{ now: Date, lang: 'en'|'es', outcomes?: string[] }} options
 */
export function buildScenarios(preset, research, options) {
  const generic = quickValues(options.now, options.lang);
  const defaults = research?.scenarioFields?.defaults;
  const byCard = research?.scenarioFields?.byCard ?? [];
  return preset.cards
    .filter((card) => !options.outcomes?.length || options.outcomes.includes(card.outcome))
    .map((card) => {
      const brand = detectBrand(card.cardNumber);
      const override = pickLiteral(byCard.find((b) => b.cardNumber === card.cardNumber && b.outcome === card.outcome)?.fields);
      const expiry = override.expiry ? { value: override.expiry, source: 'gateway_docs' } : resolveExpiry(defaults, generic, card.outcome);
      const cvv = override.cvv ? { value: override.cvv, source: 'gateway_docs' } : resolveCvv(defaults, brand, generic);
      const note = options.lang === 'es' ? card.note : (card.noteEn ?? card.note);
      return {
        name: options.lang === 'es' ? card.cardResponse : card.cardResponseEn,
        outcome: card.outcome,
        cardNumber: card.cardNumber,
        brand,
        expiry: expiry.value,
        cvv: cvv.value,
        ...(override.cardholderName ? { cardholderName: override.cardholderName } : {}),
        ...(override.email ? { email: override.email } : {}),
        postalCode: generic.postal,
        ...(note ? { note } : {}),
        fieldSources: {
          expiry: expiry.source,
          cvv: cvv.source,
          ...(override.cardholderName ? { cardholderName: 'gateway_docs' } : {}),
          ...(override.email ? { email: 'gateway_docs' } : {}),
          postalCode: 'any_value',
        },
      };
    });
}
