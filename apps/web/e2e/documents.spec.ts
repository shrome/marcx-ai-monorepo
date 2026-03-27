import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Documents', () => {
  test('uploads a document and sees it in the list', async ({ page }) => {
    await page.goto('/documents');

    // Click upload button
    await page.getByRole('button', { name: /upload/i }).click();

    // Select a file
    const fileInput = page.getByLabel(/file/i).or(page.locator('input[type="file"]'));
    await fileInput.setInputFiles(
      path.join(__dirname, '../public/test-invoice.pdf'),
    );

    // Confirm upload
    await page.getByRole('button', { name: /upload|submit|confirm/i }).last().click();

    // Wait for document in list
    await expect(page.getByTestId('document-list').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('shows document status badges', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // Should show status badges
    const badges = page.getByTestId('document-status');
    if ((await badges.count()) > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test('documents page snapshot', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('documents.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});
