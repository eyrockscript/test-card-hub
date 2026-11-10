#!/usr/bin/env node
/**
 * stdio entrypoint. Usage:
 *   test-card-hub-mcp [--backup <path-to-exported-json>]
 * The backup path can also come from TEST_CARD_HUB_BACKUP.
 * stdout carries the MCP protocol, so diagnostics go to stderr only.
 */
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GATEWAY_PRESETS } from '../core/data/gateway-presets.js';
import { loadBackup } from '../src/infrastructure/backup-file.js';
import { parseBackupPath } from '../src/interfaces/cli-args.js';
import { createServer } from '../src/interfaces/server.js';

const { version } = createRequire(import.meta.url)('../package.json');

const parsed = parseBackupPath(process.argv.slice(2), process.env);
if (!parsed.ok) {
  process.stderr.write(`test-card-hub-mcp: ${parsed.error}\n`);
  process.exit(1);
}
const backupPath = parsed.path ? resolve(parsed.path) : undefined;
const fileSystem = {
  readFile: (path) => readFile(path, 'utf8'),
  statSize: async (path) => (await stat(path)).size,
};

const server = createServer({
  version,
  presets: GATEWAY_PRESETS,
  now: () => new Date(),
  loadEnvironments: () => loadBackup(backupPath, fileSystem),
});

try {
  await server.connect(new StdioServerTransport());
} catch (error) {
  process.stderr.write(`test-card-hub-mcp: failed to start (${error instanceof Error ? error.message : 'unknown error'})\n`);
  process.exit(1);
}
