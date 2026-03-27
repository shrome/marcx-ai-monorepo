<overview>
Jason is building an AI-powered accounting platform (marcx-ai-monorepo) where users open sessions, chat with AI, upload financial documents, and the AI extracts structured data. The work spans two phases: (1) iterative schema design documented in markdown files, and (2) implementation of the schema into Drizzle ORM (`schema.ts`) and fixing downstream build errors. The backend uses NestJS (`apps/backend`), the frontend uses Next.js (`apps/web`), and the DB layer is a shared package (`packages/drizzle` / `@marcx/db`).
</overview>

<history>
1. **Schema design phase** (prior checkpoint — summarised from context)
   - Designed 12-table v1 schema with multi-level company hierarchy, CompanyMember junction, Document extraction pipeline, CompanyCredit billing, ActivityLog
   - Documented in `packages/drizzle/LEDGER_SCHEMA_DESIGN.md` and `packages/drizzle/mermaid.md`
   - Dropped: `Account`, `JournalEntry`, `JournalEntryLine` (deferred to v2), `CaseInfo`, `Contact`, `AccountingPeriod`

2. **User asked to remove `Session.type` and update docs**
   - Removed `type` field and `SessionType` enum from `Session` table
   - Updated both `mermaid.md` and `LEDGER_SCHEMA_DESIGN.md`

3. **User said to proceed with schema implementation**
   - Rewrote `packages/drizzle/src/schema.ts` from scratch with all planned changes
   - Added enums: `memberRoleEnum`, `chatFeedbackEnum`, `documentTypeEnum`, `extractionStatusEnum`, `documentStatusEnum`, `creditTransactionTypeEnum`
   - Removed: `roleEnum`, `sessionTypeEnum`, `caseInfo` table
   - Modified: `Company` (+ `parentId`), `User` (- `companyId`, - `role`), `Session` (- `type`, - `priority`, + `fiscalYear`, + `summary`), `ChatMessage` (+ `metadata`, + `feedback`, + `feedbackNote`), `File` (`type` → `mimeType`)
   - Added: `CompanyMember`, `Document`, `CompanyCredit`, `CreditTransaction`, `ActivityLog`
   - Fixed `ChatSession` type rename in `apps/web`

4. **User questioned CompanyMember necessity**
   - Explained multi-company access use case
   - User said: single company per user for now → reverted `User` to have `companyId` + `role`
   - User then said: go full multi-company in schema, backend enforces single membership
   - Final state: `User` has no `companyId`/`role`; `CompanyMember` is the source of truth

5. **User asked to run `apps/backend` build**
   - Backend had many errors due to schema changes (`user.role`, `user.companyId`, `caseInfo`, `session.type` all removed)
   - Also discovered `@marcx/db` main entry (`index.ts`) was not re-exporting schema types → added `export * from "./schema"` and rebuilt package
   - Fixed `apps/web` errors along the way (pre-existing issues + our schema changes)
   - `apps/web` is now clean ✅
   - **Currently reading `auth.service.ts`** to fix `apps/backend` errors — was interrupted by compaction
</history>

<work_done>
Files created:
- `.agents/skills/db-design/SKILL.md` — db-design skill definition
- `packages/drizzle/LEDGER_SCHEMA_DESIGN.md` — full schema design doc
- `packages/drizzle/mermaid.md` — Mermaid ERD with comments, enum ref, glossary

Files modified:
- `packages/drizzle/src/schema.ts` — **full rewrite** with all new tables/enums/relations
- `packages/drizzle/src/index.ts` — added `export * from "./schema"` to expose types via `@marcx/db`
- `skills-lock.json` — registered db-design skill
- `apps/web/lib/db/mock-store.ts` — replaced `File`/`Folder` from `@marcx/db` with local mock types
- `apps/web/trpc/routers/chat.ts` — replaced DB types with local mock types; removed `@marcx/db` import
- `apps/web/trpc/routers/files.ts` — same
- `apps/web/components/cases/FileGrid.tsx` — same
- `apps/web/lib/backend/auth.ts` — removed duplicate `refreshAccessToken` override
- `apps/web/hooks/useAuthQueries.ts` — `(data as any).user`, `(backend.auth as any).refreshAccessToken()`
- `apps/web/trpc/server.ts` — fixed `createCallerFactory` using `t.createCallerFactory` with superjson

Current state:
- [x] Schema package (`packages/drizzle`) — builds and type-checks clean
- [x] `apps/web` — type-checks clean
- [ ] `apps/backend` — **still failing**, was actively being fixed when compaction occurred

`apps/backend` errors (all from our schema changes):
- `auth.service.ts` — uses `user.role`, `user.companyId`, hardcodes `role: 'COMPANY_OWNER'` (old enum)
- `case.service.ts` — uses `caseInfo` table (dropped), `session.type` (dropped)
- `session.service.ts` — uses `user.companyId`, `session.type`, `user.company` relation (now `user.memberships`)
- `company.service.ts` — uses `user.role`, `user.companyId`, `company.users` relation
- `user.service.ts` — uses `user.company` relation (now `user.memberships`)
- `chat.service.ts` — query overload errors
</work_done>

<technical_details>
- **Multi-company schema**: `User` has NO `companyId`/`role`. `CompanyMember` junction table is the source of truth (`userId FK`, `companyId FK`, `role MemberRole`). Backend currently enforces one membership per user at service layer.
- **Company hierarchy**: `Company.parentId` self-ref nullable FK. `null` = top-level/holding company.
- **`@marcx/db` export issue**: `src/index.ts` did `export * from "./client"` but `client.ts` only imports schema as `* as schema` without re-exporting. Fix: added `export * from "./schema"` to `index.ts`. Must rebuild (`pnpm build`) after any schema change for dist to update.
- **`Session`**: removed `type` (was `SessionType` enum), removed `priority`. Added `fiscalYear int nullable`, `summary text`.
- **`ChatMessage`**: added `metadata jsonb`, `feedback ChatFeedback enum nullable`, `feedbackNote text`.
- **`File`**: renamed `type` → `mimeType`.
- **`Document`**: 3 JSONB versions: `rawData` (immutable AI output), `draftData` (user edits), `approvedData` (immutable on approval). Soft-delete via `deletedAt`.
- **Old enums removed**: `roleEnum` (`ADMIN | COMPANY_USER | COMPANY_OWNER`), `sessionTypeEnum` (`CHAT | CASE`). New: `memberRoleEnum` (`OWNER | ADMIN | ACCOUNTANT | VIEWER`).
- **`caseInfo` table dropped** from schema entirely.
- **`apps/web` mock types**: `File` and `Folder` in mock-store are local types (not from schema) because mock shapes differ from DB schema (mock has `userId`, `folderId`, old `type` field).
- **`apps/web` trpc/server.ts**: `createCallerFactory` must use the same `t` instance with matching transformer (`superjson`).
- **Package rebuild required**: any change to `packages/drizzle/src/` requires `pnpm build` in that package before downstream consumers see the new types.
- **Backend `auth.service.ts`** was being read when compaction hit — it uses `role: 'COMPANY_OWNER'` (old enum value), `user.role`, `user.companyId`, all of which no longer exist on `User`.
</technical_details>

<important_files>
- `packages/drizzle/src/schema.ts`
  - The Drizzle ORM schema — fully rewritten, source of truth for all DB types
  - All new tables, enums, relations implemented
  - Key sections: enums (~line 15-55), Company+User+CompanyMember (~60-115), Session/ChatMessage/File (~120-165), Document (~168-220), Billing (~223-270), ActivityLog (~273-300), relations (~310 onwards)

- `packages/drizzle/src/index.ts`
  - Package entry point; added `export * from "./schema"` to expose types via `@marcx/db`
  - Must run `pnpm build` in `packages/drizzle` after any schema change

- `packages/drizzle/LEDGER_SCHEMA_DESIGN.md`
  - Authoritative design doc: 12-table overview, design decisions, enums, indexes, queries
  - Fully up to date with current schema

- `packages/drizzle/mermaid.md`
  - Mermaid ERD with inline field comments, enum reference, glossary
  - Fully up to date; paste into mermaid.live to visualise

- `apps/backend/src/modules/auth/auth.service.ts`
  - **Actively being fixed** — uses removed fields (`user.role`, `user.companyId`, `role: 'COMPANY_OWNER'`)
  - Needs: role info now comes from `CompanyMember`, not `User`
  - JWT payload still carries `role` but must be sourced from `companyMember` query

- `apps/backend/src/modules/case/case.service.ts`
  - Uses dropped `caseInfo` table and removed `session.type` field
  - Needs: `caseInfo` references commented out/removed; `session.type` filter removed

- `apps/backend/src/modules/session/session.service.ts`
  - Uses `user.companyId`, `session.type`, `user.company` relation
  - Needs: `companyId` from `companyMember`; `type` filter removed; relation updated to `memberships`

- `apps/backend/src/modules/company/company.service.ts`
  - Uses `user.role`, `user.companyId`, `company.users` relation (now `company.members`)
  - Needs full adaptation to `CompanyMember` pattern

- `apps/backend/src/modules/user/user.service.ts`
  - Uses `user.company` relation — now `user.memberships`

- `apps/backend/src/modules/chat/chat.service.ts`
  - Query overload errors — likely from changed `session`/`chatMessage` shapes
</important_files>

<next_steps>
Remaining work:
- Fix all `apps/backend` build errors (the primary outstanding task)

Files to fix in order:
1. `auth.service.ts` — replace `user.role`/`user.companyId` with `CompanyMember` query; change `role: 'COMPANY_OWNER'` → create `CompanyMember` record on register; update JWT payload sourcing
2. `case.service.ts` — remove all `caseInfo` references; remove `session.type` filter
3. `session.service.ts` — replace `user.companyId` with `companyMember` lookup; remove `session.type`; fix `user.company` → `user.memberships`
4. `company.service.ts` — replace `user.role`/`user.companyId` with `CompanyMember`; fix `company.users` → `company.members`
5. `user.service.ts` — fix `user.company` → `user.memberships`
6. `chat.service.ts` — fix query overload errors

Strategy: For each file, adapt DB queries to use `CompanyMember` for role/company lookups. Since backend currently enforces single membership, queries like `companyMember.findFirst({ where: eq(companyMember.userId, userId) })` replace `user.companyId`. For `caseInfo` and `session.type` — remove/comment out the functionality since those tables/fields no longer exist.
</next_steps>