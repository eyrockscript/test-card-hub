/**
 * Explains a gateway decline / error code. Two layers, kept apart on purpose:
 * - official: code meaning, category and source URL, taken from the gateway docs (data files);
 * - suggested: what to tell the customer and what the merchant should do, written by us per
 *   category. The response labels it as a suggestion so nobody mistakes it for gateway docs.
 *
 * @typedef {'insufficient_funds'|'card_declined'|'expired_card'|'incorrect_cvc'|'incorrect_number'|
 *   'fraud_suspected'|'authentication_required'|'processing_error'|'limit_exceeded'|'do_not_honor'|
 *   'invalid_request'|'other'} DeclineCategory
 * @typedef {{ code: string, officialMeaning: string, category: DeclineCategory, retryable: boolean|null, sourceUrl: string }} DeclineCode
 * @typedef {{ gateway: string, verifiedAt: string, declineCodes: DeclineCode[] }} GatewayDeclines
 */

/** Suggested guidance per category: customer copy (es/en) and merchant action (en). */
export const CATEGORY_GUIDANCE = Object.freeze({
  insufficient_funds: {
    es: 'Tu tarjeta no tiene fondos suficientes. Intenta con otra tarjeta u otro método de pago.',
    en: 'Your card has insufficient funds. Try another card or payment method.',
    action: 'Offer another payment method. Do not retry the same card automatically.',
  },
  card_declined: {
    es: 'Tu banco rechazó el pago. Intenta con otra tarjeta o comunícate con tu banco.',
    en: 'Your bank declined the payment. Try another card or contact your bank.',
    action: 'Show a generic decline message; never reveal the exact bank reason to the customer.',
  },
  do_not_honor: {
    es: 'Tu banco rechazó el pago. Comunícate con tu banco o usa otra tarjeta.',
    en: 'Your bank declined the payment. Contact your bank or use another card.',
    action: 'Treat as a generic issuer decline; ask for another card.',
  },
  expired_card: {
    es: 'Tu tarjeta está vencida. Revisa la fecha de vencimiento o usa otra tarjeta.',
    en: 'Your card has expired. Check the expiry date or use another card.',
    action: 'Ask the customer to re-enter the expiry date or use another card.',
  },
  incorrect_cvc: {
    es: 'El código de seguridad (CVV) no es correcto. Revísalo e inténtalo de nuevo.',
    en: 'The security code (CVV) is incorrect. Check it and try again.',
    action: 'Let the customer re-enter the CVV; cap attempts to avoid card testing.',
  },
  incorrect_number: {
    es: 'El número de tarjeta no es válido. Revísalo e inténtalo de nuevo.',
    en: 'The card number is invalid. Check it and try again.',
    action: 'Validate format and Luhn client-side before submitting.',
  },
  fraud_suspected: {
    es: 'No pudimos procesar el pago. Intenta con otro método de pago.',
    en: 'We could not process the payment. Try another payment method.',
    action: 'Never tell the customer it was flagged as fraud. Do not retry; review the order.',
  },
  authentication_required: {
    es: 'Tu banco necesita que confirmes el pago. Completa la verificación para continuar.',
    en: 'Your bank needs you to confirm the payment. Complete the verification to continue.',
    action: 'Start or resume the 3D Secure flow instead of failing the payment.',
  },
  processing_error: {
    es: 'Hubo un problema al procesar el pago. Inténtalo de nuevo en unos minutos.',
    en: 'There was a problem processing the payment. Try again in a few minutes.',
    action: 'Safe to retry with backoff and an idempotency key.',
  },
  limit_exceeded: {
    es: 'El pago excede el límite de tu tarjeta. Intenta con un monto menor u otra tarjeta.',
    en: 'The payment exceeds your card limit. Try a smaller amount or another card.',
    action: 'Offer another card or a split payment; do not retry the same amount.',
  },
  invalid_request: {
    es: 'No pudimos procesar el pago. Inténtalo de nuevo.',
    en: 'We could not process the payment. Please try again.',
    action: 'Integration error: fix the request (parameters, keys, amount) before retrying.',
  },
  other: {
    es: 'No pudimos procesar el pago. Intenta con otra tarjeta u otro método de pago.',
    en: 'We could not process the payment. Try another card or payment method.',
    action: 'Log the code and check the gateway docs for this specific case.',
  },
});

const MAX_LISTED_CODES = 60;
const normalize = (code) => String(code).trim().toLowerCase();

/**
 * @param {{ gateway: string, code?: string, lang?: 'en'|'es' }} query
 * @param {Record<string, GatewayDeclines>} declinesByGateway
 */
export function explainDecline(query, declinesByGateway) {
  const data = Object.hasOwn(declinesByGateway, query.gateway) ? declinesByGateway[query.gateway] : undefined;
  if (!Array.isArray(data?.declineCodes)) {
    return { ok: false, error: `No decline codes for gateway "${query.gateway}". Available: ${Object.keys(declinesByGateway).join(', ')}.` };
  }
  if (data.declineCodes.length === 0) {
    const why = (data.gaps ?? []).slice(0, 1).join(' ');
    return { ok: false, error: `No ${query.gateway} decline codes could be verified against official docs (${data.verifiedAt}). ${why}`.trim() };
  }
  if (!query.code) return { ok: true, value: listCodes(data) };
  const match = data.declineCodes.find((d) => normalize(d.code) === normalize(query.code));
  if (!match) {
    const known = data.declineCodes.slice(0, MAX_LISTED_CODES).map((d) => d.code).join(', ');
    return { ok: false, error: `Code "${query.code}" is not in the ${query.gateway} list (from official docs). Known codes: ${known}.` };
  }
  const guidance = CATEGORY_GUIDANCE[match.category] ?? CATEGORY_GUIDANCE.other;
  const lang = query.lang ?? 'en';
  return {
    ok: true,
    value: {
      gateway: query.gateway,
      code: match.code,
      official: { meaning: match.officialMeaning, category: match.category, retryable: match.retryable, sourceUrl: match.sourceUrl, verifiedAt: data.verifiedAt },
      suggested: { customerMessage: guidance[lang], merchantAction: guidance.action, note: 'Suggested by test-card-hub-mcp per category, not gateway documentation.' },
    },
  };
}

function listCodes(data) {
  const codes = data.declineCodes.slice(0, MAX_LISTED_CODES);
  return {
    gateway: data.gateway,
    verifiedAt: data.verifiedAt,
    total: data.declineCodes.length,
    shown: codes.length,
    codes: codes.map((d) => ({ code: d.code, category: d.category, meaning: d.officialMeaning })),
  };
}
