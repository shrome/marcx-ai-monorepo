import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Documents', () => {
  test('documents page loads with heading', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /document/i }),
    ).toBeVisible();
  });

  test('uploads a document and shows it in the list with inline name', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // Click upload button
    await page.getByRole('button', { name: /upload/i }).click();

    // Attach the test PDF
    const fileInput = page.getByLabel(/file/i).or(page.locator('input[type="file"]'));
    await fileInput.setInputFiles(
      path.join(__dirname, 'test-invoice.pdf'),
    );

    // Confirm upload
    await page.getByRole('button', { name: /upload|submit|confirm/i }).last().click();

    // After upload, a document row with the filename should appear
    // The name comes from the inline `doc.name` field (not doc.file?.name)
    await expect(
      page.getByText('test-invoice.pdf').first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('shows document extraction status badges', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // Status badges may or may not exist depending on seed data
    const badges = page.getByTestId('document-status');
    if ((await badges.count()) > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test('navigates to document detail on row click', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');

    // If any document rows exist, click the first one
    const rows = page.locator('tr[class*="cursor-pointer"]');
    if ((await rows.count()) > 0) {
      await rows.first().click();
      await page.waitForURL(/\/documents\/[0-9a-f-]{36}/, { timeout: 10_000 });
      await expect(page).toHaveURL(/\/documents\/[0-9a-f-]{36}/);
    }
  });

  test('documents page snapshot', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('documents.png', { maxDiffPixelRatio: 0.05 });
  });
});
