import { describe, it, expect } from 'vitest';
import { createEnvironmentFromPreset, restoreState } from '../../src/domain/environment.js';

const MP = '5031755734530604';
const preset = {
  id: 'mercadopago-mx',
  name: 'Mercado Pago',
  cards: [
    { cardNumber: MP, cardResponse: 'Pago aprobado', cardResponseEn: 'Approved', outcome: 'approved', note: 'Titular: APRO' },
    { cardNumber: MP, cardResponse: 'Rechazado', outcome: 'declined', note: 'Titular: OTHE' },
  ],
};

const stateWith = (names) =>
  restoreState(names.map((environment, i) => ({ id: `e${i}`, environment, colorKey: 'slate', cards: [] }))).value;

describe('createEnvironmentFromPreset', () => {
  it('builds an environment with preset cards, notes and next color key', () => {
    const result = createEnvironmentFromPreset(preset, stateWith(['default']));
    expect(result.ok).toBe(true);
    expect(result.value).toMatchObject({ environment: 'Mercado Pago', colorKey: 'teal' });
    expect(result.value.id).toEqual(expect.any(String));
    expect(result.value.cards.map(({ cardNumber, cardResponse, outcome, note }) => ({ cardNumber, cardResponse, outcome, note })))
      .toEqual([
        { cardNumber: MP, cardResponse: 'Pago aprobado', outcome: 'approved', note: 'Titular: APRO' },
        { cardNumber: MP, cardResponse: 'Rechazado', outcome: 'declined', note: 'Titular: OTHE' },
      ]);
    expect('cardResponseEn' in result.value.cards[0]).toBe(false);
  });

  it('uses the rename strategy on name conflicts', () => {
    const result = createEnvironmentFromPreset(preset, stateWith(['mercado pago', 'Mercado Pago (2)']));
    expect(result.value.environment).toBe('Mercado Pago (3)');
  });

  it('defaults existing state to empty', () => {
    expect(createEnvironmentFromPreset(preset).value.colorKey).toBe('slate');
  });

  it('rejects invalid presets and invalid cards with indexes', () => {
    expect(createEnvironmentFromPreset(null, [])).toEqual({ ok: false, errors: [{ code: 'preset.invalid_input' }] });
    expect(createEnvironmentFromPreset({ name: 'x', cards: 'no' }, []).errors).toEqual([{ code: 'environment.cards_type' }]);
    const bad = createEnvironmentFromPreset({ name: 'x', cards: [{ cardNumber: '1', cardResponse: 'x' }] }, []);
    expect(bad).toEqual({ ok: false, errors: [{ code: 'card.number_length', card: 0 }] });
    expect(createEnvironmentFromPreset({ name: 'x', cards: ['junk'] }, []).errors).toEqual([{ code: 'card.invalid_input', card: 0 }]);
    expect(createEnvironmentFromPreset({ name: 7, cards: [] }, []).errors).toEqual([{ code: 'environment.name_type' }]);
  });

  it('rejects when the state is full', () => {
    const full = stateWith(Array.from({ length: 50 }, (_, i) => `env ${i}`));
    expect(createEnvironmentFromPreset(preset, full).errors).toEqual([{ code: 'state.environments_limit' }]);
  });
});
