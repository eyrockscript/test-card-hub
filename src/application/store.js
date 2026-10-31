/**
 * Application state holder. Runs domain operations, persists after every
 * successful one, keeps one undo snapshot and notifies subscribers.
 *
 * `repository` is anything with `save(state): Promise<void>`.
 */
export function createStore({ repository, initialState }) {
  let state = initialState;
  let snapshot = null;
  let version = 0;
  const listeners = new Set();

  const notify = () => listeners.forEach((listener) => listener(state));

  async function persist(next) {
    try {
      await repository.save(next);
      return null;
    } catch (error) {
      console.error('[store] save failed', error);
      return [{ code: 'storage.write_failed' }];
    }
  }

  /**
   * @param {(state: object[]) => { ok: boolean, value?: object[], meta?: object, errors?: object[] }} operation
   * @returns {Promise<{ ok: boolean, meta?: object, errors?: object[], version?: number }>}
   */
  async function apply(operation) {
    const result = operation(state);
    if (!result.ok) return { ok: false, errors: result.errors };
    const previous = state;
    const failure = await persist(result.value);
    if (failure) return { ok: false, errors: failure };
    snapshot = previous;
    state = result.value;
    version += 1;
    notify();
    return { ok: true, meta: result.meta, version };
  }

  /** Restores the snapshot taken before the operation that produced `expectedVersion`. */
  async function undo(expectedVersion) {
    if (snapshot === null || expectedVersion !== version) return { ok: false, errors: [{ code: 'undo.expired' }] };
    const failure = await persist(snapshot);
    if (failure) return { ok: false, errors: failure };
    state = snapshot;
    snapshot = null;
    version += 1;
    notify();
    return { ok: true };
  }

  return Object.freeze({
    getState: () => state,
    apply,
    undo,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });
}
