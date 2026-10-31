import { test, expect, readStorage } from './fixtures.js';

test('fresh install shows the default environment with English responses', async ({ page }) => {
  await expect(page.getByRole('tab', { name: 'default' })).toHaveAttribute('aria-selected', 'true');
  const rows = page.locator('.card-row');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('Approved transaction');
  await expect(rows.nth(1)).toContainText('Invalid card');
  await expect(rows.nth(2)).toContainText('Insufficient funds');
  const stored = await readStorage(page);
  expect(stored.schemaVersion).toBe(3);
  expect(stored.environments).toHaveLength(1);
});
