import { describe, expect, it } from 'vitest';
import { parseBackupPath } from '../src/interfaces/cli-args.js';

describe('parseBackupPath', () => {
  it('reads --backup <path>', () => {
    expect(parseBackupPath(['--backup', 'b.json'], {})).toEqual({ ok: true, path: 'b.json' });
  });

  it('reads --backup=<path>', () => {
    expect(parseBackupPath(['--backup=b.json'], {})).toEqual({ ok: true, path: 'b.json' });
  });

  it('prefers the flag over the env var', () => {
    expect(parseBackupPath(['--backup', 'a.json'], { TEST_CARD_HUB_BACKUP: 'b.json' }).path).toBe('a.json');
  });

  it('falls back to TEST_CARD_HUB_BACKUP', () => {
    expect(parseBackupPath([], { TEST_CARD_HUB_BACKUP: 'b.json' })).toEqual({ ok: true, path: 'b.json' });
  });

  it('runs without a backup when nothing is set', () => {
    expect(parseBackupPath([], {})).toEqual({ ok: true });
  });

  it('rejects a flag without a value', () => {
    expect(parseBackupPath(['--backup'], {}).ok).toBe(false);
    expect(parseBackupPath(['--backup='], {}).ok).toBe(false);
    expect(parseBackupPath(['--backup', '--other'], {}).ok).toBe(false);
  });
});
