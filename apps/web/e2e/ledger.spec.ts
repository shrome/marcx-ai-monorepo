import { test, expect } from '@playwright/test';

test.describe('Ledger', () => {
  test('shows the General Ledger heading on list page', async ({ page }) => {
    await page.goto('/ledger');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /general ledger/i }),
    ).toBeVisible();
  });

  test('New Ledger button is present on list page', async ({ page }) => {
    await page.goto('/ledger');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('button', { name: /new ledger/i }),
    ).toBeVisible();
  });

  test('creating a ledger navigates to ledger detail page', async ({ page }) => {
    await page.goto('/ledger');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /new ledger/i }).click();

    // Should navigate to /ledger/<uuid>
    await page.waitForURL(/\/ledger\/[0-9a-f-]{36}/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/ledger\/[0-9a-f-]{36}/);
  });

  test('ledger detail page shows Export and Upload GL buttons', async ({ page }) => {
    await page.goto('/ledger');
    await page.waitForLoadState('networkidle');

    // Create a ledger to get a detail URL
    await page.getByRole('button', { name: /new ledger/i }).click();
    await page.waitForURL(/\/ledger\/[0-9a-f-]{36}/, { timeout: 15_000 });

    await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /upload gl/i })).toBeVisible();
  });

  test('sidebar shows newly created ledger under Ledger nav', async ({ page }) => {
    await page.goto('/ledger');
    await page.waitForLoadState('networkidle');

    // Create a ledger
    await page.getByRole('button', { name: /new ledger/i }).click();
    await page.waitForURL(/\/ledger\/[0-9a-f-]{36}/, { timeout: 15_000 });

    // Go back to list page — sidebar should show the ledger
    await page.goto('/ledger');
    await page.waitForLoadState('networkidle');

    // At least one ledger card should be visible after creation
    const cards = page.locator('[class*="cursor-pointer"]').filter({ hasText: /FY \d{4}/ });
    await expect(cards.first()).toBeVisible({ timeout: 5_000 });
  });

  test('ledger list page snapshot', async ({ page }) => {
    await page.goto('/ledger');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('ledger-list.png', { maxDiffPixelRatio: 0.05 });
  });
});
