import { test, expect, readStorage } from './fixtures.js';
import { readFileSync } from 'node:fs';

const BACKUP = {
  format: 'test-card-hub',
  version: 3,
  exportedAt: '2026-10-01T00:00:00.000Z',
  environments: [{ environment: 'Restored', cards: [{ cardNumber: '4000000000000002', cardResponse: 'Card declined', outcome: 'declined' }] }],
};

async function openManage(page) {
  await page.getByRole('button', { name: 'Manage environments' }).click();
}

test('export backup downloads parseable JSON with the environments', async ({ page }) => {
  await openManage(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export backup' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^test-card-hub-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const parsed = JSON.parse(readFileSync(await download.path(), 'utf8'));
  expect(parsed.format).toBe('test-card-hub');
  expect(parsed.version).toBe(3);
  expect(parsed.environments[0].environment).toBe('default');
  expect(parsed.environments[0].cards).toHaveLength(3);
  await expect(page.locator('#toast')).toContainText('Backup exported');
});

test('import backup through the file input merges environments', async ({ page }) => {
  await openManage(page);
  await page.locator('input[type=file]').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(BACKUP)) });
  await expect(page.getByLabel('Environment name')).toHaveCount(2);
  await expect(page.locator('#toast')).toContainText('1 card added');
  expect((await readStorage(page)).environments.map((e) => e.environment)).toEqual(['default', 'Restored']);
});

test('import rejects an invalid file and a file over 1 MB', async ({ page }) => {
  await openManage(page);
  const input = page.locator('input[type=file]');
  await input.setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('not json') });
  await expect(page.locator('#toast')).toContainText('Nothing was imported.');
  await input.setInputFiles({ name: 'big.json', mimeType: 'application/json', buffer: Buffer.alloc(1_000_001, 0x20) });
  await expect(page.locator('#toast')).toContainText('too large');
  expect((await readStorage(page)).environments).toHaveLength(1);
});

test('JSON tab "Load file" fills the textarea (tab mode uses the input directly)', async ({ page }) => {
  await page.getByRole('button', { name: 'Add cards', exact: true }).click();
  await page.getByRole('tab', { name: 'JSON' }).click();
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Load file' }).click()]);
  await chooser.setFiles({ name: 'pack.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(BACKUP.environments)) });
  await expect(page.locator('#j-text')).toHaveValue(/Restored/);
});

test('inside the toolbar popup, file actions open a regular tab instead of the native chooser', async ({ context, openPopup, extensionId }) => {
  const popup = await openPopup('?surface=popup');
  await popup.getByRole('button', { name: 'Add cards', exact: true }).click();
  await popup.getByRole('tab', { name: 'JSON' }).click();
  let chooserOpened = false;
  popup.on('filechooser', () => { chooserOpened = true; });
  const [tab] = await Promise.all([context.waitForEvent('page'), popup.getByRole('button', { name: 'Load file' }).click()]);
  await tab.waitForLoadState();
  expect(tab.url()).toBe(`chrome-extension://${extensionId}/popup.html?view=import&target=json`);
  expect(chooserOpened).toBe(false);
  await expect(tab.locator('html')).toHaveAttribute('data-surface', 'tab');
  await expect(tab.locator('#j-text')).toBeVisible();

  await tab.setViewportSize({ width: 1000, height: 700 });
  const box = await tab.locator('#app').boundingBox();
  expect(box.width).toBe(380);
  expect(Math.abs(box.x + box.width / 2 - 500)).toBeLessThan(2);

  const [chooser] = await Promise.all([tab.waitForEvent('filechooser'), tab.getByRole('button', { name: 'Load file' }).click()]);
  await chooser.setFiles({ name: 'pack.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(BACKUP.environments)) });
  await expect(tab.locator('#j-text')).toHaveValue(/Restored/);
  await tab.close();

  await popup.getByRole('button', { name: 'Back', exact: true }).click();
  await popup.getByRole('button', { name: 'Manage environments' }).click();
  const [backupTab] = await Promise.all([context.waitForEvent('page'), popup.getByRole('button', { name: 'Import backup' }).click()]);
  await backupTab.waitForLoadState();
  expect(backupTab.url()).toContain('view=import&target=backup');
  await expect(backupTab.getByRole('heading', { name: 'Environments' })).toBeVisible();
  await backupTab.close();
});
