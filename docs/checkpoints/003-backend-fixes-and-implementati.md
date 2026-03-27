<overview>
Jason is building an AI-powered accounting platform (marcx-ai-monorepo) with NestJS backend, Next.js frontend, Drizzle ORM schema, and an external Django/LangGraph AI-API. This session focused on two main efforts: (1) fixing all backend build errors caused by schema changes made in prior sessions (removing `user.role`, `user.companyId`, `caseInfo` table, `session.type`, `session.priority`, renaming `file.type` → `file.mimeType`), and (2) creating a comprehensive implementation plan (`IMPLEMENTATION_PLAN.md`) that maps out all backend APIs, AI-API proxy integration, frontend wiring, and testing phases. No implementation of the plan has begun — Jason wants the plan finalized before any coding starts.
</overview>

<history>
1. **Resumed fixing backend build errors** (continuing from prior compacted session)
   - Ran `npx tsc --noEmit` on `apps/backend` — found errors across 6 service files
   - Read all 6 affected files: auth.service.ts, company.service.ts, session.service.ts, case.service.ts, chat.service.ts, user.service.ts
   - Fixed each file systematically:
     - `auth.service.ts`: Removed `role` from user insert, fetched memberships to get role/companyId for JWT and response objects
     - `company.service.ts`: Replaced `user.companyId` update with `companyMember` insert on register, changed `company.users` → `company.members` with nested user
     - `session.service.ts`: Changed `user.company` → `user.memberships`, removed `type`/`priority` from session inserts/queries
     - `session.dto.ts`: Removed `type` and `priority` fields
     - `session.controller.ts`: Removed `type` query param from `findAll`, cleaned up unused `Query` import
     - `case.service.ts` + `case.dto.ts`: Removed all `caseInfo` references, removed `session.type`/`priority`, changed `file.type` → `file.mimeType`
     - `chat.service.ts`: Changed `file.type` → `file.mimeType` in two places
     - `user.service.ts`: Changed `user.company` → `user.memberships`
   - Final `npx tsc --noEmit` passed with **zero errors** ✅

2. **Jason asked about `Session.creatorId` — should it link to `User` or `CompanyMember`?**
   - Advised keeping `creatorId → User` (not CompanyMember) because:
     - Session already has `companyId` for company context
     - User identity is permanent; CompanyMember can be deleted/changed
     - Role at query time via JOIN on CompanyMember
   - Jason agreed, asked to update docs

3. **Updated design docs with `creatorId` rationale**
   - Added Design Decision #13 to `LEDGER_SCHEMA_DESIGN.md`
   - Annotated `creatorId` field in `mermaid.md` ERD

4. **Jason requested comprehensive implementation plan**
   - Asked to study: GitHub instructions, schema, frontend, backend, ai-api
   - Write into md file for future model execution
   - No code changes — planning phase only
   - Launched 4 parallel explore agents: schema/docs, backend, frontend, ai-api
   - Also explored design folder and .github/copilot-instructions.md
   - Gathered complete understanding of all 60+ AI-API endpoints, all backend modules, all frontend pages/routes

5. **Wrote `IMPLEMENTATION_PLAN.md`**
   - Comprehensive 4-phase plan covering:
     - Phase 1: Backend API completion (5 new modules)
     - Phase 2: AI-API integration (proxy layer)
     - Phase 3: Frontend wiring
     - Phase 4: Testing
   - Included data flow diagrams, endpoint mappings, DTOs, service methods

6. **Jason provided updated instructions and feedback**
   - Updated `.github/copilot-instructions.md` with: S3 explicitly mentioned, error handling emphasis, tenant=company note
   - **Case module is DEPRECATED** — remove from plan
   - Confirmed AI-API chat integration is already in plan (Phase 2, Section 5.1.4)
   - **Webhooks DEFERRED** to Phase 5, pending colleague discussion
   - Asked what he needs to do for next model to execute

7. **Updated `IMPLEMENTATION_PLAN.md` with all feedback**
   - Added "Key Conventions" section (tenant=company, Case deprecated, webhooks deferred, error handling emphasis)
   - Moved webhooks from Phase 2 to new Phase 5 (DEFERRED — Pending Approval)
   - Marked Case module as ⛔ DEPRECATED throughout
   - Made AI-API chat integration more prominent (marked as #1 integration priority)
   - Updated TOC, removed webhook references from Phase 4 testing
   - Was about to add "How to Execute" section (Section 12) when compaction triggered
</history>

<work_done>
Files modified:
- `apps/backend/src/modules/auth/auth.service.ts` — Added `companyMember` import; removed `role: 'COMPANY_OWNER'` from user insert; fetch `memberships` with user queries; source role/companyId from `membership[0]` in both `verifyRegistrationOtp` and `verifyLoginOtp`
- `apps/backend/src/modules/company/company.service.ts` — Changed import from `user` to `companyMember`; replaced `user.companyId` update with `companyMember` insert in `register`; `company.users` → `company.members` with nested user in all queries
- `apps/backend/src/modules/session/session.service.ts` — `user.company` → `user.memberships`; removed `type`/`priority` from all session inserts; removed type filter from `findAll`
- `apps/backend/src/modules/session/dto/session.dto.ts` — Removed `type` and `priority` fields from `CreateSessionDto` and `UpdateSessionDto`
- `apps/backend/src/modules/session/session.controller.ts` — Removed `type` query param from `findAll`; removed unused `Query` import
- `apps/backend/src/modules/case/case.service.ts` — Removed `caseInfo` import and all references; removed `session.type`/`priority`; `file.type` → `file.mimeType`
- `apps/backend/src/modules/case/dto/case.dto.ts` — Removed `clientName` and `priority` fields
- `apps/backend/src/modules/chat/chat.service.ts` — `file.type` → `file.mimeType` in two file insert locations
- `apps/backend/src/modules/user/user.service.ts` — `user.company` → `user.memberships` in both `findOne` and `findByEmail`
- `packages/drizzle/LEDGER_SCHEMA_DESIGN.md` — Added Design Decision #13 (creatorId → User rationale)
- `packages/drizzle/mermaid.md` — Annotated `creatorId` field with audit trail comment
- `IMPLEMENTATION_PLAN.md` — **Created** comprehensive implementation plan, then updated with Jason's feedback (Case deprecated, webhooks deferred to Phase 5, tenant=company convention, error handling emphasis)

Work completed:
- [x] All backend build errors fixed — `npx tsc --noEmit` passes with 0 errors
- [x] Design docs updated with creatorId rationale
- [x] Comprehensive implementation plan written
- [x] Plan updated with Jason's feedback (Case deprecated, webhooks deferred, conventions added)
- [ ] "How to Execute This Plan" section (Section 12) — NOT YET WRITTEN in IMPLEMENTATION_PLAN.md

Current state:
- `packages/drizzle` — builds clean ✅
- `apps/web` — type-checks clean ✅
- `apps/backend` — type-checks clean ✅
- `IMPLEMENTATION_PLAN.md` — mostly complete, missing Section 12 "How to Execute"
</work_done>

<technical_details>
- **Multi-company schema pattern**: `User` has NO `companyId` or `role`. `CompanyMember` junction table is the source of truth with `userId FK`, `companyId FK`, `role MemberRole`. Backend enforces single membership per user at service layer. To get a user's company: `companyMember.findFirst({ where: eq(companyMember.userId, userId) })`.
- **Tenant = Company mapping**: AI-API uses `x-tenant-id` header which maps to our `company.id`. When proxying requests, the NestJS backend resolves `tenantId` from the user's `CompanyMember` record.
- **Session.creatorId → User (not CompanyMember)**: Design Decision #13. Rationale: membership records can be deleted, but the audit trail of who created a session must persist. Company context comes from `session.companyId`.
- **Case module is DEPRECATED**: `apps/backend/src/modules/case/` still exists and compiles but is no longer in the product roadmap. Do not add features to it.
- **File.type was renamed to File.mimeType** in schema. All backend code updated.
- **`@marcx/db` package rebuild required**: Any change to `packages/drizzle/src/` requires `pnpm build` in that package before downstream consumers (`apps/backend`, `apps/web`) see new types. The `src/index.ts` has `export * from "./schema"` to expose all types.
- **AI-API is Django 5 + DRF**: 60+ endpoints, uses LangGraph for chat agent, PaddleOCR for document extraction. No auth layer — our backend handles all auth and passes `x-tenant-id` + `x-user-id` headers.
- **Chat is currently lorem ipsum**: `ChatService.createMessage` generates random lorem text. Phase 2 replaces this with real AI-API proxy calls to `POST /api/chat/sessions/{session_id}/messages`.
- **Document extraction lifecycle**: File upload → Document record (PENDING) → AI extraction → rawData (immutable) → draftData (mutable copy for user review) → approvedData (immutable on approval). Three JSONB fields handle the review lifecycle.
- **Credit-based billing**: `CompanyCredit` (one wallet per company, cached balance) + `CreditTransaction` (append-only ledger). Balance updated transactionally on every insert.
- **Webhooks are DEFERRED**: Jason wants to discuss callback design with colleagues. Phases 1-4 work via synchronous proxy calls or polling. Webhook endpoints documented in Phase 5 but blocked on Jason's approval.
- **Frontend has dual API layers**: tRPC (for some procedures like auth, chat mock) AND Axios REST client (`lib/backend/`) for NestJS backend. Both coexist.
- **Design assets**: PNG mockups in `/design/` folder — ask_pio_page, ledger pages, chat-bar, header, sidebar, table_example.
- **MemberRole enum values**: `OWNER | ADMIN | ACCOUNTANT | VIEWER` (replaced old `ADMIN | COMPANY_USER | COMPANY_OWNER`).
</technical_details>

<important_files>
- `IMPLEMENTATION_PLAN.md` (repo root)
  - **The master plan** for all remaining work — 4 active phases + 1 deferred
  - Created in this session, updated with Jason's feedback
  - Missing Section 12 "How to Execute This Plan"
  - ~900 lines covering: current state, gap analysis, architecture, all new modules/endpoints/DTOs/services, AI-API proxy mapping, frontend wiring, testing, data flow diagrams

- `packages/drizzle/src/schema.ts`
  - Source of truth for all DB types — 12 tables, 10+ enums, 12 relation definitions
  - Fully rewritten in prior session; no changes this session
  - Key sections: enums (~15-55), Company/User/CompanyMember (~60-115), Session/ChatMessage/File (~120-165), Document (~168-220), Billing (~223-270), ActivityLog (~273-300), relations (~310+)

- `packages/drizzle/LEDGER_SCHEMA_DESIGN.md`
  - Design doc with 13 design decisions, table overview, enum reference
  - Updated: added Design Decision #13 (creatorId → User rationale)

- `packages/drizzle/mermaid.md`
  - Mermaid ERD with field comments, enum reference, glossary
  - Updated: annotated creatorId field

- `.github/copilot-instructions.md`
  - Project instructions for AI agents — updated by Jason with S3, error handling, tenant=company notes
  - Must be read by any agent before executing work

- `ai-api/BACKEND_API_GUIDE.md`
  - Complete AI-API endpoint catalog (60+ endpoints) — the "other side" of the proxy integration
  - Key sections: OCR pipeline (4.2), Chat API (4.10), GL management (4.4), Document enrichment (4.7)
  - Data flow sequences (Section 5) document the end-to-end OCR→GL and enrichment flows

- `apps/backend/src/modules/auth/auth.service.ts`
  - Fixed in this session — removed user.role/companyId, now uses CompanyMember for role resolution
  - JWT payload carries role from first membership

- `apps/backend/src/modules/chat/chat.service.ts`
  - Fixed file.type → file.mimeType
  - **Key target for Phase 2**: currently returns lorem ipsum, will be refactored to proxy to AI-API

- `apps/backend/src/modules/company/company.service.ts`
  - Fixed in this session — register now creates CompanyMember instead of updating user.companyId
  - Uses `company.members` relation with nested user

- `apps/backend/src/modules/session/session.service.ts`
  - Fixed — uses memberships, removed type/priority
  - **Phase 1 target**: needs fiscalYear support added to createChatSession
</important_files>

<next_steps>
Remaining work on the plan document:
- Write Section 12 "How to Execute This Plan" in IMPLEMENTATION_PLAN.md — instructions for Jason on how to trigger execution (approve plan, switch out of plan mode, which phase to start, how to give the go-ahead)
- Jason needs to review the plan and confirm before any coding begins

After plan approval, execution order:
1. **Phase 1: Backend API Completion** — 7 steps:
   - Step 1.1: ActivityLog module (no deps)
   - Step 1.2: Billing module (CompanyCredit + CreditTransaction)
   - Step 1.3: CompanyMember module
   - Step 1.4: Document module (the biggest new module)
   - Step 1.5: Update Session module (fiscalYear)
   - Step 1.6: Update Chat module (feedback fields)
   - Step 1.7: Update File upload flow (auto-create Document)

2. **Phase 2: AI-API Integration** — 8 steps:
   - Step 2.1: AiApiClient shared service
   - Step 2.2: TenantResolver service
   - Step 2.3-2.7: AI proxy endpoints (OCR, enrichment, GL, Chat AI, tenant management)
   - Step 2.8: Credit deduction integration

3. **Phase 3: Frontend Wiring** — 7 steps (new client classes, page-by-page wiring, UX polish)

4. **Phase 4: Testing** — unit + integration tests

5. **Phase 5: Webhooks** — BLOCKED on Jason's approval after colleague discussion

Immediate next action:
- Complete Section 12 of IMPLEMENTATION_PLAN.md
- Ask Jason to review and approve the final plan
</next_steps>