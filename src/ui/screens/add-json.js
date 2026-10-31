/**
 * "JSON" tab of the Add screen: paste or load a file, validate, merge.
 */
import { parseImportPayload } from '../../domain/index.js';
import { h, icon } from '../dom.js';
import { t, tn } from '../i18n.js';
import { describeErrors } from '../components/errors.js';
import { createFileTrigger, mergeParsed } from '../components/import-flow.js';
import { countCards } from '../view-model.js';

function exampleJson() {
  return JSON.stringify([{
    environment: 'example',
    cards: [{ cardNumber: '4242424242424242', cardResponse: t('json.example_response'), outcome: 'approved' }],
  }], null, 2);
}

function errorList(errors) {
  return errors.map((message) => h('p', { class: 'field-error' }, icon('warning', 'icon-sm'), message));
}

/** @returns {{ content: HTMLElement, actions: HTMLElement|null }} */
export function buildJsonImport(ctx) {
  const textarea = h('textarea', { id: 'j-text', class: 'textarea', rows: '9', spellcheck: 'false', 'aria-label': t('json.label') }, exampleJson());
  const feedback = h('div', { role: 'alert' });

  const showText = (text) => {
    textarea.value = text;
    feedback.replaceChildren();
  };
  const trigger = createFileTrigger({
    ctx,
    importTarget: 'json',
    accept: '.json,application/json',
    onText: showText,
    onError: (error) => ctx.toast.show({ text: t(error?.code === 'file.too_large' ? 'json.file_too_large' : 'json.file_read_failed'), tone: 'error' }),
  });

  const importValid = (environments) => async () => {
    if (await mergeParsed(ctx, environments)) ctx.go('main');
  };

  const showFailure = (parsed) => {
    const nodes = errorList(describeErrors(parsed.errors));
    const validCount = countCards(parsed.value);
    if (parsed.value.length > 0 && validCount > 0) {
      nodes.push(h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onClick: importValid(parsed.value) },
        tn('json.import_valid', validCount)));
    }
    feedback.replaceChildren(...nodes);
  };

  const submit = async () => {
    const parsed = parseImportPayload(textarea.value);
    if (!parsed.ok) return showFailure(parsed);
    return importValid(parsed.value)();
  };

  const content = h('div', { class: 'field' },
    h('label', { class: 'field-label', for: 'j-text' }, t('json.label')),
    textarea,
    h('p', { class: 'field-help' }, t('json.help')),
    feedback,
    trigger.input);
  const actions = h('div', { class: 'actions' },
    h('button', { class: 'btn btn-secondary', type: 'button', onClick: trigger.open }, icon('upload-simple', 'icon-sm'), t('json.load_file')),
    h('button', { class: 'btn btn-primary', type: 'button', onClick: submit }, t('json.import')));
  return { content, actions, focusTarget: textarea };
}
