import { test, expect } from '@playwright/test';

test.describe('Ledger', () => {
  test('loads the general ledger page', async ({ page }) => {
    await page.goto('/ledger');
    await page.waitForLoadState('networkidle');

    // Page heading visible
    await expect(
      page.getByRole('heading', { name: /general ledger|ledger/i }),
    ).toBeVisible();
  });

  test('ledger page snapshot', async ({ page }) => {
    await page.goto('/ledger');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('ledger.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('export button is present', async ({ page }) => {
    await page.goto('/ledger');
    const exportBtn = page.getByRole('button', { name: /export/i });
    await expect(exportBtn).toBeVisible();
  });
});
