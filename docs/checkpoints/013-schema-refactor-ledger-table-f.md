# Checkpoint 013 — Phase 2E + Phase 3 Frontend Complete

**Date:** Session a1740f50 (continued)
**Status:** ✅ Backend Phase 2 fully complete. ✅ Frontend Phase 3 fully complete. Both builds 0 errors.

---

## What Was Accomplished

### Phase 2E — AI Proxy Module (completed)
- Updated `ocrJobProcess()` service method: now accepts `ledgerId` string, calls `resolveLedger()` to look up `Ledger` record, derives `fiscalYear` and `ledgerScopeId`, passes both to AI API (`fiscal_year`, `ledger_scope_id`)
- Updated `ocrJobProcess()` controller: `@Query('fiscal_year')` → `@Query('ledgerId')`, updated `@ApiQuery` Swagger decorator accordingly
- Updated `ocrPresign()` controller: body field renamed `fileId` → `documentId` (aligns with merged Document table)

### Phase 3A — Frontend Types Updated
- `types.ts`: removed `Session.fiscalYear`, added `Session.ledgerId?: string | null`
- `types.ts`: added full `Ledger` interface (`id, companyId, creatorId, name, fiscalYear, status, description, deletedAt, createdAt, updatedAt`)
- `types.ts`: added `CreateLedgerDto`, `UpdateLedgerDto`
- `types.ts`: `Message.files` → `Message.documents` (inline document fields: `name, url, size, mimeType, ledgerId, chatId`)

### Phase 3B — LedgerClient + Hooks
- Created `apps/web/lib/backend/ledger.ts`: `LedgerClient` with `create`, `findAll`, `findOne`, `update`, `remove`
- Updated `apps/web/lib/backend/index.ts`: exported `LedgerClient`, `Ledger/CreateLedgerDto/UpdateLedgerDto` types; added `public ledger: LedgerClient` to `BackendClient`; wired up in constructor
- Created `apps/web/hooks/useLedgerQueries.ts`: `useLedgers()`, `useLedger(id)`, `useCreateLedger()`, `useUpdateLedger(id)`, `useDeleteLedger()`

### Phase 3C — Ledger Pages Updated
- `LedgerListPage.tsx`: fully rewrote to use `useLedgers()` (was `useSessions()` + filter by fiscalYear). New `LedgerCard` uses `ledger.name`, `ledger.fiscalYear`, `ledger.status`. "New Ledger" button now directly creates a ledger for current year and navigates to it with Sonner toast feedback.
- `AppSidebar.tsx`: switched from `useSessions()` to `useLedgers()`. Dynamic sub-nav now lists recent ledgers with `ledger.name` + `FY{ledger.fiscalYear}`. Links to `/ledger/${ledger.id}`.
- `apps/web/app/(auth)/ledger/[id]/page.tsx`: changed `<LedgerPage sessionId={id} />` → `<LedgerPage ledgerId={id} />`

### Phase 3D — Document Type + Components
- `apps/web/lib/backend/document.ts`: rewrote `Document` interface — removed `fileId`/`file?: {}` nested object; added `name, url, size, mimeType, ledgerId, chatId, uploadSource` inline fields. Updated `ListDocumentsQuery` to include `ledgerId` filter. Updated `findAll()` to pass `ledgerId` query param.
- `apps/web/lib/backend/session.ts`: `findAll(fiscalYear?)` → `findAll(ledgerId?)`. `createChatSession()` now accepts optional `ledgerId`.
- `DocumentsPage.tsx`: `doc.file?.name` → `doc.name`, `doc.file?.size` → `doc.size` (with `Number()` coerce for `formatBytes`)
- `LedgerPage.tsx`: added `useLedger(ledgerId)` import + call. Page title uses `ledger?.name` as primary, falls back to GL status. Documents filtered by `d.ledgerId === ledgerId` (was `d.sessionId === sessionId`). `doc.file?.name` → `doc.name`.

### Phase 3E — Sidebar
- Covered under 3C above (AppSidebar).

---

## Bugs Fixed

| File | Root Cause | Fix |
|------|-----------|-----|
| `ai-proxy.controller.ts` | `fileId` body field still referenced old File table | Renamed to `documentId` |
| `ai-proxy.controller.ts` | `@Query('fiscal_year')` in `ocrJobProcess` — raw fiscal year no longer sent from frontend | Changed to `@Query('ledgerId')` |
| `ai-proxy.service.ts` | `ocrJobProcess` accepted raw `fiscalYear` string instead of resolving from Ledger | Now accepts `ledgerId`, calls `resolveLedger()`, passes `fiscal_year` + `ledger_scope_id` to AI API |
| `LedgerListPage.tsx` | `useSessions()` + `filter(s => s.fiscalYear)` — fiscalYear removed from Session | Rewrote to use `useLedgers()` |
| `AppSidebar.tsx` | `useSessions()` + `filter(s => s.fiscalYear)` — same stale pattern | Rewrote to use `useLedgers()` |
| `LedgerPage.tsx` | `sessionId` prop, `filter(d => d.sessionId === sessionId)`, `doc.file?.name` | Changed to `ledgerId`, filter by `d.ledgerId`, `doc.name` |
| `DocumentsPage.tsx` | `doc.file?.name`, `doc.file?.size` — File table removed | Changed to `doc.name`, `doc.size` |

---

## Files Created

| File | Description |
|------|-------------|
| `apps/web/lib/backend/ledger.ts` | `LedgerClient` — CRUD methods for `/ledgers` endpoints |
| `apps/web/hooks/useLedgerQueries.ts` | React Query hooks: `useLedgers`, `useLedger`, `useCreateLedger`, `useUpdateLedger`, `useDeleteLedger` |

## Files Modified

| File | Change |
|------|--------|
| `apps/backend/src/modules/ai-proxy/ai-proxy.service.ts` | `ocrJobProcess` now resolves Ledger from `ledgerId`; derives `fiscalYear` + `ledgerScopeId` |
| `apps/backend/src/modules/ai-proxy/ai-proxy.controller.ts` | `@Query('ledgerId')` for `ocrJobProcess`; body field `documentId` for `ocrPresign` |
| `apps/web/lib/backend/types.ts` | Added `Ledger`, `CreateLedgerDto`, `UpdateLedgerDto`; updated `Session` (ledgerId), `Message` (documents) |
| `apps/web/lib/backend/document.ts` | Rewrote `Document` interface (inline file fields); added `ledgerId` to query |
| `apps/web/lib/backend/session.ts` | `findAll(ledgerId?)` replaces `findAll(fiscalYear?)` |
| `apps/web/lib/backend/index.ts` | Added `LedgerClient` export + `BackendClient.ledger` property |
| `apps/web/components/ledger/LedgerListPage.tsx` | Full rewrite: `useLedgers()`, direct ledger creation with toast |
| `apps/web/components/ledger/LedgerPage.tsx` | `ledgerId` prop, `useLedger()` for title/fiscal year, document filter by `ledgerId` |
| `apps/web/components/layout/AppSidebar.tsx` | `useLedgers()` replacing session-based GL filter |
| `apps/web/components/documents/DocumentsPage.tsx` | `doc.name` / `doc.size` replacing `doc.file?.name` / `doc.file?.size` |
| `apps/web/app/(auth)/ledger/[id]/page.tsx` | `ledgerId={id}` prop (was `sessionId={id}`) |

---

## Current Build Status

- **Backend:** ✅ `nest build` — 0 errors
- **Frontend:** ✅ `next build` — 0 errors, 15 pages generated

---

## What Is Next

### Phase 4 — Tests (pending)

**4A — Backend E2E tests:**
- Ledger CRUD: POST/GET/GET:id/PATCH/DELETE with company scoping
- Unique fiscalYear constraint per company
- Document creation without File table (inline file fields)
- Session → Ledger scoping (ledgerId FK)
- AI proxy `ocrJobProcess` with ledgerId resolution

**4B — Frontend E2E tests:**
- Ledger list page: renders ledgers, create flow
- Ledger detail page: shows correct documents by ledgerId
- Document list: file name/size from inline fields

### Known Gaps to Watch
- `LedgerPage.tsx` GL status section still reads from `useGLStatus()` (not scoped by ledgerId yet — AI API integration TBD once real endpoints are available)
- Chat upload flow: `createChatSession` now accepts `ledgerId`, but the chat UI form does not yet expose ledger selection
- `Document.size` is `string` in our schema (varchar) but `formatBytes` expects a number — coerced with `Number()` in `DocumentsPage`
