/**
 * One copyable card row (a <button> inside the card list).
 */
import { formatCardNumber } from '../../domain/index.js';
import { h, icon } from '../dom.js';
import { t } from '../i18n.js';
import { brandLabel, outcomeIcon } from '../view-model.js';

function outcomeChip(card) {
  const iconName = outcomeIcon(card.outcome);
  return h('span', { class: 'outcome', dataset: { outcome: card.outcome } },
    iconName ? icon(iconName, 'icon-sm') : null,
    h('span', { class: 'outcome-text' }, card.cardResponse));
}

/**
 * @param {{ card: object, index: number, onCopy: (card: object, row: HTMLElement) => void }} props
 * @returns {HTMLLIElement}
 */
export function cardRow({ card, index, onCopy }) {
  const display = formatCardNumber(card.cardNumber);
  const row = h('button', {
    class: 'card-row',
    type: 'button',
    'aria-label': t('main.copy_card', { number: display, response: card.cardResponse }),
    dataset: { cardId: card.id },
    onClick: () => onCopy(card, row),
  },
  h('span', { class: 'brand-badge' }, brandLabel(card.cardNumber)),
  h('span', { class: 'card-main' },
    h('span', { class: 'card-number' }, display),
    h('span', { class: 'card-meta' },
      outcomeChip(card),
      card.note ? h('span', { class: 'card-note', title: card.note }, card.note) : null),
    h('span', { class: 'copied-label' }, icon('check'), t('main.copied_number', { number: display }))),
  h('span', { class: 'card-trail' },
    index < 9 ? h('span', { class: 'kbd' }, String(index + 1)) : null,
    icon('copy', 'icon', 'copy-icon'),
    icon('check', 'icon', 'check-icon')));
  return h('li', null, row);
}

/** Marks a row as copied for `ms`, then restores it. */
export function flashCopied(element, ms) {
  element.dataset.state = 'copied';
  setTimeout(() => {
    if (element.isConnected) delete element.dataset.state;
  }, ms);
}
