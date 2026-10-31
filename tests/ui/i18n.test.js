import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '../../src/i18n/en.js';
import { es } from '../../src/i18n/es.js';
import { resolveLanguage, translate } from '../../src/ui/i18n.js';

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const full = join(dir, name);
  return statSync(full).isDirectory() ? walk(full) : [full];
});
const sourceOf = (dir) => walk(dir).filter((f) => f.endsWith('.js')).map((f) => readFileSync(f, 'utf8')).join('\n');

describe('i18n dictionaries', () => {
  it('have exactly the same keys in es and en', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  });

  it('have no empty values and no em dashes', () => {
    for (const dictionary of [es, en]) {
      for (const [key, value] of Object.entries(dictionary)) {
        expect(value.trim(), key).not.toBe('');
        expect(value, key).not.toContain('—');
      }
    }
  });

  it('use the same placeholders in both languages', () => {
    const placeholders = (text) => (text.match(/\{\w+\}/g) ?? []).sort().join(',');
    for (const key of Object.keys(es)) expect(placeholders(en[key]), key).toBe(placeholders(es[key]));
  });

  it('define a message for every domain error code', () => {
    const domainSource = `${sourceOf('src/domain')}\n${readFileSync('src/infrastructure/storage-repository.js', 'utf8')}`;
    const codes = new Set(domainSource.match(/'(?:card|environment|state|import|merge|preset|storage)\.[a-z_]+'/g)
      .map((match) => match.slice(1, -1)));
    expect(codes.size).toBeGreaterThan(20);
    for (const code of codes) {
      expect(es[`error.${code}`], `es error.${code}`).toBeTruthy();
      expect(en[`error.${code}`], `en error.${code}`).toBeTruthy();
    }
  });

  it('define every key referenced from UI source', () => {
    const source = sourceOf('src/ui');
    const direct = [...source.matchAll(/\bt\(\s*'([\w.]+)'/g)].map((m) => m[1]);
    const labelled = [...source.matchAll(/'((?:main|footer|add|json|gateways|manage|empty|rating|common|import)\.[a-z_]+)'/g)].map((m) => m[1]);
    for (const key of new Set([...direct, ...labelled])) {
      const keys = [key, `${key}_one`, `${key}_other`, `error.${key}`];
      expect(keys.some((candidate) => candidate in es), key).toBe(true);
    }
  });

  it('keeps preset notes translated', async () => {
    const { GATEWAY_PRESETS } = await import('../../src/data/gateway-presets.js');
    for (const preset of GATEWAY_PRESETS) {
      for (const card of preset.cards) if (card.note) expect(card.noteEn, `${preset.id} ${card.cardNumber}`).toBeTruthy();
    }
  });
});

describe('translate and resolveLanguage', () => {
  it('replaces placeholders and keeps unknown ones', () => {
    expect(translate({ a: 'Hi {name} {x}' }, 'a', { name: 'Ana' })).toBe('Hi Ana {x}');
  });

  it('returns the key for missing entries', () => {
    expect(translate({}, 'missing.key')).toBe('missing.key');
  });

  it('resolves auto from the browser language', () => {
    expect(resolveLanguage('auto', 'es-MX')).toBe('es');
    expect(resolveLanguage('auto', 'en-GB')).toBe('en');
    expect(resolveLanguage('auto', 'ja')).toBe('en');
    expect(resolveLanguage('es', 'en-US')).toBe('es');
    expect(resolveLanguage('en', 'es')).toBe('en');
  });
});
