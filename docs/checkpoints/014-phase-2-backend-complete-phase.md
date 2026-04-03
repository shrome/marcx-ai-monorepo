# Checkpoint 014 — Phase 4 Testing Complete

**Date:** Session a1740f50 (continued)
**Status:** ✅ All 18/18 todos done. Backend 96/96 E2E tests passing. Frontend Playwright specs updated.

---

## What Was Accomplished

### Backend E2E Tests (Phase 4A) — 96 tests, 12 suites ✅

**New test file created:**
- `apps/backend/test/ledger.e2e-spec.ts` — 23 tests covering:
  - POST: create, optional description, duplicate fiscalYear → 409, missing name → 400, missing fiscalYear → 400, year < 2000 → 400, 401 without auth
  - GET list: lists ledgers for company, does not leak other company's ledgers (tenant isolation), 401 without auth
  - GET one: by id, 404 for unknown, 401 without auth
  - PATCH: update name, update status to CLOSED, invalid status → 400, 404 for unknown, 401 without auth
  - DELETE: deletes, 404 after deletion, 404 for unknown, 401 without auth
  - Session scoping: creates session with `ledgerId` FK

**Existing test files fixed:**
- `session.e2e-spec.ts`: removed stale `fiscalYear: 2024` from session create payload
- `document.e2e-spec.ts`: removed stale `fiscalYear: 2024` from session create; added inline field assertions (`name`, `url`, `size`, `mimeType` present; `fileId` and `file` absent)

**Infrastructure fix:**
- Applied Drizzle migration `0005` to test DB (`postgresql://test:test@localhost:15433/marcx_test`) — migration had not been run since schema refactor, causing all tests to fail with `DrizzleQueryError`

### Bug Fixed — LedgerController wrong route prefix

**File:** `apps/backend/src/modules/ledger/ledger.controller.ts`
**Root cause:** `@Controller('api/ledgers')` — the `api/` prefix was included in the controller decorator, but the app already sets `app.setGlobalPrefix('api')`, making the actual route `/api/api/ledgers` (404 for all requests)
**Fix:** Changed to `@Controller('ledgers')` — route is now correctly `/api/ledgers`

### Frontend Playwright Tests (Phase 4B) ✅

**`e2e/ledger.spec.ts`** — fully rewritten:
- Loads General Ledger heading on list page
- "New Ledger" button visible
- Creating a ledger navigates to `/ledger/<uuid>` detail page
- Detail page shows Export + Upload GL buttons
- Sidebar shows created ledger with `FY YYYY` label
- Ledger list page snapshot

**`e2e/documents.spec.ts`** — updated:
- Page loads with heading
- Upload shows `test-invoice.pdf` filename inline (tests `doc.name`, not `doc.file?.name`)
- Status badges (conditional)
- Row click navigates to `/documents/<uuid>`
- Page snapshot

**Test asset created:**
- `apps/web/public/test-invoice.pdf` — minimal valid PDF for upload tests

---

## Files Created

| File | Description |
|------|-------------|
| `apps/backend/test/ledger.e2e-spec.ts` | 23-test Ledger CRUD + tenant isolation + session scoping E2E suite |
| `apps/web/public/test-invoice.pdf` | Minimal PDF fixture for frontend document upload tests |

## Files Modified

| File | Change |
|------|--------|
| `apps/backend/src/modules/ledger/ledger.controller.ts` | Fixed route prefix `api/ledgers` → `ledgers` |
| `apps/backend/test/session.e2e-spec.ts` | Removed stale `fiscalYear` from session create payload |
| `apps/backend/test/document.e2e-spec.ts` | Removed stale `fiscalYear`; added inline field assertions |
| `apps/web/e2e/ledger.spec.ts` | Rewritten for Ledger-based flow (useLedgers, create + detail) |
| `apps/web/e2e/documents.spec.ts` | Updated for inline `doc.name` field; added detail navigation test |
| `IMPLEMENTATION_PLAN.md` | Phase 4 marked complete ✅ |

---

## Current State

- **Backend build:** ✅ 0 errors
- **Frontend build:** ✅ 0 errors, 15 pages
- **Backend E2E:** ✅ 96 tests, 12 suites — all passing
- **Frontend Playwright:** ✅ Updated for Ledger-based flow (requires dev server to run)

### All phases complete:
- ✅ Phase 1 — Schema (Ledger table, File→Document merge, migration 0005)
- ✅ Phase 2 — Backend modules (Ledger CRUD, Document, Session, AI Proxy, Chat)
- ✅ Phase 3 — Frontend (LedgerClient, hooks, pages, sidebar, document components)
- ✅ Phase 4 — Tests (96 backend E2E + Playwright specs)
- ✅ Phase 5 — Invitations (schema, backend, frontend)
- ✅ Phase 6 — Schema refactor + full rewire
- ⏸️ Phase 7 — Webhooks (blocked pending Jason's approval)

---

## What Is Next

### Remaining known gaps (not blockers):
1. **GL status not scoped by ledger** — `LedgerPage` calls `useGLStatus()` globally; needs `ledger_scope_id` passthrough once real AI endpoints are live
2. **Chat UI ledger picker** — `createChatSession` accepts `ledgerId` but chat form has no ledger selection UI
3. **`Document.size` is varchar** — coerced with `Number()` in `DocumentsPage`; minor improvement would be integer in schema

### If Phase 7 (Webhooks) gets approved:
- `WebhookGuard` (shared secret validation)
- OCR job-completed webhook endpoint
- Document enriched webhook endpoint
- Webhook-specific E2E tests
