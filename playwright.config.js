import { defineConfig } from '@playwright/test';

// One worker: every test launches its own persistent Chromium with the unpacked extension.
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  reporter: [['list']],
  use: { trace: 'retain-on-failure' },
});
