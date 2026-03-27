import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('sidebar navigates to all main pages', async ({ page }) => {
    await page.goto('/');

    // Verify dashboard loads
    await expect(page.getByTestId('sidebar')).toBeVisible();

    // Navigate to chat
    await page.getByRole('link', { name: /chat/i }).click();
    await page.waitForURL('**/chat**');
    await expect(page).toHaveURL(/chat/);

    // Navigate to documents
    await page.getByRole('link', { name: /document/i }).click();
    await page.waitForURL('**/documents**');
    await expect(page).toHaveURL(/document/);

    // Navigate to ledger
    await page.getByRole('link', { name: /ledger/i }).click();
    await page.waitForURL('**/ledger**');
    await expect(page).toHaveURL(/ledger/);

    // Navigate to settings
    await page.getByRole('link', { name: /setting/i }).click();
    await page.waitForURL('**/settings**');
    await expect(page).toHaveURL(/setting/);
  });

  test('dashboard snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});
