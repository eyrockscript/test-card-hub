/**
 * Runtime i18n. Preference 'auto' | 'es' | 'en' is persisted under 'uiLanguage'.
 * 'auto' follows the browser UI language: Spanish if it starts with 'es', else English.
 */
import { es } from '../i18n/es.js';
import { en } from '../i18n/en.js';

export const LANGUAGE_PREFERENCES = Object.freeze(['auto', 'es', 'en']);
const DICTIONARIES = Object.freeze({ es, en });
const PREFERENCE_KEY = 'uiLanguage';

let preference = 'auto';
let language = 'es';
let preferences = null;
let browserLanguage = () => 'en';
const listeners = new Set();

export function resolveLanguage(pref, browserLang) {
  if (pref === 'es' || pref === 'en') return pref;
  return String(browserLang ?? '').toLowerCase().startsWith('es') ? 'es' : 'en';
}

function applyLanguage() {
  language = resolveLanguage(preference, browserLanguage());
  document.documentElement.lang = language;
}

/** @param {{ preferences: { get: Function, set: Function }, getBrowserLanguage: () => string }} deps */
export async function initI18n(deps) {
  preferences = deps.preferences;
  browserLanguage = deps.getBrowserLanguage;
  const stored = await preferences.get(PREFERENCE_KEY, 'auto');
  preference = LANGUAGE_PREFERENCES.includes(stored) ? stored : 'auto';
  applyLanguage();
}

export async function setLanguagePreference(next) {
  if (!LANGUAGE_PREFERENCES.includes(next)) return;
  preference = next;
  applyLanguage();
  if (preferences) await preferences.set(PREFERENCE_KEY, next);
  listeners.forEach((listener) => listener(language));
}

export const getLanguage = () => language;
export const getLanguagePreference = () => preference;

export function onLanguageChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Looks up `key` and replaces `{name}` placeholders. Missing keys return the key itself. */
export function translate(dictionary, key, params = {}) {
  const template = dictionary[key];
  if (template === undefined) return key;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}

export const t = (key, params) => translate(DICTIONARIES[language], key, params);

/** Picks `<key>_one` or `<key>_other` from the count and exposes it as {n}. */
export const tn = (key, count, params = {}) => t(`${key}_${count === 1 ? 'one' : 'other'}`, { ...params, n: count });
