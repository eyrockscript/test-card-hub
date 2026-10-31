/**
 * Single toast bound to a persistent element (role=status, aria-live=polite).
 */
import { h, icon } from './dom.js';

const DEFAULT_MS = 3000;
const ACTION_MS = 6000;

export function createToast(element) {
  let timer = null;
  let cleanupTimer = null;

  function hide() {
    clearTimeout(timer);
    element.dataset.open = 'false';
    clearTimeout(cleanupTimer);
    cleanupTimer = setTimeout(() => {
      if (element.dataset.open !== 'true') element.replaceChildren();
    }, 250);
  }

  /**
   * @param {{ text: string, tone?: 'error', action?: { label: string, onClick: () => void } }} options
   */
  function show({ text, tone, action }) {
    clearTimeout(timer);
    clearTimeout(cleanupTimer);
    if (tone) element.dataset.tone = tone;
    else delete element.dataset.tone;
    const children = [h('span', { class: 'toast-text' }, text)];
    if (action) {
      const onClick = () => {
        hide();
        action.onClick();
      };
      children.push(h('button', { class: 'btn', type: 'button', onClick }, icon('arrow-counter-clockwise', 'icon-sm'), action.label));
    }
    element.replaceChildren(...children);
    element.dataset.open = 'true';
    timer = setTimeout(hide, action ? ACTION_MS : DEFAULT_MS);
  }

  return Object.freeze({ show, hide, isOpen: () => element.dataset.open === 'true' });
}
