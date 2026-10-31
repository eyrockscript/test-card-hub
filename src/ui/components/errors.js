/**
 * Maps domain error objects ({ code, env?, card? }) to localized text.
 */
import { t } from '../i18n.js';
import { firstErrors } from '../view-model.js';

export function errorMessage(error) {
  const key = `error.${error.code}`;
  const text = t(key);
  return text === key ? t('error.unknown') : text;
}

/** First error of a result, as text. */
export const firstErrorMessage = (errors) => errorMessage(errors?.[0] ?? { code: 'unknown' });

/** Localized line with its position, e.g. "Environment 2, card 3: ...". */
export function describeLocatedError(error) {
  const message = errorMessage(error);
  if (error.env !== undefined && error.card !== undefined) {
    return t('import.error_at_card', { env: error.env + 1, card: error.card + 1, message });
  }
  if (error.env !== undefined) return t('import.error_at_env', { env: error.env + 1, message });
  if (error.card !== undefined) return t('import.error_at_item', { card: error.card + 1, message });
  return message;
}

export const describeErrors = (errors, limit = 5) => firstErrors(errors, limit).map(describeLocatedError);
