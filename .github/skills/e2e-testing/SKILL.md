---
name: e2e-testing
description: Write Playwright E2E tests for the Next.js frontend in the marcx-ai-monorepo. Use this skill when the user asks to write frontend tests, add E2E coverage, create visual snapshots, or automate browser interactions.
license: MIT
---

This skill guides writing clean, reliable Playwright E2E tests for the Next.js frontend in `apps/web/`. Tests auto-click, fill inputs, navigate pages, and capture visual snapshots.

## Project Context

- **Framework**: Next.js 16 (App Router), React 19
- **Test runner**: Playwright (Apache 2.0)
- **Test dir**: `apps/web/e2e/`
- **Config**: `apps/web/playwright.config.ts`
- **Auth**: OTP-based email login — tests use a seeded test account
- **Backend**: NestJS at `http://localhost:4001` (test port) via `NEXT_PUBLIC_API_URL`
- **Snapshots**: `e2e/__snapshots__/` — committed to git as baseline

## Playwright Config (`apps/web/playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
```

## Auth Fixture (Reuse Across Tests)

```typescript
// e2e/fixtures/auth.ts
import { test as base, expect } from '@playwright/test'

type AuthFixtures = {
  authenticatedPage: Page
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('test@marcx.test')
    await page.getByRole('button', { name: 'Continue' }).click()

    // OTP step — in test env backend returns a predictable OTP
    await page.waitForURL('**/verify')
    await page.getByLabel('OTP').fill('000000')
    await page.getByRole('button', { name: 'Verify' }).click()

    await page.waitForURL('**/chat')
    await use(page)
  },
})

export { expect }
```

## Test File Structure

```typescript
import { test, expect } from '../fixtures/auth'

test.describe('Documents Page', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/documents')
    await authenticatedPage.waitForSelector('[data-testid="documents-page"]')
  })

  test('shows empty state when no documents', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('No documents yet')).toBeVisible()
  })

  test('uploads a file and shows it in the list', async ({ authenticatedPage: page }) => {
    // Trigger file upload
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'invoice.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake-pdf-content'),
    })

    // Wait for upload to complete
    await expect(page.getByText('invoice.pdf')).toBeVisible({ timeout: 10_000 })
  })

  test('matches visual snapshot', async ({ authenticatedPage: page }) => {
    await expect(page).toHaveScreenshot('documents-page.png', {
      maxDiffPixelRatio: 0.05,
    })
  })
})
```

## Selector Priority (Most → Least Reliable)

1. `data-testid` attribute — `page.getByTestId('submit-button')`
2. ARIA role + name — `page.getByRole('button', { name: 'Submit' })`
3. Label — `page.getByLabel('Email address')`
4. Text content — `page.getByText('Upload Document')`
5. CSS selector — **last resort only** — `page.locator('.upload-button')`

## Adding `data-testid` to Components

Always add `data-testid` to page root elements and key interactive elements:

```tsx
// In Next.js components
<div data-testid="documents-page">
  <button data-testid="upload-button">Upload</button>
  <div data-testid="document-list">...</div>
</div>
```

## Visual Snapshot Tests

```typescript
test('navigation sidebar looks correct', async ({ authenticatedPage: page }) => {
  await page.goto('/chat')
  // Wait for full render
  await page.waitForLoadState('networkidle')

  await expect(page).toHaveScreenshot('sidebar-nav.png', {
    maxDiffPixelRatio: 0.05,  // 5% tolerance for font rendering diffs
    animations: 'disabled',   // Disable CSS animations for consistency
  })
})
```

Update snapshots when UI intentionally changes:
```bash
cd apps/web && npx playwright test --update-snapshots
```

## Waiting Patterns (Never Use `page.waitForTimeout`)

```typescript
// ✅ Wait for element to appear
await expect(page.getByTestId('document-list')).toBeVisible()

// ✅ Wait for network to settle
await page.waitForLoadState('networkidle')

// ✅ Wait for URL change
await page.waitForURL('**/documents')

// ✅ Wait for specific text
await expect(page.getByText('Upload complete')).toBeVisible({ timeout: 15_000 })

// ❌ Never do this
await page.waitForTimeout(2000)
```

## Form Interaction Pattern

```typescript
test('can invite a team member', async ({ authenticatedPage: page }) => {
  await page.goto('/settings')
  await page.getByRole('tab', { name: 'Members' }).click()

  await page.getByLabel('Email address').fill('newmember@company.com')
  await page.getByRole('combobox', { name: 'Role' }).selectOption('ACCOUNTANT')
  await page.getByRole('button', { name: 'Send Invite' }).click()

  await expect(page.getByText('Invitation sent')).toBeVisible()
})
```

## Test Files in This Project

| File | Path | What it Tests |
|------|------|---------------|
| `auth.spec.ts` | `e2e/auth.spec.ts` | Login, OTP verify, logout |
| `chat.spec.ts` | `e2e/chat.spec.ts` | Create session, send message, see AI response |
| `documents.spec.ts` | `e2e/documents.spec.ts` | Upload file, OCR trigger, status badge |
| `ledger.spec.ts` | `e2e/ledger.spec.ts` | GL view, upload, export |
| `settings.spec.ts` | `e2e/settings.spec.ts` | Tabs, invite member, role change, usage |
| `navigation.spec.ts` | `e2e/navigation.spec.ts` | Sidebar nav, page loads, visual snapshots |

## Key Rules

- **Never** use `waitForTimeout` — always wait for elements or network states
- Use `authenticatedPage` fixture for all tests that require login
- Add `data-testid` to page root and key interactive elements in components
- Run `--update-snapshots` only when the UI change is intentional and reviewed
- Keep each `test()` focused on one user interaction or assertion
- Use `test.describe` to group related tests for the same page/feature
- Tests must be independent — no test should depend on another test's state
