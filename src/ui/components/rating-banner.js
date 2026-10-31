/**
 * Inline, non-modal rating banner. Both links are visible to everyone at once
 * (no sentiment gating); the close button only defers the prompt.
 */
import { h, iconButton } from '../dom.js';
import { t } from '../i18n.js';

/** @param {{ onRate: () => void, onReport: () => void, onDismiss: () => void }} props */
export function ratingBanner({ onRate, onReport, onDismiss }) {
  return h('aside', { class: 'rating-banner', 'aria-label': t('rating.region_label') },
    h('p', { class: 'rating-text' }, t('rating.text')),
    h('div', { class: 'rating-actions' },
      h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onClick: onRate }, t('rating.rate')),
      h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onClick: onReport }, t('rating.report')),
      iconButton('x', t('rating.not_now'), onDismiss, { size: 'icon-sm' })));
}
