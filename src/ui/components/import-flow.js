/**
 * Shared import helpers used by the JSON tab and the backup import in Manage.
 */
import { mergeEnvironments, parseImportPayload } from '../../domain/index.js';
import { h } from '../dom.js';
import { t, tn } from '../i18n.js';
import { firstErrorMessage } from './errors.js';

export const MAX_IMPORT_BYTES = 1_000_000;

/** Reads a File as text (FileReader). Rejects when it is too large or unreadable. */
export function readFileText(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMPORT_BYTES) {
      reject(Object.assign(new Error('file.too_large'), { code: 'file.too_large' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('file.read_failed'));
    reader.readAsText(file);
  });
}

/**
 * Hidden file input plus an `open()` trigger. Text is delivered to `onText`.
 * Inside the toolbar popup a native file chooser can close the popup and kill the
 * FileReader, so there `open()` hands over to a regular tab (`importTarget`) instead.
 */
export function createFileTrigger({ ctx, importTarget, accept, onText, onError }) {
  const input = h('input', { type: 'file', accept, hidden: true, tabindex: '-1' });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      onText(await readFileText(file));
    } catch (error) {
      onError(error);
    }
  });
  const open = () => (ctx?.surface === 'popup' ? ctx.openImportTab(importTarget) : input.click());
  return { input, open };
}

export function summaryText(meta) {
  const added = tn('import.cards_added', meta.addedCards);
  return meta.skippedDuplicates > 0 ? `${added}. ${tn('import.cards_skipped', meta.skippedDuplicates)}` : added;
}

/**
 * Merges parsed environments into the store and reports with a toast.
 * @returns {Promise<boolean>} true when the merge was applied
 */
export async function mergeParsed(ctx, environments) {
  const result = await ctx.store.apply((state) => mergeEnvironments(state, environments, 'merge'));
  if (!result.ok) {
    ctx.toast.show({ text: firstErrorMessage(result.errors), tone: 'error' });
    return false;
  }
  const first = environments[0]?.environment;
  if (first) ctx.selectEnvironmentByName(first);
  ctx.toast.show({ text: summaryText(result.meta) });
  return true;
}

/** Strict import used by backups: anything invalid aborts with a clear message. */
export async function importStrict(ctx, text) {
  const parsed = parseImportPayload(text);
  if (!parsed.ok) {
    ctx.toast.show({ text: `${t('import.nothing_imported')} ${firstErrorMessage(parsed.errors)}`, tone: 'error' });
    return false;
  }
  return mergeParsed(ctx, parsed.value);
}
