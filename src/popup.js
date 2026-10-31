/**
 * Composition root: wires chrome.* APIs, storage and the UI together.
 */
import { createStorageRepository } from './infrastructure/storage-repository.js';
import { createPreferences } from './infrastructure/preferences.js';
import { createStore } from './application/store.js';
import { createEngagement } from './application/engagement.js';
import { GATEWAY_PRESETS } from './data/gateway-presets.js';
import { createDefaultEnvironments } from './domain/index.js';
import { createApp } from './ui/app.js';
import { getLanguage, initI18n, onLanguageChange } from './ui/i18n.js';
import { createToast } from './ui/toast.js';
import { buildKnownNumbers } from './ui/view-model.js';

const IMPORT_VIEWS = Object.freeze({
  json: { screen: 'add', addTab: 'json' },
  backup: { screen: 'manage' },
});

/**
 * 'popup' = toolbar popup, 'tab' = regular tab. `?surface=popup` forces popup
 * behavior (used by e2e tests, which can only open the page in a tab).
 */
async function detectSurface(params) {
  if (params.get('surface') === 'popup') return 'popup';
  try {
    return (await chrome.tabs.getCurrent()) ? 'tab' : 'popup';
  } catch {
    return 'popup';
  }
}

async function start() {
  const params = new URLSearchParams(window.location.search);
  const surface = await detectSurface(params);
  document.documentElement.dataset.surface = surface;
  const initialView = params.get('view') === 'import' ? IMPORT_VIEWS[params.get('target')] : undefined;
  const area = chrome.storage.local;
  const preferences = createPreferences(area);
  await initI18n({ preferences, getBrowserLanguage: () => chrome.i18n.getUILanguage() });

  const repository = createStorageRepository({ area, legacyStorage: window.localStorage, defaultLanguage: getLanguage() });
  const initialState = await repository.load();
  const store = createStore({ repository, initialState });
  const engagement = await createEngagement({ preferences });
  const lastEnvId = await preferences.get('lastEnvironmentId');

  const app = createApp({
    root: document.getElementById('app'),
    store,
    toast: createToast(document.getElementById('toast')),
    engagement,
    preferences,
    platform: {
      copyText: (text) => navigator.clipboard.writeText(text),
      openUrl: (url) => chrome.tabs.create({ url }),
      version: chrome.runtime.getManifest().version,
      surface,
      openImportTab: (target) => chrome.tabs.create({ url: chrome.runtime.getURL(`popup.html?view=import&target=${target}`) }),
    },
    data: {
      presets: GATEWAY_PRESETS,
      knownNumbers: buildKnownNumbers(GATEWAY_PRESETS, createDefaultEnvironments()),
    },
    initialEnvId: lastEnvId,
    initialView,
  });
  onLanguageChange(() => app.render());
  app.render();
}

start().catch((error) => {
  console.error('[popup] failed to start', error);
  document.getElementById('app').textContent = 'Test Card Hub could not start. Reload the extension.';
});
