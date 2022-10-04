import { expect, test } from '@playwright/test';

test('should display a canvas on the screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('role', 'world');
});
