/**
 * One environment block of the Manage screen: rename, edit JSON, delete, card list.
 */
import { formatCardNumber, removeCard, removeEnvironment, renameEnvironment, replaceCards } from '../../domain/index.js';
import { h, icon, iconButton } from '../dom.js';
import { t, tn } from '../i18n.js';
import { cardsToPublicJson, outcomeIcon } from '../view-model.js';
import { describeErrors, firstErrorMessage } from './errors.js';

async function applyWithUndo(ctx, operation, text) {
  const result = await ctx.store.apply(operation);
  if (!result.ok) {
    ctx.toast.show({ text: firstErrorMessage(result.errors), tone: 'error' });
    return;
  }
  ctx.toast.show({
    text,
    action: {
      label: t('common.undo'),
      onClick: async () => {
        const undone = await ctx.store.undo(result.version);
        if (!undone.ok) ctx.toast.show({ text: firstErrorMessage(undone.errors), tone: 'error' });
      },
    },
  });
}

function nameInput(ctx, env) {
  const input = h('input', { class: 'env-name-input', value: env.environment, maxlength: '40', 'aria-label': t('manage.env_name_label') });
  input.addEventListener('change', async () => {
    const result = await ctx.store.apply((state) => renameEnvironment(state, env.id, input.value));
    if (result.ok) return;
    input.value = env.environment;
    ctx.toast.show({ text: firstErrorMessage(result.errors), tone: 'error' });
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') input.blur();
    if (event.key === 'Escape' && input.value !== env.environment) {
      event.stopPropagation();
      input.value = env.environment;
    }
  });
  return input;
}

function cardRowItem(ctx, env, card) {
  const iconName = outcomeIcon(card.outcome);
  return h('li', { class: 'env-card-row' },
    h('div', null,
      h('div', { class: 'card-number' }, formatCardNumber(card.cardNumber)),
      h('span', { class: 'outcome', dataset: { outcome: card.outcome } },
        iconName ? icon(iconName, 'icon-sm') : null,
        h('span', { class: 'outcome-text' }, card.cardResponse))),
    h('div', { class: 'env-card-actions' },
      iconButton('trash', t('manage.delete_card'), () =>
        applyWithUndo(ctx, (state) => removeCard(state, env.id, card.id), t('manage.card_deleted')), { size: 'icon-sm' })));
}

function jsonEditor(ctx, env) {
  const textarea = h('textarea', { class: 'textarea', rows: '8', spellcheck: 'false', 'aria-label': t('manage.edit_json') }, cardsToPublicJson(env));
  const feedback = h('div', { role: 'alert' });
  const close = () => {
    ctx.ui.editingEnvId = null;
    ctx.rerender();
  };
  const save = async () => {
    let cards;
    try {
      cards = JSON.parse(textarea.value);
    } catch {
      feedback.replaceChildren(h('p', { class: 'field-error' }, icon('warning', 'icon-sm'), firstErrorMessage([{ code: 'import.invalid_json' }])));
      return;
    }
    const result = await ctx.store.apply((state) => replaceCards(state, env.id, cards));
    if (result.ok) {
      ctx.ui.editingEnvId = null;
      ctx.toast.show({ text: t('manage.cards_saved') });
      return;
    }
    feedback.replaceChildren(...describeErrors(result.errors).map((line) => h('p', { class: 'field-error' }, icon('warning', 'icon-sm'), line)));
  };
  return h('div', { class: 'screen-section json-editor' }, textarea, feedback,
    h('div', { class: 'json-editor-actions' },
      h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onClick: close }, t('common.cancel')),
      h('button', { class: 'btn btn-primary btn-sm', type: 'button', onClick: save }, t('manage.save_cards'))));
}

/** @returns {HTMLElement} */
export function manageEnvSection(ctx, env) {
  const dot = h('span', { class: 'env-dot' });
  dot.style.setProperty('--dot', `var(--env-${env.colorKey})`);
  const editing = ctx.ui.editingEnvId === env.id;
  const toggleEdit = () => {
    ctx.ui.editingEnvId = editing ? null : env.id;
    ctx.rerender();
  };
  const editButton = iconButton('pencil-simple', t('manage.edit_json'), toggleEdit);
  editButton.setAttribute('aria-pressed', String(editing));
  return h('section', { class: 'env-section' },
    h('div', { class: 'env-section-head' },
      dot,
      nameInput(ctx, env),
      h('span', { class: 'env-head-end' },
        h('span', { class: 'env-count' }, tn('footer.cards', env.cards.length)),
        editButton,
        iconButton('trash', t('manage.delete_env'), () =>
          applyWithUndo(ctx, (state) => removeEnvironment(state, env.id), t('manage.env_deleted', { name: env.environment }))))),
    editing ? jsonEditor(ctx, env) : null,
    env.cards.length > 0 && !editing ? h('ul', { class: 'env-cards' }, env.cards.map((card) => cardRowItem(ctx, env, card))) : null);
}
