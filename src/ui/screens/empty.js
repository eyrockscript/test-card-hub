/**
 * Empty state shown when the user has no environments.
 */
import { h, icon, iconButton } from '../dom.js';
import { t } from '../i18n.js';
import { footer } from '../components/footer.js';

export function renderEmpty(ctx) {
  ctx.setKeyHandler(() => {});
  return h('section', { class: 'screen' },
    h('header', { class: 'topbar' },
      h('div', { class: 'env-tabs' }),
      iconButton('plus', t('main.add_label'), () => ctx.go('add')),
      iconButton('gear-six', t('main.manage_label'), () => ctx.go('manage'))),
    h('div', { class: 'screen-body' },
      h('div', { class: 'empty-state' },
        h('div', { class: 'empty-heading' }, icon('credit-card'), h('h2', { class: 'empty-title' }, t('empty.title'))),
        h('p', { class: 'empty-text' }, t('empty.text')),
        h('div', { class: 'empty-actions' },
          h('button', { class: 'btn btn-primary', type: 'button', onClick: () => ctx.go('add', { addTab: 'gateways' }) }, t('empty.see_gateways')),
          h('button', { class: 'btn btn-secondary', type: 'button', onClick: () => ctx.go('add', { addTab: 'card' }) }, t('empty.add_card'))))),
    footer({ version: ctx.version }));
}
