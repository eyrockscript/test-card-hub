/**
 * Tiny DOM helpers. Everything is built with createElement + textContent so
 * user and imported data can never be interpreted as markup.
 */
const SVG_NS = 'http://www.w3.org/2000/svg';
const ICON_SPRITE = 'assets/icons.svg';

/**
 * @param {string} tag
 * @param {Record<string, unknown>|null} [attrs] `class`, `dataset`, `on*` handlers, booleans and plain attributes
 * @param {...(Node|string|number|null|undefined|false)} children
 * @returns {HTMLElement}
 */
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  applyAttributes(el, attrs ?? {});
  appendChildren(el, children);
  return el;
}

function applyAttributes(el, attrs) {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'value' || key === 'checked') el[key] = value;
    else el.setAttribute(key, value === true ? '' : String(value));
  }
}

function appendChildren(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === undefined || child === null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

/** @param {string} name sprite id without the `i-` prefix @param {'icon'|'icon-sm'} [size] */
export function icon(name, size = 'icon', extraClass = '') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', extraClass ? `${size} ${extraClass}` : size);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `${ICON_SPRITE}#i-${name}`);
  svg.append(use);
  return svg;
}

/** Icon-only button with a mandatory accessible label. */
export function iconButton(name, label, onClick, { size = 'icon', extraClass = '' } = {}) {
  return h('button', { class: `icon-btn ${extraClass}`.trim(), type: 'button', 'aria-label': label, title: label, onClick }, icon(name, size));
}

export function clear(el) {
  el.replaceChildren();
  return el;
}
