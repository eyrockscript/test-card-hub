import { describe, expect, it } from 'vitest';
import { MAX_BACKUP_BYTES, loadBackup } from '../src/infrastructure/backup-file.js';

const backup = (environments) => JSON.stringify({ format: 'test-card-hub', version: 3, environments });
const fakeFs = (content, size = content.length) => ({ readFile: async () => content, statSize: async () => size });

describe('loadBackup', () => {
  it('reports not configured without a path', async () => {
    expect(await loadBackup(undefined, fakeFs(''))).toEqual({ environments: [], configured: false });
  });

  it('loads environments from an exported backup', async () => {
    const content = backup([{ environment: 'dev', cards: [{ cardNumber: '4242424242424242', cardResponse: 'OK' }] }]);
    const result = await loadBackup('/b.json', fakeFs(content));
    expect(result.configured).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.environments[0].environment).toBe('dev');
  });

  it('keeps valid environments and reports dropped ones as warnings', async () => {
    const content = backup([
      { environment: 'dev', cards: [{ cardNumber: '4242424242424242', cardResponse: 'OK' }] },
      { environment: '', cards: [] },
    ]);
    const result = await loadBackup('/b.json', fakeFs(content));
    expect(result.environments).toHaveLength(1);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('rejects oversized files without reading them', async () => {
    const result = await loadBackup('/b.json', fakeFs('{}', MAX_BACKUP_BYTES + 1));
    expect(result.error).toMatch(/larger than/);
  });

  it('reports invalid JSON as having no valid environments', async () => {
    const result = await loadBackup('/b.json', fakeFs('not json'));
    expect(result.error).toContain('import.invalid_json');
  });

  it('reports read errors by code without leaking the path', async () => {
    const fs = { statSize: async () => { throw Object.assign(new Error('/secret/path'), { code: 'ENOENT' }); }, readFile: async () => '' };
    const result = await loadBackup('/secret/path', fs);
    expect(result.error).toBe('Cannot read backup file (ENOENT).');
  });

  it('uses a generic code when the error has none', async () => {
    const fs = { statSize: async () => { throw new Error('boom'); }, readFile: async () => '' };
    expect((await loadBackup('/x', fs)).error).toBe('Cannot read backup file (read_failed).');
  });
});
