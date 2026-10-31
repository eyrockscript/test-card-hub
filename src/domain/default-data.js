/**
 * First-run data: the same 3 cards the legacy popup.js seeded as "default".
 */
import { restoreState } from './environment-import.js';

const DEFAULT_CARDS = Object.freeze([
  { cardNumber: '5451951574925480', outcome: 'approved', responses: { es: 'Transacción aprobada', en: 'Approved transaction' } },
  { cardNumber: '4574441215190335', outcome: 'declined', responses: { es: 'Tarjeta no válida', en: 'Invalid card' } },
  { cardNumber: '4349003000047015', outcome: 'insufficient', responses: { es: 'Tarjeta sin fondos', en: 'Insufficient funds' } },
]);

/**
 * @param {'es'|'en'} [language] response language; anything but 'en' falls back to Spanish
 * @returns {readonly import('./environment-model.js').Environment[]} fresh ids on every call
 */
export function createDefaultEnvironments(language = 'es') {
  const lang = language === 'en' ? 'en' : 'es';
  const cards = DEFAULT_CARDS.map(({ cardNumber, outcome, responses }) => ({ cardNumber, outcome, cardResponse: responses[lang] }));
  return restoreState([{ environment: 'default', colorKey: 'slate', cards }]).value;
}
