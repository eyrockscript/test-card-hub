import { describe, it, expect, vi } from 'vitest';
import { createStorageRepository, SCHEMA_VERSION } from '../../src/infrastructure/storage-repository.js';
import { addCardToEnvironment } from '../../src/domain/environment.js';

const LEGACY_KEY = 'creditCardEnvironments';

/** In-memory fake of chrome.storage.local (Promise API, structured copy). */
function createFakeArea(initial = {}, { failSet = false, failGet = false } = {}) {
  const data = { ...structuredClone(initial) };
  const setCalls = [];
  return {
    data,
    setCalls,
    async get(keys) {
      if (failGet) throw new Error('get failed');
      const list = Array.isArray(keys) ? keys : [keys];
      return Object.fromEntries(list.filter((k) => k in data).map((k) => [k, structuredClone(data[k])]));
    },
    async set(obj) {
      setCalls.push(structuredClone(obj));
      if (failSet) throw new Error('QUOTA_BYTES exceeded');
      Object.assign(data, structuredClone(obj));
    },
  };
}

function createFakeLocalStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: vi.fn((k) => (data.has(k) ? data.get(k) : null)),
    removeItem: vi.fn(),
    setItem: vi.fn(),
  };
}

const quietLogger = () => ({ warn: vi.fn(), error: vi.fn() });

// Exact shape written by the legacy popup.js (v2.x).
const LEGACY_DATA = [
  {
    environment: 'default',
    color: 'hsl(210, 48.2%, 14.1%)',
    cards: [
      { cardNumber: '5451951574925480', cardLogo: 'default-logo.png', cardNumberDisplay: '5451 9515 7492 5480', cardResponse: 'Transacción aprobada' },
      { cardNumber: '4574441215190335', cardLogo: 'default-logo.png', cardNumberDisplay: '4574 4412 1519 0335', cardResponse: 'Tarjeta no válida' },
    ],
  },
  {
    environment: 'Stripe',
    color: 'hsl(12, 55%, 18%)',
    cards: [{ cardNumber: '4000000000009995', cardLogo: 'default-logo.png', cardNumberDisplay: '4000 0000 0000 9995', cardResponse: 'Insufficient funds' }],
    cardLogo: 'default-logo.png',
  },
];

function setup({ area = {}, areaOptions, legacy } = {}) {
  const fakeArea = createFakeArea(area, areaOptions);
  const fakeLegacy = createFakeLocalStorage(legacy === undefined ? {} : { [LEGACY_KEY]: legacy });
  const logger = quietLogger();
  const repo = createStorageRepository({ area: fakeArea, legacyStorage: fakeLegacy, logger });
  return { repo, fakeArea, fakeLegacy, logger };
}

describe('createStorageRepository', () => {
  it('validates its dependencies', () => {
    expect(() => createStorageRepository({ legacyStorage: createFakeLocalStorage() })).toThrow('storage.invalid_area');
    expect(() => createStorageRepository({ area: createFakeArea() })).toThrow('storage.invalid_legacy_storage');
  });

  it('fresh install honors defaultLanguage en', async () => {
    const repo = createStorageRepository({ area: createFakeArea(), legacyStorage: createFakeLocalStorage(), logger: quietLogger(), defaultLanguage: 'en' });
    const state = await repo.load();
    expect(state[0].cards[0].cardResponse).toBe('Approved transaction');
  });

  it('fresh install: writes defaults once with schemaVersion 3', async () => {
    const { repo, fakeArea } = setup();
    const state = await repo.load();
    expect(state[0].environment).toBe('default');
    expect(state[0].cards).toHaveLength(3);
    expect(fakeArea.setCalls).toHaveLength(1);
    expect(fakeArea.setCalls[0]).toEqual({ schemaVersion: SCHEMA_VERSION, environments: structuredClone(state) });
    expect(SCHEMA_VERSION).toBe(3);
  });

  it('migrates the real legacy shape in ONE set() and never deletes the legacy key', async () => {
    const { repo, fakeArea, fakeLegacy } = setup({ legacy: JSON.stringify(LEGACY_DATA) });
    const state = await repo.load();
    expect(state.map((e) => [e.environment, e.colorKey, e.cards.length])).toEqual([['default', 'slate', 2], ['Stripe', 'teal', 1]]);
    expect(state[0].cards[0]).toEqual({ id: expect.any(String), cardNumber: '5451951574925480', cardResponse: 'Transacción aprobada', outcome: 'approved' });
    expect(state[1].cards[0].outcome).toBe('insufficient');
    expect(fakeArea.setCalls).toHaveLength(1);
    expect(Object.keys(fakeArea.setCalls[0]).sort()).toEqual(['environments', 'schemaVersion']);
    expect(fakeLegacy.removeItem).not.toHaveBeenCalled();
    expect(fakeLegacy.setItem).not.toHaveBeenCalled();
    expect(fakeLegacy.data.get(LEGACY_KEY)).toBe(JSON.stringify(LEGACY_DATA));
  });

  it('partially invalid legacy data: drops bad cards, migrates the rest, logs', async () => {
    const legacy = [
      { environment: 'qa', color: 'x', cards: [
        { cardNumber: '4242424242424242', cardNumberDisplay: '4242 4242 4242 4242', cardResponse: 'ok' },
        { cardNumber: '12', cardNumberDisplay: '12', cardResponse: 'too short' },
        { cardNumber: '4111111111111111', cardResponse: '' },
      ] },
      { environment: '', color: 'x', cards: [] },
    ];
    const { repo, logger } = setup({ legacy: JSON.stringify(legacy) });
    const state = await repo.load();
    expect(state).toHaveLength(1);
    expect(state[0].cards.map((c) => c.cardNumber)).toEqual(['4242424242424242']);
    expect(logger.warn).toHaveBeenCalled();
  });

  it.each([
    ['corrupt legacy JSON', '{not json'],
    ['a legacy non-array value', '"hello"'],
    ['legacy data with no usable environment', JSON.stringify([{ environment: '', cards: [] }])],
  ])('falls back to defaults on %s', async (_label, legacy) => {
    const { repo, fakeArea } = setup({ legacy });
    const state = await repo.load();
    expect(state[0].environment).toBe('default');
    expect(fakeArea.setCalls).toHaveLength(1);
  });

  it('keeps an intentionally empty legacy array (user deleted everything)', async () => {
    const { repo, fakeArea } = setup({ legacy: '[]' });
    expect(await repo.load()).toEqual([]);
    expect(fakeArea.setCalls[0]).toEqual({ schemaVersion: 3, environments: [] });
  });

  it('falls back to defaults when localStorage throws', async () => {
    const fakeArea = createFakeArea();
    const legacyStorage = { getItem: () => { throw new Error('denied'); } };
    const logger = quietLogger();
    const state = await createStorageRepository({ area: fakeArea, legacyStorage, logger }).load();
    expect(state[0].environment).toBe('default');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('already migrated: returns stored state with ids, without writing or reading legacy', async () => {
    const { repo: seed, fakeArea: seeded } = setup({ legacy: JSON.stringify(LEGACY_DATA) });
    const migrated = await seed.load();
    const { repo, fakeArea, fakeLegacy } = setup({ area: seeded.data, legacy: '[]' });
    const state = await repo.load();
    expect(state).toEqual(migrated);
    expect(fakeArea.setCalls).toHaveLength(0);
    expect(fakeLegacy.getItem).not.toHaveBeenCalled();
  });

  it('corrupt v3 data: keeps a copy under corruptBackup and recovers from legacy', async () => {
    const corrupt = [{ id: 'e1', environment: '', colorKey: 'slate', cards: 'oops' }];
    const { repo, fakeArea, logger } = setup({ area: { schemaVersion: 3, environments: corrupt }, legacy: JSON.stringify(LEGACY_DATA) });
    const state = await repo.load();
    expect(state.map((e) => e.environment)).toEqual(['default', 'Stripe']);
    expect(fakeArea.setCalls).toHaveLength(1);
    expect(fakeArea.setCalls[0].corruptBackup).toEqual({ schemaVersion: 3, environments: corrupt });
    expect(fakeArea.setCalls[0].schemaVersion).toBe(3);
    expect(logger.error).toHaveBeenCalled();
  });

  it('partly invalid v3 data keeps the valid part and the backup', async () => {
    const stored = [
      { id: 'ok', environment: 'Keep', colorKey: 'teal', cards: [{ id: 'c', cardNumber: '4242424242424242', cardResponse: 'ok' }] },
      { id: 'bad', environment: '', colorKey: 'slate', cards: 'oops' },
    ];
    const { repo, fakeArea } = setup({ area: { schemaVersion: 3, environments: stored }, legacy: JSON.stringify(LEGACY_DATA) });
    const state = await repo.load();
    expect(state.map((e) => e.environment)).toEqual(['Keep']);
    expect(fakeArea.data.corruptBackup.environments).toEqual(stored);
  });

  it('never overwrites an existing corruptBackup', async () => {
    const { repo, fakeArea } = setup({ area: { schemaVersion: 3, environments: 'garbage', corruptBackup: 'older' } });
    await repo.load();
    expect(fakeArea.data.corruptBackup).toBe('older');
  });

  it('corrupt v3 data without legacy recovers defaults and still keeps the backup', async () => {
    const { repo, fakeArea } = setup({ area: { schemaVersion: 3, environments: 'garbage' } });
    const state = await repo.load();
    expect(state[0].environment).toBe('default');
    expect(fakeArea.data.corruptBackup).toEqual({ schemaVersion: 3, environments: 'garbage' });
  });

  it('write failure during migration still resolves with migrated data and logs', async () => {
    const { repo, logger } = setup({ legacy: JSON.stringify(LEGACY_DATA), areaOptions: { failSet: true } });
    const state = await repo.load();
    expect(state.map((e) => e.environment)).toEqual(['default', 'Stripe']);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('migration write failed'), expect.any(Error));
  });

  it('read failure: uses legacy/defaults without writing (avoids clobbering unread data)', async () => {
    const { repo, fakeArea, logger } = setup({ legacy: JSON.stringify(LEGACY_DATA), areaOptions: { failGet: true } });
    const state = await repo.load();
    expect(state.map((e) => e.environment)).toEqual(['default', 'Stripe']);
    expect(fakeArea.setCalls).toHaveLength(0);
    expect(logger.error).toHaveBeenCalled();
  });

  it('ignores stored data with another schemaVersion and migrates from legacy', async () => {
    const { repo, fakeArea } = setup({ area: { schemaVersion: 2, environments: [] }, legacy: JSON.stringify(LEGACY_DATA) });
    expect((await repo.load())).toHaveLength(2);
    expect(fakeArea.setCalls).toHaveLength(1);
  });

  it('save: persists valid state in one set() and round-trips through load', async () => {
    const { repo, fakeArea } = setup();
    const state = await repo.load();
    const next = addCardToEnvironment(state, 'default', { cardNumber: '378282246310005', cardResponse: 'Pendiente', note: 'n' }).value;
    await repo.save(next);
    expect(fakeArea.setCalls.at(-1)).toEqual({ schemaVersion: 3, environments: structuredClone(next) });
    const reloaded = await createStorageRepository({ area: fakeArea, legacyStorage: createFakeLocalStorage(), logger: quietLogger() }).load();
    expect(reloaded).toEqual(next);
  });

  it('save: rejects invalid state without writing', async () => {
    const { repo, fakeArea } = setup();
    await expect(repo.save([{ id: 'x', environment: '', colorKey: 'slate', cards: [] }])).rejects.toMatchObject({ code: 'storage.invalid_state' });
    await expect(repo.save('nope')).rejects.toMatchObject({ code: 'storage.invalid_state' });
    expect(fakeArea.setCalls).toHaveLength(0);
  });

  it('save: propagates write errors to the caller', async () => {
    const { repo } = setup({ areaOptions: { failSet: true } });
    await expect(repo.save([])).rejects.toThrow('QUOTA_BYTES exceeded');
  });

  it('uses console as the default logger', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const repo = createStorageRepository({ area: createFakeArea(), legacyStorage: createFakeLocalStorage({ [LEGACY_KEY]: '{bad' }) });
    await repo.load();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('supports a custom legacy key', async () => {
    const legacyStorage = createFakeLocalStorage({ other: JSON.stringify(LEGACY_DATA) });
    const repo = createStorageRepository({ area: createFakeArea(), legacyStorage, legacyKey: 'other', logger: quietLogger() });
    expect(await repo.load()).toHaveLength(2);
  });
});
