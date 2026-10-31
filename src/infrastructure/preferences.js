/**
 * Small key/value adapter over a chrome.storage-like area, used for UI
 * preferences and local engagement counters. Nothing leaves the device.
 */
export function createPreferences(area) {
  if (!area || typeof area.get !== 'function' || typeof area.set !== 'function') {
    throw new Error('preferences.invalid_area');
  }
  return Object.freeze({
    async get(key, fallback = undefined) {
      try {
        const stored = await area.get([key]);
        return stored[key] ?? fallback;
      } catch (error) {
        console.warn('[preferences] read failed', key, error);
        return fallback;
      }
    },
    async set(key, value) {
      try {
        await area.set({ [key]: value });
        return true;
      } catch (error) {
        console.warn('[preferences] write failed', key, error);
        return false;
      }
    },
  });
}
