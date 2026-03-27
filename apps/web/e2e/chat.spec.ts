import { test, expect } from '@playwright/test';

test.describe('Chat', () => {
  test('creates a new session and sends a message', async ({ page }) => {
    await page.goto('/chat');

    // Create new session
    await page.getByRole('button', { name: /new session|new chat/i }).click();
    await page.getByLabel(/title/i).fill('Q1 Invoice Review');
    await page.getByRole('button', { name: /create|confirm/i }).click();

    // Wait for session to appear in sidebar
    await expect(page.getByText('Q1 Invoice Review')).toBeVisible();

    // Send a message
    const input = page.getByPlaceholder(/message|ask/i);
    await input.fill('Summarise my invoices for this quarter');
    await input.press('Enter');

    // Message appears in chat
    await expect(
      page.getByText('Summarise my invoices for this quarter'),
    ).toBeVisible();
  });

  test('deletes a session', async ({ page }) => {
    await page.goto('/chat');

    // Create a session to delete
    await page.getByRole('button', { name: /new session|new chat/i }).click();
    await page.getByLabel(/title/i).fill('Session To Delete');
    await page.getByRole('button', { name: /create|confirm/i }).click();
    await expect(page.getByText('Session To Delete')).toBeVisible();

    // Delete it
    await page.getByText('Session To Delete').hover();
    await page.getByRole('button', { name: /delete/i }).first().click();
    await page.getByRole('button', { name: /confirm|yes/i }).click();

    await expect(page.getByText('Session To Delete')).not.toBeVisible();
  });
});
