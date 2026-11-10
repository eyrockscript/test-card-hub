import { describe, expect, it } from 'vitest';
import { validateCard } from '../src/application/validate-card.js';

const sets = {
  knownNumbers: new Set(['4242424242424242']),
  environmentNumbers: new Set(['5555555555554444']),
};

describe('validateCard', () => {
  it('accepts a known test number, ignoring spaces', () => {
    expect(validateCard('4242 4242 4242 4242', sets)).toMatchObject({
      verdict: 'known_test_number', brand: 'visa', luhnValid: true, knownTestNumber: true, formatted: '4242 4242 4242 4242',
    });
  });

  it('flags a Luhn-valid unknown number as a possible real card', () => {
    const result = validateCard('4912345678901230', sets);
    expect(result.verdict).toBe('possibly_real_card');
    expect(result.message).toMatch(/Do not use it/);
  });

  it('allows numbers saved in a user environment', () => {
    expect(validateCard('5555-5555-5555-4444', sets)).toMatchObject({ verdict: 'user_environment_number', inUserEnvironment: true });
  });

  it('marks bad Luhn or bad length as invalid', () => {
    expect(validateCard('4242424242424241', sets).verdict).toBe('invalid_number');
    expect(validateCard('42', sets)).toMatchObject({ verdict: 'invalid_number', lengthValid: false });
  });
});
