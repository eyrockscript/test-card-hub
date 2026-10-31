import { describe, it, expect } from 'vitest';
import * as domain from '../../src/domain/index.js';

describe('domain public API', () => {
  it('exposes every public function and constant', () => {
    const expected = [
      'CARD_LIMITS', 'OUTCOMES', 'cardIdentityKey', 'createCard', 'detectBrand', 'formatCardNumber',
      'inferOutcome', 'isKnownTestNumber', 'isLuhnValid', 'normalizeCardNumber',
      'COLOR_KEYS', 'ENVIRONMENT_LIMITS', 'colorKeyFor', 'createEnvironment',
      'BACKUP_FORMAT', 'BACKUP_VERSION', 'parseImportPayload', 'restoreState', 'serializeBackup',
      'addCardToEnvironment', 'updateCard', 'removeCard', 'renameEnvironment', 'removeEnvironment',
      'replaceCards', 'MERGE_STRATEGIES', 'mergeEnvironments', 'createEnvironmentFromPreset',
      'createDefaultEnvironments',
    ];
    expect(Object.keys(domain).sort()).toEqual([...expected].sort());
  });
});
