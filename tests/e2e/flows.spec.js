import { test, expect, readStorage } from './fixtures.js';

const addButton = (page) => page.getByRole('button', { name: 'Add cards', exact: true });

test('add card form creates a card, detects the brand and validates', async ({ page }) => {
  await addButton(page).click();
  const number = page.locator('#f-number');
  await number.fill('4242424242424242');
  await expect(number).toHaveValue('4242 4242 4242 4242');
  await expect(page.locator('.input-with-badge .brand-badge')).toHaveText('VISA');
  await page.getByRole('button', { name: 'Add card', exact: true }).click();
  await expect(page.locator('#f-response-msg')).toBeVisible();

  await page.locator('#f-env').fill('Checkout');
  await page.locator('#f-response').fill('Approved by sandbox');
  await page.getByRole('button', { name: 'Add card', exact: true }).click();

  await expect(page.getByRole('tab', { name: 'Checkout' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.card-row')).toHaveCount(1);
  await expect(page.locator('.card-row')).toContainText('Approved by sandbox');
  await expect(page.locator('#toast')).toContainText('Card added to “Checkout”');
  const stored = await readStorage(page);
  expect(stored.environments.find((e) => e.environment === 'Checkout').cards[0].cardNumber).toBe('4242424242424242');
});

test('gateway preset adds an environment once', async ({ page }) => {
  await addButton(page).click();
  await page.getByRole('tab', { name: 'Gateways' }).click();
  await page.getByRole('button', { name: 'Add Stripe pack' }).click();
  await expect(page.locator('#toast')).toContainText('“Stripe” pack added');
  await expect(page.getByRole('button', { name: 'Add Stripe pack' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Stripe' })).toBeVisible();
  await page.getByRole('tab', { name: 'Stripe' }).click();
  expect(await page.locator('.card-row').count()).toBeGreaterThan(3);
});

test('JSON tab imports valid JSON and reports invalid JSON', async ({ page }) => {
  await addButton(page).click();
  await page.getByRole('tab', { name: 'JSON' }).click();
  await page.locator('#j-text').fill('{nope');
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByRole('alert').locator('.field-error')).toBeVisible();

  await page.locator('#j-text').fill(JSON.stringify([{ environment: 'QA', cards: [{ cardNumber: '5555555555554444', cardResponse: 'Declined by issuer' }] }]));
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'QA' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.card-row')).toContainText('5555 5555 5555 4444');
  await expect(page.locator('#toast')).toContainText('1 card added');
});

test('manage: rename, delete card with undo, delete environment with undo', async ({ page }) => {
  await page.getByRole('button', { name: 'Manage environments' }).click();
  const name = page.getByLabel('Environment name');
  await name.fill('Sandbox');
  await name.press('Enter');
  await expect.poll(async () => (await readStorage(page)).environments[0].environment).toBe('Sandbox');

  await page.getByRole('button', { name: 'Delete card' }).first().click();
  await expect(page.locator('.env-card-row')).toHaveCount(2);
  await page.locator('#toast').getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.env-card-row')).toHaveCount(3);

  await page.getByRole('button', { name: 'Delete environment' }).click();
  await expect(page.getByText('No environments.')).toBeVisible();
  await page.locator('#toast').getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByLabel('Environment name')).toHaveValue('Sandbox');

  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Sandbox' })).toBeVisible();
});

test('language switch persists after reload', async ({ page }) => {
  await page.getByRole('button', { name: 'ES', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('button', { name: 'Administrar ambientes' })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('button', { name: 'Administrar ambientes' })).toBeVisible();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Manage environments' })).toBeVisible();
});

test('fresh install in a Spanish browser seeds Spanish default responses', async ({ page }) => {
  await page.evaluate(() => chrome.storage.local.clear());
  await page.evaluate(() => chrome.storage.local.set({ uiLanguage: 'es' }));
  await page.reload();
  await expect(page.locator('.card-row').first()).toContainText('Transacción aprobada');
});
