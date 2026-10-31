import { test, expect, readStorage } from './fixtures.js';

// Exact v2.x shape (git show HEAD:popup.js): array of environments with display props.
const LEGACY = [
  { environment: 'default', color: '#6b7280', cards: [
    { cardNumber: '5451951574925480', cardLogo: 'default-logo.png', cardNumberDisplay: '5451 9515 7492 5480', cardResponse: 'Transacción aprobada' },
  ] },
  { environment: 'Staging', color: '#0ea5e9', cards: [
    { cardNumber: '4242424242424242', cardLogo: 'default-logo.png', cardNumberDisplay: '4242 4242 4242 4242', cardResponse: 'Pago aprobado' },
    { cardNumber: '4000000000009995', cardLogo: 'default-logo.png', cardNumberDisplay: '4000 0000 0000 9995', cardResponse: 'Fondos insuficientes' },
  ] },
];

test('legacy v2 localStorage data is migrated to chrome.storage.local v3', async ({ page }) => {
  await page.evaluate(async (legacy) => {
    localStorage.setItem('creditCardEnvironments', JSON.stringify(legacy));
    await chrome.storage.local.clear();
  }, LEGACY);
  await page.reload();

  await expect(page.getByRole('tab')).toHaveCount(2);
  await expect(page.getByRole('tab', { name: 'default' })).toBeVisible();
  await page.getByRole('tab', { name: 'Staging' }).click();
  await expect(page.locator('.card-row')).toHaveCount(2);
  await expect(page.locator('.card-row').first()).toContainText('4242 4242 4242 4242');
  await expect(page.locator('.card-row').first()).toContainText('Pago aprobado');

  const stored = await readStorage(page);
  expect(stored.schemaVersion).toBe(3);
  expect(stored.environments.map((e) => e.environment)).toEqual(['default', 'Staging']);
  expect(stored.environments[1].cards.map((c) => c.cardNumber)).toEqual(['4242424242424242', '4000000000009995']);

  // Rollback safety: the legacy key is never deleted or rewritten.
  const raw = await page.evaluate(() => localStorage.getItem('creditCardEnvironments'));
  expect(JSON.parse(raw)).toEqual(LEGACY);
});
