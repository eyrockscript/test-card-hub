// End-to-end: spawns the real bin over stdio, the way Claude Code / Desktop does.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const BIN = resolve(import.meta.dirname, '..', 'bin', 'test-card-hub-mcp.js');
let dir;
let client;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tch-mcp-'));
  const backupPath = join(dir, 'backup.json');
  writeFileSync(backupPath, JSON.stringify({
    format: 'test-card-hub',
    version: 3,
    environments: [{ environment: 'QA', cards: [{ cardNumber: '4242424242424242', cardResponse: 'Approved', outcome: 'approved' }] }],
  }));
  client = new Client({ name: 'e2e', version: '1.0.0' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [BIN, '--backup', backupPath] }));
});

afterAll(async () => {
  await client?.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('stdio server', () => {
  it('reads the configured backup and answers tool calls', async () => {
    const envs = await client.callTool({ name: 'list_environments', arguments: {} });
    expect(JSON.parse(envs.content[0].text).environments[0].name).toBe('QA');
    const cards = await client.callTool({ name: 'find_test_cards', arguments: { environment: 'qa' } });
    expect(JSON.parse(cards.content[0].text).cards[0].cardNumber).toBe('4242424242424242');
  });
});
