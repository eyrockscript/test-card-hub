/**
 * "Gateways" tab of the Add screen: one-click gateway test card packs.
 */
import { createEnvironmentFromPreset } from '../../domain/index.js';
import { h } from '../dom.js';
import { getLanguage, t, tn } from '../i18n.js';
import { firstErrorMessage } from '../components/errors.js';
import { formatVerifiedDate, isPresetAdded, presetForLanguage, presetHint } from '../view-model.js';

function addPreset(ctx, preset) {
  return async () => {
    const input = presetForLanguage(preset, getLanguage());
    const result = await ctx.store.apply((state) => {
      const built = createEnvironmentFromPreset(input, state);
      return built.ok ? { ok: true, value: [...state, built.value] } : built;
    });
    if (!result.ok) return ctx.toast.show({ text: firstErrorMessage(result.errors), tone: 'error' });
    return ctx.toast.show({ text: t('gateways.added_toast', { name: preset.name }) });
  };
}

function presetRow(ctx, preset) {
  const added = isPresetAdded(ctx.store.getState(), preset);
  const meta = `${tn('gateways.cards', preset.cards.length)} · ${presetHint(preset, getLanguage())}`;
  return h('li', { class: 'preset-row' },
    h('div', null,
      h('div', { class: 'preset-name' }, preset.name),
      h('div', { class: 'preset-meta preset-hint', title: meta }, meta),
      h('a', { class: 'preset-link', href: preset.docsUrl, target: '_blank', rel: 'noopener noreferrer' }, t('gateways.docs'))),
    added
      ? h('span', { class: 'env-count' }, t('gateways.added'))
      : h('button', {
        class: 'btn btn-secondary btn-sm',
        type: 'button',
        'aria-label': t('gateways.add_named', { name: preset.name }),
        onClick: addPreset(ctx, preset),
      }, t('gateways.add')));
}

/** @returns {{ content: HTMLElement, actions: null }} */
export function buildGateways(ctx) {
  const latest = ctx.data.presets.map((preset) => preset.verifiedAt).sort().at(-1);
  const content = h('div', null,
    h('ul', { class: 'preset-list' }, ctx.data.presets.map((preset) => presetRow(ctx, preset))),
    h('p', { class: 'field-help gateway-note' }, t('gateways.note', { date: formatVerifiedDate(latest, getLanguage()) })));
  return { content, actions: null };
}
