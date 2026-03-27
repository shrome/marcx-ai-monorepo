# Checkpoint 009 — Checkpoints migrated to project, frontend synced

## What Was Accomplished

- Moved all 8 prior session checkpoints into `docs/checkpoints/` in the project repo
- Created `docs/checkpoints/index.md` with a summary table and instructions for adding new checkpoints
- Rewrote the "Progress Tracking" rule in `.github/copilot-instructions.md` to be mandatory with step-by-step instructions pointing to `docs/checkpoints/`
- Added `TEST_FIXED_OTP` support to the backend auth service (non-production guard)
- Rewrote `apps/web/e2e/auth.setup.ts` to be fully self-contained — registers a new user, verifies OTP, creates company, then saves browser state
- Added `TEST_FIXED_OTP=000000` to `.env.test` (root)
- Created `apps/web/.env.local.example` with frontend env vars
- Fixed frontend TypeScript error in `apps/web/components/cases/FileGrid.tsx` — imported `File` type from `@marcx/db` which wasn't re-exported; replaced with local type derived from `file.$inferSelect`
- Verified: `pnpm tsc --noEmit` in `apps/web` exits 0 — no TypeScript errors

---

## Bugs Fixed

### 1. `FileGrid.tsx` — import of non-exported type
- **File:** `apps/web/components/cases/FileGrid.tsx:27`
- **Root cause:** `export type File` exists in `packages/drizzle/src/schema.ts` but is not re-exported from `packages/drizzle/src/index.ts`, so `@marcx/db` doesn't expose it
- **Fix:** Replaced `import type { File as FileType } from "@marcx/db"` with `import type { file } from "@marcx/db/schema"` + local `type FileType = typeof file.$inferSelect`

### 2. Playwright `auth.setup.ts` — hardcoded pre-existing user
- **File:** `apps/web/e2e/auth.setup.ts`
- **Root cause:** Used `test@example.com` which must be pre-seeded; OTP selector used `getByLabel(/otp/i)` which doesn't match `InputOTP` (a custom component with no label)
- **Fix:** Full self-registration flow with timestamp-based email; OTP input targets `[data-input-otp]` and uses `keyboard.type()` for the 6 digits

### 3. Backend OTP generation — not deterministic for E2E
- **File:** `apps/backend/src/modules/auth/auth.service.ts`
- **Root cause:** All three OTP generation sites used `Math.random()` inline — no hook for test override
- **Fix:** Extracted `generateOtp()` private method; when `NODE_ENV !== 'production'` and `TEST_FIXED_OTP` env var is set, returns that fixed value instead of random

---

## Files Created

- `docs/checkpoints/index.md` — checkpoint index with table + rules
- `docs/checkpoints/001-ledger-schema-design-docs.md` (copied from session state)
- `docs/checkpoints/002-schema-implementation-and-web.md` (copied)
- `docs/checkpoints/003-backend-fixes-and-implementati.md` (copied)
- `docs/checkpoints/004-phase-1-complete-phase-2-start.md` (copied)
- `docs/checkpoints/005-phase-2-3-complete.md` (copied)
- `docs/checkpoints/006-phase-4-setup-and-decorators.md` (copied)
- `docs/checkpoints/007-fixing-e2e-test-infrastructure.md` (copied)
- `docs/checkpoints/008-phase-4-all-tests-passing.md` (copied)
- `apps/web/.env.local.example` — frontend env var template

## Files Modified

- `.github/copilot-instructions.md` — Progress Tracking rule rewritten as mandatory with full step-by-step instructions
- `.env.test` — added `TEST_FIXED_OTP=000000`
- `apps/backend/src/modules/auth/auth.service.ts` — `generateOtp()` method extracted; all three OTP sites use it
- `apps/web/e2e/auth.setup.ts` — fully rewritten for self-registration flow
- `apps/web/components/cases/FileGrid.tsx` — fixed File type import

---

## Current State

| Area | Status |
|------|--------|
| Backend E2E tests (73/73) | ✅ Passing |
| Frontend TypeScript | ✅ 0 errors |
| Docs checkpoints in project repo | ✅ Done |
| Copilot instructions — checkpoint rule | ✅ Updated |
| `TEST_FIXED_OTP` in backend | ✅ Done |
| Playwright auth.setup.ts | ✅ Rewritten (self-contained) |
| Playwright tests running against live server | ⚠️ Not verified — requires backend + frontend server running |

---

## What Is Next

1. **Run Playwright E2E tests end-to-end** — requires:
   - Backend running with `TEST_FIXED_OTP=000000` in env
   - Frontend running (`pnpm dev` in `apps/web`)
   - `cd apps/web && npx playwright install chromium && pnpm test:e2e`

2. **Verify `[data-input-otp]` selector** — if shadcn's InputOTP doesn't render `data-input-otp` attribute, adjust selector in `auth.setup.ts` (check with `page.locator('input').nth(0)` as fallback)

3. **Phase 4 completion** — once Playwright passes, Phase 4 is complete. Update `IMPLEMENTATION_PLAN.md`.

4. **Optional: snapshot baselines** — run `pnpm test:e2e --update-snapshots` once to generate initial screenshot baselines for visual regression

---

## Known Risks

- `InputOTP` (shadcn / react-input-otp) renders as `<input data-input-otp ...>` — this is the standard attribute from the `input-otp` npm package. If the installed version differs, the selector may need adjusting.
- Playwright `auth.setup.ts` creates a new `e2e-{timestamp}@test.marcx.ai` user on every run. These accumulate in the test DB. Consider adding a cleanup step or using a fixed test email with the `TEST_FIXED_OTP` approach.
