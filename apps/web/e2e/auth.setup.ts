import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(__dirname, '.auth/user.json');

const TEST_EMAIL = `e2e-${Date.now()}@test.marcx.ai`;
const TEST_NAME = 'E2E Test User';
const TEST_OTP = process.env.TEST_FIXED_OTP ?? '000000';

/**
 * Runs once before all test suites to register, verify, create a company,
 * and save browser auth state. Subsequent tests reuse this state.
 *
 * Requires: TEST_FIXED_OTP=000000 in the backend .env (or .env.test)
 * so the OTP is predictable during E2E runs.
 */
setup('authenticate', async ({ page }) => {
  // Ensure .auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  // ── 1. Register ───────────────────────────────────────────────────────────
  await page.goto('/register');
  await page.getByLabel('Name').fill(TEST_NAME);
  await page.getByLabel('Email').fill(TEST_EMAIL);
  await page.getByRole('button', { name: 'Send OTP' }).click();

  // ── 2. Verify registration OTP ────────────────────────────────────────────
  // InputOTP renders a single hidden input — click the group then type digits
  await page.waitForSelector('[data-input-otp]', { timeout: 10_000 });
  await page.locator('[data-input-otp]').click();
  await page.keyboard.type(TEST_OTP);
  await page.getByRole('button', { name: 'Verify & Continue' }).click();

  // ── 3. Create company ─────────────────────────────────────────────────────
  await page.waitForURL('**/register/company', { timeout: 10_000 });
  await page.getByLabel('Company Name').fill('E2E Test Company');
  await page.getByRole('combobox').first().click();
  await page.getByRole('option').first().click();
  await page.getByRole('button', { name: 'Create Company' }).click();

  // ── 4. Confirm we land on the main app ────────────────────────────────────
  await page.waitForURL(/\/(chat|dashboard)/, { timeout: 15_000 });
  await expect(page).toHaveURL(/\/(chat|dashboard)/);

  // ── 5. Save auth state ────────────────────────────────────────────────────
  await page.context().storageState({ path: authFile });
});

