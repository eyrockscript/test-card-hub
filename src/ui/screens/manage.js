/**
 * Manage screen: rename / edit / delete environments, backup export and import.
 */
import { serializeBackup } from '../../domain/index.js';
import { h, icon, iconButton } from '../dom.js';
import { t } from '../i18n.js';
import { createFileTrigger, importStrict } from '../components/import-flow.js';
import { manageEnvSection } from '../components/manage-env-section.js';

const pad = (value) => String(value).padStart(2, '0');

export function backupFileName(date) {
  return `test-card-hub-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

function downloadBackup(ctx) {
  const now = ctx.now();
  const blob = new Blob([serializeBackup(ctx.store.getState(), now)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = h('a', { href: url, download: backupFileName(now) });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  ctx.toast.show({ text: t('manage.backup_exported') });
}

function footerArea(ctx) {
  const trigger = createFileTrigger({
    ctx,
    importTarget: 'backup',
    accept: '.json,application/json',
    onText: (text) => importStrict(ctx, text),
    onError: (error) => ctx.toast.show({ text: t(error?.code === 'file.too_large' ? 'json.file_too_large' : 'json.file_read_failed'), tone: 'error' }),
  });
  return h('div', null,
    h('div', { class: 'manage-footer' },
      h('button', { class: 'btn btn-secondary', type: 'button', onClick: () => downloadBackup(ctx) },
        icon('download-simple', 'icon-sm'), t('manage.export')),
      h('button', { class: 'btn btn-secondary', type: 'button', onClick: trigger.open },
        icon('upload-simple', 'icon-sm'), t('manage.import')),
      trigger.input),
    h('p', { class: 'manage-links' },
      h('button', { class: 'link-btn', type: 'button', onClick: () => ctx.openUrl(ctx.links.rate) }, t('manage.rate')),
      h('span', { 'aria-hidden': 'true' }, '·'),
      h('button', { class: 'link-btn', type: 'button', onClick: () => ctx.openUrl(ctx.links.report) }, t('manage.report'))));
}

export function renderManage(ctx) {
  ctx.setKeyHandler((event) => {
    if (event.key === 'Escape') ctx.go('main');
  });
  const environments = ctx.store.getState();
  const back = iconButton('arrow-left', t('common.back'), () => ctx.go('main'));
  ctx.after(() => back.focus());
  return h('section', { class: 'screen' },
    h('header', { class: 'screen-head' }, back, h('h1', { class: 'screen-title' }, t('manage.title'))),
    h('div', { class: 'screen-body' },
      environments.length === 0
        ? h('p', { class: 'list-note no-results' }, t('manage.no_environments'))
        : environments.map((env) => manageEnvSection(ctx, env))),
    footerArea(ctx));
}
