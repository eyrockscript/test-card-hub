/**
 * Shared footer: version, optional card count, language switch.
 */
import { h } from '../dom.js';
import { LANGUAGE_PREFERENCES, getLanguagePreference, setLanguagePreference, t, tn } from '../i18n.js';

const LANGUAGE_LABELS = Object.freeze({ auto: 'footer.lang_auto', es: 'footer.lang_es', en: 'footer.lang_en' });

function languageSwitch() {
  const current = getLanguagePreference();
  return h('span', { class: 'lang-switch', role: 'group', 'aria-label': t('footer.language_label') },
    LANGUAGE_PREFERENCES.map((pref) => h('button', {
      type: 'button',
      'aria-pressed': String(pref === current),
      onClick: () => setLanguagePreference(pref),
    }, t(LANGUAGE_LABELS[pref]))));
}

/** @param {{ version: string, cardCount?: number }} props */
export function footer({ version, cardCount }) {
  return h('footer', { class: 'footer' },
    h('span', { class: 'footer-meta' },
      h('span', { class: 'mono' }, `v${version}`),
      cardCount === undefined ? null : h('span', null, tn('footer.cards', cardCount))),
    h('span', { class: 'footer-end' }, languageSwitch()));
}
