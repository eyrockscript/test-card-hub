import { test, expect, violations, addPreset } from './fixtures.js';

test('every screen runs with zero CSP violations and zero console errors', async ({ page, openPopup }) => {
  const seen = [];
  const sweep = async () => seen.push(...(await violations(page)));

  await sweep();
  await page.getByRole('button', { name: 'ES', exact: true }).click();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.locator('.quick-chip').first().click();
  await addPreset(page, 'Stripe');
  await page.getByRole('button', { name: 'Add cards', exact: true }).click();
  for (const tab of ['Card', 'JSON', 'Gateways']) {
    await page.getByRole('tab', { name: tab }).click();
    await sweep();
  }
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Manage environments' }).click();
  await page.getByRole('button', { name: 'Edit JSON' }).first().click();
  await sweep();
  await page.getByRole('button', { name: 'Back', exact: true }).click();

  const dark = await openPopup('', { colorScheme: 'dark' });
  await dark.getByRole('button', { name: 'Manage environments' }).click();
  seen.push(...(await violations(dark)));

  expect(seen).toEqual([]);
});
