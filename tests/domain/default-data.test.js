import { describe, it, expect } from 'vitest';
import { createDefaultEnvironments } from '../../src/domain/default-data.js';
import { restoreState } from '../../src/domain/environment.js';

describe('createDefaultEnvironments', () => {
  it('returns the legacy "default" environment with its 3 cards and outcomes', () => {
    const state = createDefaultEnvironments();
    expect(state).toHaveLength(1);
    expect(state[0]).toMatchObject({ environment: 'default', colorKey: 'slate' });
    expect(state[0].cards.map(({ cardNumber, cardResponse, outcome }) => [cardNumber, cardResponse, outcome])).toEqual([
      ['5451951574925480', 'Transacción aprobada', 'approved'],
      ['4574441215190335', 'Tarjeta no válida', 'declined'],
      ['4349003000047015', 'Tarjeta sin fondos', 'insufficient'],
    ]);
  });
  it('returns English responses when the language is en', () => {
    const responses = createDefaultEnvironments('en')[0].cards.map((c) => c.cardResponse);
    expect(responses).toEqual(['Approved transaction', 'Invalid card', 'Insufficient funds']);
  });
  it('falls back to Spanish for unknown languages', () => {
    expect(createDefaultEnvironments('fr')[0].cards[0].cardResponse).toBe('Transacción aprobada');
  });
  it('is valid state and produces fresh ids per call', () => {
    const a = createDefaultEnvironments();
    expect(restoreState(a).ok).toBe(true);
    expect(createDefaultEnvironments()[0].id).not.toBe(a[0].id);
  });
});
