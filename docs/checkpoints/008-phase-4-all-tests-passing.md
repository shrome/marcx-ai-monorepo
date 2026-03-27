# Checkpoint 008 — Phase 4 Complete: All E2E Tests Passing ✅

## What Was Accomplished

All 73 backend E2E tests are now passing. Phase 4 is complete.

---

## Bugs Fixed in This Session

### 1. `MockEmailService` registration token fix
- **File**: `apps/backend/test/helpers/test-app.ts`
- **Bug**: `module.get(MockEmailService)` fails — provider is registered under `EmailService` token
- **Fix**: `module.get<MockEmailService>(EmailService)`

### 2. `scripts/test-db.sh` path bug
- **Bug**: `$(dirname "$0")` expanded to relative path `scripts/` instead of absolute
- **Fix**: Added `SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"` and used `$SCRIPT_DIR` throughout

### 3. `session.service.ts` — `create()` used `crypto.randomUUID()` as companyId
- **File**: `apps/backend/src/modules/session/session.service.ts`
- **Bug**: When no companyId provided, inserted a random UUID (FK constraint violation)
- **Fix**: Look up user's membership from DB to resolve `companyId`; also added `fiscalYear` to insert

### 4. `company.service.ts` — wrong role name in guard
- **File**: `apps/backend/src/modules/company/company.service.ts`
- **Bug**: `update()` checked for `'COMPANY_OWNER'` but actual role is `'OWNER'`
- **Fix**: Changed to check `'OWNER'` (and removed the `userRole` param entirely — now reads from DB membership)

### 5. JWT missing `companyId`
- **Files**: `auth.service.ts`, `jwt.strategy.ts`
- **Bug**: JWT payload only had `{ sub, email, role }`. Document service used `req.user.companyId` which was always `undefined`
- **Fix**: Added `companyId` to `JwtPayload` interface and `generateTokenPair()`. Updated both register/verify and login/verify to pass `membership?.companyId`. Updated `JwtStrategy.validate()` to return `companyId` in the user object.
- **Seed updated**: `seedTestUser()` now re-logs in after company creation so the returned JWT includes the companyId.

### 6. `FileStorageService` called real S3 in tests
- **Files**: `test/helpers/mock-file-storage.service.ts` (new), `test/helpers/test-app.ts`
- **Bug**: Document upload tests got 400 "File upload failed" because S3 creds are fake in `.env.test`
- **Fix**: Created `MockFileStorageService` (returns fake S3 URL). Override in `createTestApp()` alongside `MockEmailService`.

### 7. Wrong response shape assertions
- **Files**: `billing.e2e-spec.ts`, `activity-log.e2e-spec.ts`, `document.e2e-spec.ts`, `ai-proxy.e2e-spec.ts`
- **Fixes**:
  - Billing `balance` is a string (Drizzle decimal), not number
  - `listTransactions`, `findAll` (documents), `list` (activity-log) all return `{ data, page, limit }` not arrays
  - AI proxy wraps response in `{ data: ... }`

---

## Files Created

- `apps/backend/test/helpers/mock-file-storage.service.ts` — test stub for S3 uploads
- `apps/backend/test/helpers/mock-email.service.ts` — test stub for Resend OTP (existed from checkpoint 007)
- `apps/backend/test/helpers/test-app.ts` — createTestApp + seedTestUser factory (updated)
- `apps/backend/test/{auth,user,company,company-member,session,document,chat,billing,activity-log,ai-proxy}.e2e-spec.ts` — all 10 spec files (written/rewritten)

## Files Modified

- `apps/backend/src/modules/auth/strategies/jwt.strategy.ts` — `companyId` added to JwtPayload + validate return
- `apps/backend/src/modules/auth/auth.service.ts` — `generateTokenPair` accepts `companyId`; callers pass it
- `apps/backend/src/modules/session/session.service.ts` — `create()` resolves companyId from DB membership
- `apps/backend/src/modules/company/company.service.ts` — `update()` reads role from DB membership (not JWT)
- `apps/backend/src/modules/company/company.controller.ts` — removed `userRole` arg from `update()` call
- `scripts/test-db.sh` — fixed path with `SCRIPT_DIR`
- `.github/copilot-instructions.md` — added Progress Tracking / Model Handoff section

---

## Current Test Results

```
Test Suites: 11 passed, 11 total
Tests:       73 passed, 73 total
```

Run with:
```bash
bash scripts/test-db.sh start
bash scripts/test-db.sh migrate
cd apps/backend && pnpm test:e2e
```

---

## What Is Next

### Phase 5 — Pending Jason's Approval
- Webhooks for AI-API callbacks (currently deferred)

### Frontend E2E (Playwright)
- 5 spec files written in `apps/web/e2e/`
- Playwright config at `apps/web/playwright.config.ts`
- Needs a running dev server + backend to actually execute
- Run: `cd apps/web && pnpm test:e2e` (requires `pnpm dev` in another terminal)

### Optional polish
- Add `--forceExit` to jest-e2e.json to eliminate the "worker did not exit gracefully" warning
- Consider adding DB truncation between test suites for full isolation
