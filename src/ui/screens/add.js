/**
 * Add screen shell: back button, Card / JSON / Gateways segmented control.
 */
import { h, iconButton } from '../dom.js';
import { t } from '../i18n.js';
import { buildCardForm } from './add-card-form.js';
import { buildGateways } from './add-gateways.js';
import { buildJsonImport } from './add-json.js';

const TABS = Object.freeze([
  ['card', 'add.tab_card', buildCardForm],
  ['json', 'add.tab_json', buildJsonImport],
  ['gateways', 'add.tab_gateways', buildGateways],
]);

function segmented(ctx, activeTab) {
  const ids = TABS.map(([id]) => id);
  const select = (id) => {
    ctx.ui.addTab = id;
    ctx.focusAfterRender(`seg-${id}`);
    ctx.rerender();
  };
  return h('div', {
    class: 'segmented',
    role: 'tablist',
    'aria-label': t('add.tabs_label'),
    onKeydown: (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      select(ids[(ids.indexOf(activeTab) + step + ids.length) % ids.length]);
    },
  }, TABS.map(([id, labelKey]) => h('button', {
    type: 'button',
    role: 'tab',
    id: `seg-${id}`,
    'aria-selected': String(id === activeTab),
    'aria-controls': 'add-panel',
    tabindex: id === activeTab ? '0' : '-1',
    onClick: () => select(id),
  }, t(labelKey))));
}

export function renderAdd(ctx) {
  const activeTab = TABS.some(([id]) => id === ctx.ui.addTab) ? ctx.ui.addTab : 'card';
  const [, , build] = TABS.find(([id]) => id === activeTab);
  const { content, actions, focusTarget } = build(ctx);
  ctx.setKeyHandler((event) => {
    if (event.key === 'Escape') ctx.go('main');
  });
  if (focusTarget) ctx.after(() => focusTarget.focus());
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' },
      iconButton('arrow-left', t('common.back'), () => ctx.go('main')),
      h('h1', { class: 'screen-title' }, t('add.title'))),
    h('div', { class: 'screen-body' },
      h('div', { class: 'screen-section', id: 'add-panel', role: 'tabpanel' }, segmented(ctx, activeTab), content)),
    actions ?? h('div'));
}
