/**
 * Environment tab strip (role=tablist) with roving tabindex and arrow-key navigation.
 */
import { h } from '../dom.js';
import { t } from '../i18n.js';

function buildTab(env, selected, panelId, onSelect) {
  const dot = h('span', { class: 'env-dot' });
  dot.style.setProperty('--dot', `var(--env-${env.colorKey})`);
  return h('button', {
    class: 'env-tab',
    type: 'button',
    role: 'tab',
    id: `tab-${env.id}`,
    'aria-selected': String(selected),
    'aria-controls': panelId,
    tabindex: selected ? '0' : '-1',
    dataset: { envId: env.id },
    onClick: () => onSelect(env.id),
  }, dot, env.environment);
}

const NAV_KEYS = { ArrowRight: 1, ArrowLeft: -1 };

function handleKeys(event, environments, selectedId, onSelect) {
  const index = environments.findIndex((env) => env.id === selectedId);
  let next = null;
  if (event.key in NAV_KEYS) next = (index + NAV_KEYS[event.key] + environments.length) % environments.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = environments.length - 1;
  if (next === null) return;
  event.preventDefault();
  onSelect(environments[next].id, { focus: true });
}

/**
 * @param {{ environments: object[], selectedId: string|null, panelId: string,
 *   onSelect: (id: string, options?: { focus?: boolean }) => void }} props
 */
export function envTabs({ environments, selectedId, panelId, onSelect }) {
  const tabs = h('div', {
    class: 'env-tabs',
    role: 'tablist',
    'aria-label': t('main.environments_label'),
    onKeydown: (event) => handleKeys(event, environments, selectedId, onSelect),
  }, environments.map((env) => buildTab(env, env.id === selectedId, panelId, onSelect)));
  queueMicrotask(() => tabs.querySelector('[aria-selected="true"]')?.scrollIntoView({ inline: 'nearest', block: 'nearest' }));
  return tabs;
}
