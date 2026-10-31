import { describe, expect, it, vi } from 'vitest';
import { removeCard, removeEnvironment, createDefaultEnvironments } from '../../src/domain/index.js';
import { createStore } from '../../src/application/store.js';
import { createEngagement } from '../../src/application/engagement.js';
import { createPreferences } from '../../src/infrastructure/preferences.js';

const fakeArea = () => {
  const data = {};
  return {
    data,
    get: async (keys) => Object.fromEntries(keys.filter((k) => k in data).map((k) => [k, data[k]])),
    set: async (obj) => Object.assign(data, obj),
  };
};

describe('engagement sanitizing', () => {
  it('replaces off-type stored fields with defaults', async () => {
    const area = fakeArea();
    area.data.engagement = { firstSeenAt: -5, copyCount: 'x', promptState: 'hax', dismissCount: Infinity, dismissedAt: 7 };
    const engagement = await createEngagement({ preferences: createPreferences(area), now: () => 1000 });
    expect(engagement.get()).toMatchObject({ firstSeenAt: 1000, copyCount: 0, promptState: 'none', dismissCount: 0, dismissedAt: 7 });
  });
  it('tolerates a non-object value', async () => {
    const area = fakeArea();
    area.data.engagement = 'junk';
    const engagement = await createEngagement({ preferences: createPreferences(area), now: () => 1 });
    expect(engagement.get().copyCount).toBe(0);
  });
});

describe('store', () => {
  it('persists after a successful operation and notifies', async () => {
    const initial = createDefaultEnvironments();
    const repository = { save: vi.fn().mockResolvedValue(undefined) };
    const store = createStore({ repository, initialState: initial });
    const listener = vi.fn();
    store.subscribe(listener);
    const env = initial[0];
    const result = await store.apply((s) => removeCard(s, env.id, env.cards[0].id));
    expect(result.ok).toBe(true);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState()[0].cards).toHaveLength(2);
  });

  it('does not persist or notify when the operation fails', async () => {
    const repository = { save: vi.fn() };
    const store = createStore({ repository, initialState: createDefaultEnvironments() });
    const result = await store.apply((s) => removeEnvironment(s, 'missing'));
    expect(result).toEqual({ ok: false, errors: [{ code: 'environment.not_found' }] });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('keeps previous state when saving fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const repository = { save: vi.fn().mockRejectedValue(new Error('quota')) };
    const initial = createDefaultEnvironments();
    const store = createStore({ repository, initialState: initial });
    const result = await store.apply((s) => removeEnvironment(s, s[0].id));
    expect(result.errors[0].code).toBe('storage.write_failed');
    expect(store.getState()).toBe(initial);
  });

  it('undoes only the latest operation', async () => {
    const repository = { save: vi.fn().mockResolvedValue(undefined) };
    const initial = createDefaultEnvironments();
    const store = createStore({ repository, initialState: initial });
    const removed = await store.apply((s) => removeEnvironment(s, s[0].id));
    expect(store.getState()).toHaveLength(0);
    expect((await store.undo(removed.version + 5)).ok).toBe(false);
    expect((await store.undo(removed.version)).ok).toBe(true);
    expect(store.getState()).toBe(initial);
    expect((await store.undo(removed.version)).ok).toBe(false);
  });
});

describe('engagement', () => {
  it('records first seen once and counts copies', async () => {
    const area = fakeArea();
    const preferences = createPreferences(area);
    const first = await createEngagement({ preferences, now: () => 1000 });
    await first.recordCopy();
    await first.recordCopy();
    const second = await createEngagement({ preferences, now: () => 9000 });
    expect(second.get()).toMatchObject({ firstSeenAt: 1000, copyCount: 2 });
  });

  it('tracks dismissals and rating', async () => {
    const engagement = await createEngagement({ preferences: createPreferences(fakeArea()), now: () => 5000 });
    await engagement.dismiss();
    expect(engagement.get()).toMatchObject({ promptState: 'dismissed', dismissedAt: 5000, dismissCount: 1 });
    await engagement.markRated();
    expect(engagement.get().promptState).toBe('rated');
  });
});
