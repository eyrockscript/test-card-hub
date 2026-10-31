/**
 * Main screen: environment tabs, search, quick values, copyable card list.
 */
import { h, icon, iconButton } from '../dom.js';
import { getLanguage, t } from '../i18n.js';
import { cardRow, flashCopied } from '../components/card-row.js';
import { envTabs } from '../components/env-tabs.js';
import { footer } from '../components/footer.js';
import { ratingBanner } from '../components/rating-banner.js';
import { filterCards, quickValues } from '../view-model.js';

const CARD_COPIED_MS = 1400;
const CHIP_COPIED_MS = 1200;
const PANEL_ID = 'card-panel';

function isTypingTarget(target) {
  return target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable);
}

function quickChips(ctx) {
  const values = quickValues(ctx.now(), getLanguage());
  const entries = [
    ['main.quick_expiry', values.expiry],
    ['main.quick_cvv', values.cvv],
    ['main.quick_postal', values.postal],
  ];
  return h('div', { class: 'quick-values' },
    h('span', { class: 'quick-values-label' }, t('main.quick_label')),
    entries.map(([labelKey, value]) => {
      const chip = h('button', {
        class: 'quick-chip',
        type: 'button',
        onClick: async () => {
          if (await ctx.copy(value)) flashCopied(chip, CHIP_COPIED_MS);
        },
      }, `${t(labelKey)} `, h('span', { class: 'mono' }, value));
      return chip;
    }));
}

function searchField(ctx, onInput) {
  const input = h('input', {
    type: 'search',
    placeholder: t('main.search_placeholder'),
    autocomplete: 'off',
    value: ctx.ui.query,
    onInput: () => onInput(input.value),
  });
  const label = h('label', { class: 'search' },
    icon('magnifying-glass'),
    h('span', { class: 'visually-hidden' }, t('main.search_label')),
    input,
    h('span', { class: 'kbd', 'aria-hidden': 'true' }, '/'));
  return { label, input };
}

function topbar(ctx, environments, selectedId) {
  const select = (id, { focus = false } = {}) => {
    if (focus) ctx.focusAfterRender(`tab-${id}`);
    ctx.selectEnvironment(id);
  };
  return h('header', { class: 'topbar' },
    envTabs({ environments, selectedId, panelId: PANEL_ID, onSelect: select }),
    iconButton('plus', t('main.add_label'), () => ctx.go('add')),
    iconButton('gear-six', t('main.manage_label'), () => ctx.go('manage')));
}

function copyCardHandler(ctx) {
  return async (card, row) => {
    const ok = await ctx.copy(card.cardNumber);
    if (ok) flashCopied(row, CARD_COPIED_MS);
  };
}

function listContent(ctx, env, onCopy) {
  const visible = filterCards(env.cards, ctx.ui.query);
  const items = visible.map((card, index) => cardRow({ card, index, onCopy }));
  const noteKey = (() => {
    if (env.cards.length === 0) return 'main.env_empty';
    return visible.length === 0 ? 'main.no_results' : null;
  })();
  return {
    visible,
    nodes: [
      h('ul', { class: 'card-list' }, items),
      noteKey ? h('p', { class: 'list-note no-results' }, t(noteKey, { query: ctx.ui.query })) : null,
      visible.length > 0 ? h('p', { class: 'list-note' }, t('main.list_note')) : null,
    ],
  };
}

function bottomArea(ctx, env) {
  const parts = [];
  if (!ctx.toast.isOpen() && ctx.engagement.shouldShowPrompt()) {
    parts.push(ratingBanner({
      onRate: async () => {
        await ctx.engagement.markRated();
        ctx.openUrl(ctx.links.rate);
        ctx.rerender();
      },
      onReport: () => ctx.openUrl(ctx.links.report),
      onDismiss: async () => {
        await ctx.engagement.dismiss();
        ctx.rerender();
      },
    }));
  }
  parts.push(footer({ version: ctx.version, cardCount: env.cards.length }));
  return h('div', null, parts);
}

/** @returns {HTMLElement} */
export function renderMain(ctx) {
  const environments = ctx.store.getState();
  const env = environments.find((e) => e.id === ctx.ui.selectedEnvId) ?? environments[0];
  const onCopy = copyCardHandler(ctx);
  const body = h('div', { class: 'screen-body', id: PANEL_ID, role: 'tabpanel', 'aria-labelledby': `tab-${env.id}` });
  let visible = [];

  const refreshList = () => {
    const content = listContent(ctx, env, onCopy);
    visible = content.visible;
    body.replaceChildren(...content.nodes.filter(Boolean));
  };
  const search = searchField(ctx, (value) => {
    ctx.ui.query = value;
    refreshList();
  });
  refreshList();

  ctx.setKeyHandler((event) => {
    if (event.key === '/' && !isTypingTarget(event.target)) {
      event.preventDefault();
      search.input.focus();
    } else if (event.key === 'Escape' && ctx.ui.query !== '') {
      event.preventDefault();
      ctx.ui.query = '';
      search.input.value = '';
      refreshList();
    } else if (/^[1-9]$/.test(event.key) && !isTypingTarget(event.target) && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const card = visible[Number(event.key) - 1];
      const row = card && body.querySelector(`[data-card-id="${card.id}"]`);
      if (row) onCopy(card, row);
    }
  });

  return h('section', { class: 'screen' },
    h('div', null, topbar(ctx, environments, env.id), h('div', { class: 'toolbar' }, search.label, quickChips(ctx))),
    body,
    bottomArea(ctx, env));
}
