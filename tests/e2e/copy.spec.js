import { test, expect, createClipboardReader, digitsOf } from './fixtures.js';

let readClipboard;
test.beforeEach(async ({ context, page }) => {
  readClipboard = await createClipboardReader(context);
  await page.bringToFront();
});

test('clicking a card copies its digits', async ({ page }) => {
  await page.locator('.card-row').nth(1).click();
  await expect(page.locator('.card-row').nth(1)).toHaveAttribute('data-state', 'copied');
  const text = await readClipboard();
  expect(text).toBe('4574441215190335');
  expect(digitsOf(text)).toBe(text);
});

test('number keys copy the matching row', async ({ page }) => {
  await page.keyboard.press('3');
  await expect(page.locator('.card-row').nth(2)).toHaveAttribute('data-state', 'copied');
  expect(await readClipboard()).toBe('4349003000047015');
  await page.keyboard.press('1');
  await expect.poll(() => readClipboard()).toBe('5451951574925480');
});

test('number keys do not copy while typing in the search field', async ({ page }) => {
  await page.keyboard.press('/');
  await page.keyboard.type('4349');
  await expect(page.locator('.card-row')).toHaveCount(1);
  await expect(page.locator('.card-row[data-state="copied"]')).toHaveCount(0);
});

test('quick chips copy their value', async ({ page }) => {
  await page.locator('.quick-chip', { hasText: 'CVV' }).click();
  await expect.poll(() => readClipboard()).toMatch(/^\d{3}$/);
});
