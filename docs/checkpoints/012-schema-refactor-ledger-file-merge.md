# Checkpoint 012 — Schema Refactor: Ledger Table + File→Document Merge

## What Was Done

### Phase 1: Schema Changes (COMPLETE)
Major schema refactoring to `packages/drizzle/src/schema.ts`:

1. **Added `ledger` table** — Dedicated GL wrapper entity (company + fiscalYear, unique per company per year). Replaces the old pattern where `Session.fiscalYear` made a session double as a GL book.
2. **Removed `file` table entirely** — Merged all File columns (`name`, `url`, `size`, `mimeType`) directly into `Document`. Added `chatId`, `ledgerId`, `uploadSource` to `Document` as well.
3. **Updated `session` table** — Removed `fiscalYear` column, added `ledgerId` FK (optional) pointing to the new `ledger` table.
4. **Expanded `chatRoleEnum`** — Added `SYSTEM` and `TOOL` roles for AI system prompts and tool-call logs.
5. **Updated all Drizzle relations** — Added `ledgerRelations`, updated `documentRelations`, `sessionRelations`, `chatMessageRelations`, removed `fileRelations`.
6. **Added type exports** — `Ledger`, `NewLedger` added; `File`, `NewFile` removed.
7. **Generated migration** — `drizzle/0005_add_ledger_merge_file_into_document.sql`

### Phase 2: Backend Changes (COMPLETE)

#### New: Ledger Module (`apps/backend/src/modules/ledger/`)
- `ledger.service.ts` — Full CRUD with unique fiscalYear validation per company
- `ledger.controller.ts` — 5 endpoints: POST, GET (list), GET (detail), PATCH, DELETE
- `dto/create-ledger.dto.ts`, `dto/update-ledger.dto.ts`
- Registered in `app.module.ts`

**Endpoints:**
```
POST   /api/ledgers           — Create ledger (validates unique fiscalYear per company)
GET    /api/ledgers           — List company ledgers (with sessions + doc counts)
GET    /api/ledgers/:id       — Get ledger detail (with sessions, documents, creator)
PATCH  /api/ledgers/:id       — Update name/description/status
DELETE /api/ledgers/:id       — Soft-delete
```

#### Updated: Document Service (`apps/backend/src/modules/document/document.service.ts`)
- Removed `file` table import and all `db.insert(file)` calls
- `create()` now inserts Document directly with `name`, `url`, `size`, `mimeType` inline
- Added optional `ledgerId` to create params and `ListDocumentsQueryDto`
- Removed all `with: { file: true }` query includes
- Queries now use `with: { session: true, ledger: true }`

#### Updated: Document DTO (`apps/backend/src/modules/document/dto/document.dto.ts`)
- `CreateDocumentDto` — added optional `ledgerId: UUID`
- `ListDocumentsQueryDto` — added optional `ledgerId: UUID` filter

#### Updated: Chat Service (`apps/backend/src/modules/chat/chat.service.ts`)
- Removed `file` import from `@marcx/db/schema`
- `createMessage()` — creates Documents directly with inline file fields (no File table insert)
- `addAttachments()` — same pattern; documents now linked to `chatId` and `ledgerId` from session
- Message queries changed: `with: { files: true }` → `with: { documents: true }`

#### Updated: Session Module (`apps/backend/src/modules/session/`)
- `session.service.ts` — Complete rewrite:
  - `create()` / `createChatSession()`: removed `fiscalYear`, added optional `ledgerId`
  - `findAll()`: filter by `ledgerId` instead of `fiscalYear`
  - `findOne()`: `with: { files: true }` → `with: { documents: true, ledger: true }`
- `session.controller.ts`: `@Query('fiscalYear')` → `@Query('ledgerId')`
- `dto/session.dto.ts`: replaced `IsInt + Min(2000) fiscalYear` with `@IsUUID() ledgerId` in both `CreateChatSessionDto` and `CreateSessionDto`

#### Fixed: Deprecated Case Module (`apps/backend/src/modules/case/case.service.ts`)
- Removed `file` import
- Changed `db.insert(file)` calls to `db.insert(document)` with inline file fields
- This is a deprecated module — no new features, just keeping it compilable.

## Bugs Fixed

| File | Root Cause | Fix |
|------|-----------|-----|
| `session.service.ts` | Had duplicate class definition (old code appended below new) | Rewrote file cleanly |
| `session.dto.ts` | Same duplicate issue — edit only replaced import, old classes remained | Rewrote file cleanly |
| `document.service.ts` | Same duplicate issue — edit prepended new class, old remained at line 235 | Truncated at line 233 |
| `ledger.controller.ts` | Wrong import paths for `JwtAuthGuard` and `RequestWithUser` | Changed to `AuthGuard` from `'../auth/guards/auth.guard'`, defined `RequestWithUser` inline |
| `case.service.ts` | Referenced deleted `file` table; used `files` relation that no longer exists | Replaced with `document` inserts; removed `files` from `with` clause |

## Files Created

| File | Description |
|------|-------------|
| `apps/backend/src/modules/ledger/ledger.module.ts` | NestJS module |
| `apps/backend/src/modules/ledger/ledger.controller.ts` | 5 REST endpoints |
| `apps/backend/src/modules/ledger/ledger.service.ts` | Business logic with unique FY validation |
| `apps/backend/src/modules/ledger/dto/create-ledger.dto.ts` | Create DTO |
| `apps/backend/src/modules/ledger/dto/update-ledger.dto.ts` | Update DTO |
| `packages/drizzle/drizzle/0005_add_ledger_merge_file_into_document.sql` | Migration SQL |

## Files Modified

| File | Change |
|------|--------|
| `packages/drizzle/src/schema.ts` | Added `ledger` table, removed `file` table, updated `document`, updated `session`, expanded `chatRoleEnum`, updated all relations |
| `apps/backend/src/app.module.ts` | Added `LedgerModule` |
| `apps/backend/src/modules/document/document.service.ts` | Removed File creation, inline file fields in Document |
| `apps/backend/src/modules/document/dto/document.dto.ts` | Added `ledgerId` to CreateDocumentDto and ListDocumentsQueryDto |
| `apps/backend/src/modules/chat/chat.service.ts` | Removed `file` import/inserts; create Document directly |
| `apps/backend/src/modules/session/session.service.ts` | ledgerId instead of fiscalYear; updated relations |
| `apps/backend/src/modules/session/session.controller.ts` | `ledgerId` query param |
| `apps/backend/src/modules/session/dto/session.dto.ts` | ledgerId UUID field replaces fiscalYear |
| `apps/backend/src/modules/case/case.service.ts` | Removed file table usage (deprecated module) |

## Test Status

- Backend builds: ✅ 0 TypeScript errors
- Backend E2E tests: ⚠️ Not re-run yet (migration not applied to dev DB yet)
- Frontend: Not yet updated (Phase 3 pending)
- Migration: Generated but **not yet applied** to dev DB

## Key Architecture Mapping

```
Our Schema               ↔  AI API
--------------------------------------
Ledger.id                ↔  ledger_scope_id
Ledger.companyId         ↔  tenant_id
Ledger.fiscalYear        ↔  fiscal_year
Session.id               ↔  session_id (chat context)
Document.id              ↔  doc_id / external_file_id
Company.id               ↔  tenant_id
```

**Ledger hierarchy:**
```
Ledger (GL book — company + fiscal year)
├── Sessions (chat threads, optional link via ledgerId)
│   └── ChatMessages
└── Documents (uploaded files + AI extraction, link via ledgerId)
    └── rawData, draftData, approvedData
```

## What Is Next

### Priority 1: Apply Migration
```bash
cd packages/drizzle && pnpm drizzle-kit push
```

### Priority 2: Phase 3 — Frontend
- `3a`: Update types in `lib/backend/types.ts` (add `Ledger`, update `Document` / `Session`)
- `3b`: Create `lib/backend/ledger.ts` (`LedgerClient`) + `hooks/useLedgerQueries.ts`
- `3c`: Update `/ledger` page to list/create Ledgers (not Sessions)
- `3d`: Update `/ledger/[id]` page to use `ledgerId`, fetch ledger detail
- `3e`: Update `DocumentsPage` — remove `doc.file?.name` → use `doc.name`
- `3f`: Update chat components — `files` → `documents`
- `3g`: Update `AppSidebar` — dynamic ledger children

### Priority 3: Phase 2E — AI Proxy Update
- Update `ai-proxy.service.ts` to resolve `fiscalYear` from `ledger` table via `ledgerId` param
- Pass `ledgerId` as `ledger_scope_id` to AI API

### Priority 4: Phase 4 — Tests
- Backend E2E tests for Ledger CRUD
- Backend E2E tests for Document (no File table)
- Frontend E2E for ledger pages

## Session Plan Status

See `/Users/jasonteh/.copilot/session-state/a1740f50-8026-48da-97b7-242e2a109faf/plan.md` for full plan.

SQL todos status: Phases 1 + 2A-2D done (10/18), 2E + Phase 3 + Phase 4 pending.
