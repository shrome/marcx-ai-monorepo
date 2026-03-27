import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test('loads the settings page', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /setting/i }),
    ).toBeVisible();
  });

  test('navigates between settings tabs', async ({ page }) => {
    await page.goto('/settings');

    // Click on Members tab
    const membersTab = page.getByRole('tab', { name: /member/i });
    if (await membersTab.isVisible()) {
      await membersTab.click();
      await expect(page.getByTestId('members-panel')).toBeVisible();
    }

    // Click on Billing tab
    const billingTab = page.getByRole('tab', { name: /billing|credit/i });
    if (await billingTab.isVisible()) {
      await billingTab.click();
      await expect(page.getByTestId('billing-panel')).toBeVisible();
    }
  });

  test('settings snapshot', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('settings.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});
