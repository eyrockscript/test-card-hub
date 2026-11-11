/**
 * Shared helpers for tool registration: MCP response shapes and common schemas.
 */
import { z } from 'zod';

export const READ_ONLY = Object.freeze({ readOnlyHint: true, openWorldHint: false });

export const langSchema = z.enum(['en', 'es']).optional()
  .describe('Language for descriptions, notes and hints. Default "en".');

/** @param {unknown} value */
export const json = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });

/** @param {string} message */
export const failure = (message) => ({ isError: true, content: [{ type: 'text', text: message }] });

/** Card numbers saved in the user's environments (from the configured backup). */
export async function loadEnvironmentNumbers(loadEnvironments) {
  const backup = await loadEnvironments();
  return new Set(backup.environments.flatMap((env) => env.cards.map((c) => c.cardNumber)));
}
