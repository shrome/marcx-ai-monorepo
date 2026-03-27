<overview>
Jason is building an AI-powered multi-tenant accounting platform (marcx-ai-monorepo) with a NestJS backend, Next.js frontend, Drizzle ORM schema (shared as `@marcx/db` package), and an external Django/LangGraph AI-API. This session focused on: (1) finalising and merging the copilot instructions file, (2) refining the IMPLEMENTATION_PLAN.md (endpoint naming, coding rules, "How to Execute" section), and (3) executing Phase 1 (4 new backend modules) and starting Phase 2 (AI-API proxy layer) of the implementation plan. All work is done phase-by-phase with TypeScript checks after each phase.
</overview>

<history>
1. **Endpoint naming cleanup in IMPLEMENTATION_PLAN.md**
   - Renamed all shortform endpoints: `/ai/gl/*` → `/ai/general-ledger/*`, `/ai/coa` → `/ai/chart-of-accounts`, `/ai/rules` → `/ai/categorisation-rules`
   - Expanded `{t}` / `{d}` placeholders to `{tenantId}` / `{docId}` in Appendix A
   - Cleaned up "COA" references throughout the document (3 remaining occurrences fixed)

2. **Copilot instructions overhaul**
   - Reviewed `copilot-isntructions-old.md` (Jason's original — conversational, project-focused) and `copilot-instructions-new.md` (structured, had naming/coding rules)
   - Created merged `copilot-instructions.md` keeping the old file's "soul" (role, project status, file structure, extra notes) while adding new file's structure (naming conventions, architecture rules, error handling, S3, frontend patterns)
   - Added `@marcx/db` package explanation with exact import patterns
   - Added NestJS module structure convention (module/controller/service/dto layout)
   - Added TypeScript rules (no `any`, async/await only, no unused imports, no dead code)
   - Added Logger levels guidance (`log` vs `warn` vs `error`)
   - Added React Query rule: use `useQuery`/`useMutation` for all API calls, never `useEffect` for data fetching

3. **IMPLEMENTATION_PLAN.md additions**
   - Added Section 12 "How to Execute This Plan" with prerequisites, instructions for Jason and AI agents, key files table, phase completion checklist
   - Fixed duplicate section 9 (Data Flow was also numbered 9, renumbered to 10)
   - Updated implementation order: removed webhook step from Phase 2 (deferred to Phase 5), reordered Chat AI proxy as highest priority (Step 2.3)
   - Updated data flow diagram: replaced webhook callback with polling loop + note about Phase 5

4. **Phase 1 execution — all 7 steps completed**
   - Step 1.1: Created `activity-log` module (module, controller, service, dto) — `log()` is fire-and-forget (never throws)
   - Step 1.2: Created `billing` module — transactional top-up and usage deduction with `db.transaction()`
   - Step 1.3: Created `company-member` module — invite/role/remove with OWNER guard logic (last-owner protection)
   - Step 1.4: Created `document` module — full CRUD + approve flow + S3 upload via `FileStorageService`
   - Step 1.5: Updated `session.dto.ts` — added `fiscalYear` to `CreateSessionDto` and `CreateChatSessionDto`
   - Step 1.6: Updated `app.module.ts` — registered all 4 new modules
   - Step 1.7: Updated `chat.service.ts` — after file uploads, now auto-creates `Document` records (PENDING/DRAFT) for each file; added `Logger`; both `createMessage` and `addAttachments` updated
   - `npx tsc --noEmit` passed with zero errors after Phase 1

5. **Phase 2 started — Step 2.1 (AiApiClient + TenantResolver) in progress**
   - Created `ai-api.client.ts` — Axios wrapper with `x-tenant-id`/`x-user-id` headers, typed get/post/put/delete methods, structured error handling (distinguishes 4xx vs 5xx from AI-API), exposes `getRawInstance()` for multipart/streaming
   - Created `tenant-resolver.service.ts` — looks up first `CompanyMember` for userId, returns `{ tenantId, companyId }` (same value, both = `company.id`)
   - Created `ai-proxy.controller.ts` — full controller covering all proxy endpoints: OCR pipeline (4), document enrichment (4), general ledger (5), chat (4), chart of accounts (3), categorisation rules (2), LLM usage (2) — 24 endpoints total
   - Was writing `ai-proxy.service.ts` when compaction triggered
</history>

<work_done>
Files created:
- `apps/backend/src/modules/activity-log/activity-log.module.ts` — exports `ActivityLogService`
- `apps/backend/src/modules/activity-log/activity-log.service.ts` — `log()` + `list()` with filters/pagination
- `apps/backend/src/modules/activity-log/activity-log.controller.ts` — `GET /companies/:companyId/activity`
- `apps/backend/src/modules/activity-log/dto/activity-log.dto.ts` — `ListActivityQueryDto`
- `apps/backend/src/modules/billing/billing.module.ts` — exports `BillingService`
- `apps/backend/src/modules/billing/billing.service.ts` — `getBalance`, `topUp`, `recordUsage`, `listTransactions`
- `apps/backend/src/modules/billing/billing.controller.ts` — credit endpoints under `/companies/:companyId/credit`
- `apps/backend/src/modules/billing/dto/billing.dto.ts` — `TopUpCreditDto`, `ListTransactionsQueryDto`
- `apps/backend/src/modules/company-member/company-member.module.ts` — exports `CompanyMemberService`
- `apps/backend/src/modules/company-member/company-member.service.ts` — invite/updateRole/removeMember with guards
- `apps/backend/src/modules/company-member/company-member.controller.ts` — CRUD under `/companies/:companyId/members`
- `apps/backend/src/modules/company-member/dto/company-member.dto.ts` — `InviteMemberDto`, `UpdateMemberRoleDto`
- `apps/backend/src/modules/document/document.module.ts` — exports `DocumentService`, MulterModule 50MB limit
- `apps/backend/src/modules/document/document.service.ts` — full CRUD + approve + extraction result update
- `apps/backend/src/modules/document/document.controller.ts` — 6 endpoints including multipart upload
- `apps/backend/src/modules/document/dto/document.dto.ts` — all document DTOs + enums
- `apps/backend/src/modules/ai-proxy/ai-api.client.ts` — Axios wrapper, header injection, error handling
- `apps/backend/src/modules/ai-proxy/tenant-resolver.service.ts` — userId → companyId lookup
- `apps/backend/src/modules/ai-proxy/ai-proxy.controller.ts` — 24 proxy endpoints (COMPLETE)
- `.github/copilot-instructions.md` — new merged instructions file (CREATED)

Files modified:
- `apps/backend/src/app.module.ts` — added ActivityLogModule, BillingModule, CompanyMemberModule, DocumentModule imports
- `apps/backend/src/modules/session/dto/session.dto.ts` — added `fiscalYear` to both session DTOs
- `apps/backend/src/modules/session/session.service.ts` — `createChatSession` now accepts `CreateChatSessionDto`, stores `fiscalYear`
- `apps/backend/src/modules/chat/chat.service.ts` — auto-creates Document records on file upload, added Logger
- `IMPLEMENTATION_PLAN.md` — endpoint renames, Section 12, data flow diagram, implementation order fixes
- `packages/drizzle/LEDGER_SCHEMA_DESIGN.md` — (prior session) Design Decision #13

Work completed:
- [x] Phase 1, Step 1.1: ActivityLog module
- [x] Phase 1, Step 1.2: Billing module
- [x] Phase 1, Step 1.3: CompanyMember module
- [x] Phase 1, Step 1.4: Document module
- [x] Phase 1, Step 1.5: Session fiscalYear update
- [x] Phase 1, Step 1.6: app.module.ts registration
- [x] Phase 1, Step 1.7: Chat file upload → auto Document creation
- [x] Phase 2, Step 2.1 partial: AiApiClient, TenantResolverService, AiProxyController
- [ ] Phase 2, Step 2.1 remaining: `ai-proxy.service.ts` and `ai-proxy.module.ts` NOT YET WRITTEN
- [ ] Phase 2, Step 2.2: Chat AI proxy (replace lorem ipsum in ChatService)
- [ ] Phase 2, Steps 2.3–2.6: remaining proxy endpoints wired through service
</work_done>

<technical_details>
- **`@marcx/db` import pattern**: `import { db, eq, and, gte, lte, isNull } from '@marcx/db'` for DB client + query helpers; `import { tableName } from '@marcx/db/schema'` for table definitions. Never import drizzle directly.
- **ActivityLog fire-and-forget**: `log()` method wraps the insert in try/catch and only calls `logger.error` on failure — it never throws. This is intentional so activity logging never breaks the main request flow.
- **Billing transactions**: Uses `db.transaction(async (tx) => { ... })` for atomicity — both the CreditTransaction insert and CompanyCredit balance update happen in the same transaction.
- **CompanyCredit auto-create**: `getBalance()` auto-creates a wallet record if none exists for the company (lazy initialisation).
- **Document soft-delete**: `deletedAt` timestamp, never hard-deleted. All `findAll` and `findOne` queries include `isNull(document.deletedAt)`.
- **Document approve guard**: Checks `documentStatus` is `DRAFT` or `UNDER_REVIEW` before approving. Sets `approvedData = draftData` (immutable snapshot) and marks `postedBy`/`postedAt`.
- **Chat → Document auto-creation**: After inserting file records with `.returning()`, inserts Document rows in a single `db.insert(document).values([...])` bulk call. Both `createMessage` and `addAttachments` updated.
- **AiApiClient error handling**: Distinguishes Axios 4xx errors (re-throws as `BadGatewayException` with AI message) vs 5xx/network errors (generic "unavailable" message). Uses `axios.isAxiosError()` check.
- **TenantResolver**: `tenantId === companyId` — both are `company.id`. The AI-API `x-tenant-id` header maps directly to our `company.id`.
- **Multipart/streaming**: `AiApiClient.getRawInstance()` exposes raw Axios instance for GL upload (multipart/form-data) and GL export (binary stream).
- **MemberRole enum values**: `OWNER | ADMIN | ACCOUNTANT | VIEWER` — defined in both schema and DTO enum.
- **Last-owner protection**: `CompanyMemberService.updateRole` and `removeMember` both count remaining OWNERs and throw `BadRequestException` if action would leave company with zero owners.
- **`fiscalYear` in schema**: `integer("fiscalYear")` — nullable integer on the `Session` table. Already existed in schema, just wasn't being used in DTOs/service.
- **Webhooks are DEFERRED**: Do not implement until Jason explicitly approves after colleague discussion.
- **Case module is DEPRECATED**: `apps/backend/src/modules/case/` — do not add features.
</technical_details>

<important_files>
- `apps/backend/src/modules/ai-proxy/ai-proxy.controller.ts`
  - 24 proxy endpoints across OCR, enrichment, GL, chat, COA, rules, LLM usage
  - COMPLETE — no changes needed
  - All routes under `/ai/*` prefix

- `apps/backend/src/modules/ai-proxy/ai-api.client.ts`
  - Core Axios wrapper for all AI-API communication
  - COMPLETE — provides `get`, `post`, `put`, `delete`, `getRawInstance`
  - Error handling distinguishes 4xx vs 5xx

- `apps/backend/src/modules/ai-proxy/tenant-resolver.service.ts`
  - Maps `userId` → `companyId` (= `tenantId`) via CompanyMember lookup
  - COMPLETE — used by every proxy service method

- **MISSING: `apps/backend/src/modules/ai-proxy/ai-proxy.service.ts`**
  - NOT YET CREATED — this is where all 24 controller methods are implemented
  - Must inject `AiApiClient`, `TenantResolverService`, `DocumentService`, `BillingService`, `ActivityLogService`
  - Each method: resolve tenant → call AI-API → update our DB → return result

- **MISSING: `apps/backend/src/modules/ai-proxy/ai-proxy.module.ts`**
  - NOT YET CREATED — must import AuthModule, ActivityLogModule, BillingModule, DocumentModule, ServicesModule

- `apps/backend/src/app.module.ts`
  - Registers all NestJS modules — needs `AiProxyModule` added once created
  - Currently imports: ServicesModule, AuthModule, UserModule, CompanyModule, CaseModule, SessionModule, ChatModule, ActivityLogModule, BillingModule, CompanyMemberModule, DocumentModule

- `apps/backend/src/modules/chat/chat.service.ts`
  - Still has lorem ipsum placeholder — Phase 2 Step 2.2 will replace with real AI proxy call
  - File upload now auto-creates Document records ✅

- `IMPLEMENTATION_PLAN.md`
  - Master plan — read before any implementation
  - Phase 2 Section 5.1.4 describes the chat AI proxy flow in detail
  - Section 12 has execution instructions for agents

- `.github/copilot-instructions.md`
  - Project conventions — read before any coding
  - Contains `@marcx/db` import patterns, NestJS module structure, naming rules, error handling rules

- `packages/drizzle/src/schema.ts`
  - Source of truth for all types — 12 tables, 10+ enums
  - Key tables for Phase 2: `document`, `companyCredit`, `activityLog`, `chatMessage`
</important_files>

<next_steps>
Immediate next action — complete Phase 2 Step 2.1 by creating the two missing files:

**1. Create `ai-proxy.service.ts`**
This is the main service with all 24 methods. Key patterns:
```
each method:
  1. resolve tenant: const { tenantId } = await this.tenantResolver.resolve(userId)
  2. call AI-API: await this.aiApiClient.post('/api/...', { tenantId, userId }, body)
  3. update our DB if needed (e.g., after enrichment → DocumentService.updateExtractionResult)
  4. deduct credits if needed (BillingService.recordUsage)
  5. return AI-API response
```

Special cases:
- `enrichDocument`: after response, update Document rawData/draftData, deduct credits
- `ocrJobStatus` when COMPLETED: call `documentService.updateExtractionResult`
- `ocrJobStatus` when FAILED: call `documentService.updateExtractionFailed`
- `glExport`: returns binary (Excel) — need to pipe response stream
- `glUpload`: multipart — use `getRawInstance()` with FormData

**2. Create `ai-proxy.module.ts`**
```typescript
imports: [AuthModule, ActivityLogModule, BillingModule, DocumentModule, ServicesModule]
providers: [AiApiClient, TenantResolverService, AiProxyService]
exports: [AiApiClient, TenantResolverService]
```

**3. Register `AiProxyModule` in `app.module.ts`**

**4. Update `ChatService.createMessage` (Phase 2 Step 2.2)**
Replace `generateLoremIpsum()` with:
```
AiApiClient.post('/api/chat/sessions/{sessionId}/messages', { tenantId, userId }, { message: content })
→ store AI response in chatMessage with metadata JSONB
→ if response.waiting_for_job === true, include in metadata for frontend
```

**5. Register `AiProxyModule` in `ChatModule` so `ChatService` can inject `AiApiClient`**

**Remaining Phase 2 steps after that:**
- All proxy endpoints are already in the controller — the service just needs to implement each method
- Run `npx tsc --noEmit` after each batch to verify

**Phase 3 (Frontend Wiring) comes after Phase 2 is complete.**
</next_steps>