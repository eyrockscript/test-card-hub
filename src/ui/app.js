/**
 * UI shell: owns navigation state, renders the active screen into #app and
 * hands every screen a small context object.
 */
import { t } from './i18n.js';
import { renderAdd } from './screens/add.js';
import { renderEmpty } from './screens/empty.js';
import { renderMain } from './screens/main.js';
import { renderManage } from './screens/manage.js';

export const LINKS = Object.freeze({
  rate: 'https://chromewebstore.google.com/detail/nkpgepoonipokhghifbocnohiaoigaeg/reviews',
  report: 'https://github.com/eyrockscript/test-card-hub/issues/new',
});

const nameKey = (name) => name.trim().toLowerCase();

/**
 * @param {{ root: HTMLElement, store: object, toast: object, engagement: object, preferences: object,
 *   platform: { copyText: (text: string) => Promise<void>, openUrl: (url: string) => void, version: string,
 *     surface: 'popup'|'tab', openImportTab: (target: 'json'|'backup') => void },
 *   data: { presets: object[], knownNumbers: Set<string> }, initialEnvId?: string, initialView?: { screen: string, addTab?: string }, now?: () => Date }} deps
 */
export function createApp({ root, store, toast, engagement, preferences, platform, data, initialEnvId, initialView, now = () => new Date() }) {
  const ui = { screen: 'main', addTab: 'card', selectedEnvId: initialEnvId ?? null, query: '', editingEnvId: null, ...initialView };
  let keyHandler = () => {};
  let afterQueue = [];
  let pendingFocusId = null;
  let lastScreenKey = '';

  const currentEnv = () => {
    const state = store.getState();
    return state.find((env) => env.id === ui.selectedEnvId) ?? state[0];
  };

  function chooseScreen() {
    if (ui.screen === 'main') return store.getState().length === 0 ? renderEmpty(ctx) : renderMain(ctx);
    return ui.screen === 'add' ? renderAdd(ctx) : renderManage(ctx);
  }

  function render() {
    const screenKey = `${ui.screen}:${ui.screen === 'add' ? ui.addTab : ''}`;
    const scrollTop = screenKey === lastScreenKey ? (root.querySelector('.screen-body')?.scrollTop ?? 0) : 0;
    lastScreenKey = screenKey;
    afterQueue = [];
    keyHandler = () => {};
    root.replaceChildren(chooseScreen());
    const body = root.querySelector('.screen-body');
    if (body) body.scrollTop = scrollTop;
    const queue = afterQueue;
    afterQueue = [];
    queue.forEach((callback) => callback());
    if (pendingFocusId) document.getElementById(pendingFocusId)?.focus();
    pendingFocusId = null;
  }

  function selectEnvironment(id) {
    ui.selectedEnvId = id;
    preferences.set('lastEnvironmentId', id);
    render();
  }

  async function copy(text) {
    try {
      await platform.copyText(text);
    } catch (error) {
      console.warn('[app] clipboard write failed', error);
      toast.show({ text: t('main.copy_failed'), tone: 'error' });
      return false;
    }
    await engagement.recordCopy();
    return true;
  }

  const ctx = {
    store,
    toast,
    engagement,
    ui,
    data,
    links: LINKS,
    version: platform.version,
    now,
    copy,
    surface: platform.surface,
    openImportTab: platform.openImportTab,
    openUrl: platform.openUrl,
    rerender: render,
    selectEnvironment,
    currentEnvironmentName: () => currentEnv()?.environment ?? '',
    selectEnvironmentByName(name) {
      const match = store.getState().find((env) => nameKey(env.environment) === nameKey(name));
      if (match) selectEnvironment(match.id);
    },
    go(screen, patch = {}) {
      Object.assign(ui, { editingEnvId: null }, patch, { screen });
      render();
    },
    setKeyHandler(handler) { keyHandler = handler; },
    after(callback) { afterQueue.push(callback); },
    focusAfterRender(id) { pendingFocusId = id; },
  };

  document.addEventListener('keydown', (event) => keyHandler(event));
  store.subscribe(render);
  return Object.freeze({ render });
}
