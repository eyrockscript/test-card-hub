/**
 * "Card" tab of the Add screen: single-card form with live validation.
 */
import { addCardToEnvironment, detectBrand, inferOutcome, normalizeCardNumber } from '../../domain/index.js';
import { h, icon } from '../dom.js';
import { t } from '../i18n.js';
import { firstErrorMessage } from '../components/errors.js';
import { brandLabel, formatWithCaret, numberFieldStatus } from '../view-model.js';

const OUTCOME_CHOICES = Object.freeze(['approved', 'declined', 'insufficient', 'review', 'other']);
const FIELD_OF_CODE = Object.freeze({
  'environment.name_type': 'env',
  'environment.name_length': 'env',
  'card.number_type': 'number',
  'card.number_length': 'number',
  'card.duplicate': 'number',
  'card.response_type': 'response',
  'card.response_required': 'response',
  'card.response_length': 'response',
});

const STATUS_MESSAGES = Object.freeze({ luhn_failed: 'add.number_luhn_failed', unknown_number: 'add.number_unknown' });

function messageLine(kind, id, text) {
  return h('p', { class: `field-${kind}`, id }, icon('warning', 'icon-sm'), text);
}

/** Replaces the single message slot under a field and syncs ARIA. */
function setSlot(slot, input, { kind, text, help }) {
  const id = `${input.id}-msg`;
  if (kind && text) slot.replaceChildren(messageLine(kind, id, text));
  else if (help) slot.replaceChildren(h('p', { class: 'field-help', id }, help));
  else slot.replaceChildren();
  input.setAttribute('aria-invalid', String(kind === 'error'));
  if (slot.firstChild) input.setAttribute('aria-describedby', id);
  else input.removeAttribute('aria-describedby');
}

/** Backspace over a group space removed no digit: drop the digit before the caret instead. */
function dropDigitBeforeCaret(input) {
  const caret = input.selectionStart ?? 0;
  const before = normalizeCardNumber(input.value.slice(0, caret)).slice(0, -1);
  return { raw: before + normalizeCardNumber(input.value.slice(caret)), caret: before.length };
}

/** @returns {{ content: HTMLElement, actions: HTMLElement }} */
export function buildCardForm(ctx) {
  const state = { manualOutcome: false };
  const envInput = h('input', { id: 'f-env', class: 'input', list: 'env-names', autocomplete: 'off', value: ctx.currentEnvironmentName() });
  const envSlot = h('div');
  const numberInput = h('input', { id: 'f-number', class: 'input mono', inputmode: 'numeric', autocomplete: 'off', placeholder: '4242 4242 4242 4242' });
  const numberSlot = h('div');
  const badge = h('span', { class: 'brand-badge' }, brandLabel(''));
  const responseInput = h('input', { id: 'f-response', class: 'input', autocomplete: 'off', placeholder: t('add.response_placeholder') });
  const responseSlot = h('div');
  const radios = OUTCOME_CHOICES.map((outcome) => h('input', {
    type: 'radio', name: 'f-outcome', id: `f-outcome-${outcome}`, value: outcome, checked: outcome === 'other',
    onChange: () => { state.manualOutcome = true; },
  }));
  const slots = { env: [envSlot, envInput], number: [numberSlot, numberInput], response: [responseSlot, responseInput] };

  const refreshNumber = () => {
    const digits = normalizeCardNumber(numberInput.value);
    badge.textContent = brandLabel(digits);
    badge.dataset.brand = detectBrand(digits);
    const status = numberFieldStatus(digits, ctx.data.knownNumbers);
    const messageKey = STATUS_MESSAGES[status];
    setSlot(numberSlot, numberInput, messageKey ? { kind: 'warning', text: t(messageKey) } : {});
  };

  numberInput.addEventListener('input', (event) => {
    const previous = numberInput.dataset.digits ?? '';
    let raw = numberInput.value;
    let caret = numberInput.selectionStart ?? raw.length;
    if (event.inputType === 'deleteContentBackward' && normalizeCardNumber(raw) === previous && previous !== '') {
      ({ raw, caret } = dropDigitBeforeCaret(numberInput));
    }
    const formatted = formatWithCaret(raw, caret);
    numberInput.value = formatted.value;
    numberInput.setSelectionRange(formatted.caret, formatted.caret);
    numberInput.dataset.digits = normalizeCardNumber(formatted.value);
    refreshNumber();
  });

  responseInput.addEventListener('input', () => {
    if (state.manualOutcome) return;
    const inferred = inferOutcome(responseInput.value);
    radios.forEach((radio) => { radio.checked = radio.value === inferred; });
  });

  const showErrors = (errors) => {
    Object.values(slots).forEach(([slot, input]) => setSlot(slot, input, {}));
    const general = [];
    errors.forEach((error) => {
      const field = FIELD_OF_CODE[error.code];
      if (!field) general.push(error);
      else if (slots[field][1].getAttribute('aria-invalid') !== 'true') {
        setSlot(slots[field][0], slots[field][1], { kind: 'error', text: firstErrorMessage([error]) });
      }
    });
    if (general.length > 0) ctx.toast.show({ text: firstErrorMessage(general), tone: 'error' });
    refreshNumberIfValid(errors);
    document.querySelector('[aria-invalid="true"]')?.focus();
  };
  const refreshNumberIfValid = (errors) => {
    if (!errors.some((error) => FIELD_OF_CODE[error.code] === 'number')) refreshNumber();
  };

  const submit = async () => {
    const outcome = radios.find((radio) => radio.checked)?.value ?? 'other';
    const envName = envInput.value;
    const result = await ctx.store.apply((current) => addCardToEnvironment(current, envName, {
      cardNumber: numberInput.value, cardResponse: responseInput.value, outcome,
    }));
    if (!result.ok) return showErrors(result.errors);
    ctx.selectEnvironment(result.meta.environmentId);
    ctx.go('main');
    return ctx.toast.show({ text: t('add.card_added', { env: envName.trim() }) });
  };

  const field = (labelText, input, ...rest) => h('div', { class: 'field' },
    h('label', { class: 'field-label', for: input.id }, labelText), ...rest);
  const outcomePicker = h('fieldset', { class: 'field' },
    h('legend', { class: 'field-label' }, t('add.outcome_label')),
    h('div', { class: 'outcome-picker' }, OUTCOME_CHOICES.map((outcome, index) => [
      radios[index],
      h('label', { for: `f-outcome-${outcome}`, class: 'outcome', dataset: { outcome } }, t(`outcome.${outcome}`)),
    ])));

  const content = h('div', { onKeydown: (event) => { if (event.key === 'Enter' && event.target.matches('input:not([type=radio])')) { event.preventDefault(); submit(); } } },
    h('datalist', { id: 'env-names' }, ctx.store.getState().map((env) => h('option', { value: env.environment }))),
    field(t('add.environment_label'), envInput, envInput, h('p', { class: 'field-help' }, t('add.environment_help')), envSlot),
    field(t('add.number_label'), numberInput, h('div', { class: 'input-with-badge' }, numberInput, badge), numberSlot),
    field(t('add.response_label'), responseInput, responseInput, responseSlot),
    outcomePicker);
  const actions = h('div', { class: 'actions' },
    h('button', { class: 'btn btn-secondary', type: 'button', onClick: () => ctx.go('main') }, t('common.cancel')),
    h('button', { class: 'btn btn-primary', type: 'button', onClick: submit }, t('add.submit_card')));
  return { content, actions, focusTarget: numberInput };
}
