/**
 * Environment public API (facade over model, import/export, operations, merge).
 * Implementation is split across files to keep each one small and focused.
 */
export {
  COLOR_KEYS,
  ENVIRONMENT_LIMITS,
  colorKeyFor,
  createEnvironment,
} from './environment-model.js';
export {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  parseImportPayload,
  restoreState,
  serializeBackup,
} from './environment-import.js';
export {
  addCardToEnvironment,
  updateCard,
  removeCard,
  renameEnvironment,
  removeEnvironment,
  replaceCards,
} from './environment-operations.js';
export { MERGE_STRATEGIES, createEnvironmentFromPreset, mergeEnvironments } from './environment-merge.js';
