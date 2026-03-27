# Checkpoint 010 — Frontend API Alignment

## What Was Done

Fixed deep frontend misalignments — documents page errors, ledger showing hardcoded fake data, sidebar showing fake ledger books, and broken ledger routing.

---

## Problems Fixed

### 1. Documents page — response shape mismatch
**Root cause:** `DocumentClient.findAll()` was typed as returning `Document[]`, but the backend `documentService.findAll()` returns `{ data: Document[], page: number, limit: number }`. Every component using `useDocuments()` received the entire pagination wrapper object instead of the array, causing `.map is not a function` errors.

**Fix:**
- `apps/web/lib/backend/document.ts` — Updated `findAll()` return type to `{ data: Document[]; page: number; limit: number }` and removed `companyId` from `ListDocumentsQuery` (backend uses JWT, not query params)
- `apps/web/hooks/useDocumentQueries.ts` — Added `select: (data) => data.data` to `useDocuments` so callers always get `Document[]`
- `apps/web/components/documents/DocumentsPage.tsx` — Removed `{ companyId }` query argument (backend uses JWT-scoped companyId; passing it as query param was redundant)

### 2. AppSidebar — hardcoded ledger book links
**Root cause:** `AppSidebar.tsx` had hardcoded `children` under the Ledger nav item (`"Ledger 1"` → `/ledger/book-1`, `"General Ledger 2025"` → `/ledger/my-ledger-2025`) that always showed when on any `/ledger` route.

**Fix:** `apps/web/components/layout/AppSidebar.tsx`
- Removed `children` from the Ledger nav item
- Ledger nav item now links directly to `/ledger`
- Simplified render loop (no more `children` expansion logic)

### 3. Ledger routing — redirect to fake ID
**Root cause:** `/app/(auth)/ledger/page.tsx` called `redirect("/ledger/book-1")` — a hardcoded fake book ID.

**Fix:**
- `apps/web/app/(auth)/ledger/page.tsx` — Now renders `<LedgerPage />` directly
- `apps/web/app/(auth)/ledger/[id]/page.tsx` — Now redirects back to `/ledger` (ID-based routing doesn't apply; one GL per company)

### 4. LedgerPage — entirely hardcoded mock data
**Root cause:** `LedgerPage.tsx` had `BOOKS_DATA` (fake ledger entries), `TASK_MOCK_ROWS`, and `MOCK_TASKS` (fake task data). The `OverviewTab` fell back to `book.groups` rows when real GL data wasn't available, showing fake data. The `TasksTab` only used `MOCK_TASKS`. The component required an `id: string` prop.

**Fix:** `apps/web/components/ledger/LedgerPage.tsx` — Full refactor (871 → 633 lines):
- Removed `BOOKS_DATA`, `TASK_MOCK_ROWS`, `MOCK_TASKS` constants
- Removed `LedgerBook` and `LedgerGroup` types
- Removed `id` prop — component is now `export function LedgerPage()`
- `OverviewTab` — removed `book` prop; falls back to empty array and shows the "No GL data" orange banner when no real data
- `TasksTab` — wired to real `useDocuments()` data; shows real documents with extraction/document status badges; clicking a row navigates to `/documents/{id}`; empty state when no documents
- `LedgerPage` — page title comes from `glStatus?.fiscalYear` or defaults to "General Ledger"; added `useDocuments()` call; removed all mock task state and handlers; removed `Sheet`/`TaskDetailView` (no longer driven from this page)

---

## Files Modified

| File | Change |
|------|--------|
| `apps/web/lib/backend/document.ts` | Fix `findAll` return type to `{ data, page, limit }`; remove `companyId` from query |
| `apps/web/hooks/useDocumentQueries.ts` | Add `select: data => data.data` to `useDocuments` |
| `apps/web/components/documents/DocumentsPage.tsx` | Remove `companyId` from `useDocuments` query |
| `apps/web/components/layout/AppSidebar.tsx` | Remove hardcoded ledger children; simplify nav render |
| `apps/web/app/(auth)/ledger/page.tsx` | Replace redirect with `<LedgerPage />` render |
| `apps/web/app/(auth)/ledger/[id]/page.tsx` | Redirect to `/ledger` |
| `apps/web/components/ledger/LedgerPage.tsx` | Full refactor — remove all mock data, wire to real APIs |

---

## Current State

- ✅ TypeScript: `npx tsc --noEmit` exits 0 (no errors)
- ✅ Documents page: response shape correctly handled
- ✅ Sidebar: no hardcoded ledger book links
- ✅ Ledger route: `/ledger` renders real component; `/ledger/[id]` redirects to `/ledger`
- ✅ LedgerPage: shows real GL status + transactions (empty state when AI API unavailable), shows real documents in Tasks tab

---

## Architecture Notes

- The backend document `findAll` always uses `req.user.companyId` from JWT — frontend should NOT pass `companyId` as a query param
- The AI-proxy routes (`/ai/general-ledger/*`, `/ai/ocr/*`) forward to the external AI API which uses tenant-based paths (`/api/tenants/{companyId}/gl/status`). This is correct — the NestJS proxy adds the tenant prefix. When the external AI API isn't running (placeholder URL), these return errors. `useGLStatus` and `useGLTransactions` return `undefined` in this case and the LedgerPage shows an appropriate empty state.
- The `TaskDetailView` component still exists but is no longer rendered from `LedgerPage`. It can be wired back in once the AI API is live and returns structured `draftData` per document.

---

## What Is Next

- **Phase 4 tests** — Backend E2E tests and Playwright frontend tests (see IMPLEMENTATION_PLAN.md)
- **AI API integration** — Once the real AI API URL is available, update `.env` and test the full OCR → GL flow
- **TaskDetailView reconnection** — Once AI API returns `draftData`, wire `TaskDetailView` back into the Ledger Tasks tab
