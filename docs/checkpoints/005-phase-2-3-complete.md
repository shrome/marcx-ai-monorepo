<overview>
Jason is building a multi-tenant AI-powered accounting platform (marcx-ai-monorepo) with a NestJS backend, Next.js frontend, shared `@marcx/db` Drizzle ORM package, and an external Django/LangGraph AI-API. The session focused on executing the IMPLEMENTATION_PLAN.md phase by phase: Phase 1 (4 new backend modules), Phase 2 (AI-API proxy layer), and Phase 3 (frontend wiring — new API clients, React Query hooks, and wired pages). All implementation follows the copilot-instructions.md coding conventions.
</overview>

<history>
1. **Resuming from checkpoint** — Phase 1 was complete, Phase 2 was partially done (AiApiClient, TenantResolverService, AiProxyController created; `ai-proxy.service.ts` and `ai-proxy.module.ts` were missing)

2. **Completing Phase 2 (AI Proxy Layer)**
   - Created `ai-proxy.service.ts` — 24 methods covering OCR, enrichment, GL, chat, chart of accounts, categorisation rules, LLM usage. Each method: resolve tenant → call AI-API → return result
   - Created `ai-proxy.module.ts` — imports AuthModule, provides AiApiClient + TenantResolverService + AiProxyService, exports all three
   - Registered `AiProxyModule` in `app.module.ts`
   - Updated `chat.service.ts` — replaced lorem ipsum placeholder with real `aiProxyService.sendChatMessage()` call; graceful fallback if AI-API is down; AI metadata stored in `chatMessage.metadata` JSONB; also injected `AiProxyService` via constructor
   - Updated `chat.module.ts` — added AiProxyModule + ServicesModule imports
   - Added `axios` as direct dependency to backend (it was only a transitive dep before)
   - TypeScript check: 0 errors ✅

3. **Executing Phase 3 (Frontend Wiring)**
   - Created 5 new backend client classes in `lib/backend/`:
     - `document.ts` — DocumentClient (upload, findAll, findOne, updateDraft, approve, remove)
     - `billing.ts` — BillingClient (getBalance, topUp, listTransactions)
     - `activity.ts` — ActivityClient (list)
     - `member.ts` — MemberClient (list, invite, updateRole, remove)
     - `ai.ts` — AiClient (OCR, enrichment, GL, chart of accounts, categorisation rules, LLM usage) — exposes raw `client` via inherited protected field for blob export
   - Updated `lib/backend/index.ts` — exported all new clients + types, added them all to `BackendClient` constructor
   - Created 4 new React Query hook files in `hooks/`:
     - `useDocumentQueries.ts`
     - `useBillingQueries.ts`
     - `useMemberQueries.ts`
     - `useAiQueries.ts` — includes `useOcrStatus` with auto-polling (3s interval while PENDING/PROCESSING)
   - Rewrote `DocumentsPage.tsx` — now wired to real backend (useDocuments, useUploadDocument, useDeleteDocument, useTriggerOcr); shows real document list with ExtractionStatus + DocumentStatus badges; auto-triggers OCR after upload
   - Updated `LedgerPage.tsx` — wired to `useGLStatus`, `useGLTransactions`, `useExportGL`, `useUploadGL`; added GL upload modal; added Export button; shows GL status pill; converts real GLTransaction data to LedgerRow format; keeps existing UI/mock data as fallback
   - Created `components/settings/SettingsPage.tsx` — 4 tabs: Company (read-only info), Members (invite/role/remove), Usage (LLM tokens/cost), Chart of Accounts (table view); all wired to real backend hooks
   - Replaced `app/(auth)/settings/page.tsx` stub (was ComingSoonPage) with real SettingsPage
   - Updated `ProfilePage.tsx` — added credit balance display with `useCreditBalance`, recent transactions with `useCreditTransactions`, replaced "Company ID" raw field with company name
</history>

<work_done>
Files created (backend):
- `apps/backend/src/modules/ai-proxy/ai-proxy.service.ts` — 24-method service, all proxy logic
- `apps/backend/src/modules/ai-proxy/ai-proxy.module.ts` — NestJS module wiring

Files modified (backend):
- `apps/backend/src/app.module.ts` — added AiProxyModule
- `apps/backend/src/modules/chat/chat.service.ts` — real AI chat response, removed lorem ipsum
- `apps/backend/src/modules/chat/chat.module.ts` — imports AiProxyModule + ServicesModule
- `apps/backend/package.json` — added `axios` as direct dependency

Files created (frontend):
- `apps/web/lib/backend/document.ts` — DocumentClient
- `apps/web/lib/backend/billing.ts` — BillingClient
- `apps/web/lib/backend/activity.ts` — ActivityClient
- `apps/web/lib/backend/member.ts` — MemberClient
- `apps/web/lib/backend/ai.ts` — AiClient
- `apps/web/hooks/useDocumentQueries.ts`
- `apps/web/hooks/useBillingQueries.ts`
- `apps/web/hooks/useMemberQueries.ts`
- `apps/web/hooks/useAiQueries.ts`
- `apps/web/components/settings/SettingsPage.tsx` — new full settings page

Files modified (frontend):
- `apps/web/lib/backend/index.ts` — added all new client exports + BackendClient fields
- `apps/web/components/documents/DocumentsPage.tsx` — fully rewired to real backend
- `apps/web/components/ledger/LedgerPage.tsx` — wired GL data + upload/export + status pill
- `apps/web/components/profile/ProfilePage.tsx` — added credit balance + transactions
- `apps/web/app/(auth)/settings/page.tsx` — replaced stub with real SettingsPage

Work completed:
- [x] Phase 2.1: AiApiClient + TenantResolverService
- [x] Phase 2.2: Chat AI proxy (lorem ipsum replaced)
- [x] Phase 2.3–2.6: All proxy endpoints (controller + service + module)
- [x] Phase 3: Backend client classes (document, billing, activity, member, ai)
- [x] Phase 3: React Query hooks for all new clients
- [x] Phase 3: DocumentsPage wired to real backend
- [x] Phase 3: LedgerPage wired to GL API data
- [x] Phase 3: SettingsPage (Members, Usage, Chart of Accounts)
- [x] Phase 3: ProfilePage credit balance + transactions
- [ ] Phase 3: TypeScript check on frontend NOT yet run after latest changes
- [ ] Phase 4: Backend unit tests
- [ ] Phase 5: Webhooks (deferred — needs Jason's approval)
</work_done>

<technical_details>
- **`@marcx/db` import pattern**: `import { db, eq, and } from '@marcx/db'` for client+helpers; `import { tableName } from '@marcx/db/schema'` for table definitions. Never import drizzle directly.
- **tenantId === companyId**: The AI-API `x-tenant-id` header maps directly to `company.id`. `TenantResolverService` looks up the first `CompanyMember` for the userId to get `companyId`.
- **AiApiClient error handling**: Distinguishes Axios 4xx (re-throws with AI message as `BadGatewayException`) vs 5xx/network (generic "unavailable"). Uses `axios.isAxiosError()`.
- **axios was a transitive dep only** — had to add it explicitly to backend's `package.json` to fix TS2307 error.
- **Chat AI fallback**: `chat.service.ts` wraps `aiProxyService.sendChatMessage()` in try/catch — if AI-API is down, returns a "try again" message and still saves it as an ASSISTANT message. AI metadata (intent, citations, GL result, `waiting_for_job`) is spread into the `metadata` JSONB field.
- **AiClient blob export**: `exportGL()` uses the inherited `protected client: AxiosInstance` from `Backend` base class directly with `responseType: 'blob'`. This is valid because `client` is `protected` not `private`.
- **useOcrStatus auto-polling**: Uses TanStack Query `refetchInterval` as a function — polls every 3s while status is PENDING or PROCESSING, stops when COMPLETED or FAILED.
- **LedgerPage approach**: Real GL data (`useGLTransactions`) is converted from numeric GLTransaction objects to string-based LedgerRow format for the existing table component. If no real data, falls back to BOOKS_DATA mock. The Tasks tab still uses MOCK_TASKS (not yet wired to documents).
- **DocumentsPage upload flow**: Upload → `POST /documents` (backend handles S3) → backend auto-creates Document record → frontend calls `triggerOcr.mutate(doc.id)` to kick off extraction.
- **Webhooks deferred**: Do NOT implement until Jason explicitly approves after colleague discussion. Phase 5 only.
- **Case module deprecated**: `apps/backend/src/modules/case/` — do not add features.
- **MemberRole enum**: `OWNER | ADMIN | ACCOUNTANT | VIEWER`
- **Last-owner protection**: CompanyMemberService prevents removing/downgrading the last OWNER — throws `BadRequestException`.
- **`fiscalYear` on Session**: `integer("fiscalYear")` — nullable integer, already in schema, now in DTOs.
- **BackendClient singleton**: `getBackendClient()` returns a singleton; `createBackendClient()` creates a new instance. Hooks use `createBackendClient()` at module level (fine for client components).
- **`user?.company`** — the `AuthResponse` user object includes a nested `company` object. ProfilePage now reads `user?.company?.name` directly.
</technical_details>

<important_files>
- `apps/backend/src/modules/ai-proxy/ai-proxy.service.ts`
  - Core of Phase 2 — all 24 proxy methods
  - Each: resolve tenant → call AI-API → return result
  - Injected: AiApiClient, TenantResolverService

- `apps/backend/src/modules/ai-proxy/ai-proxy.module.ts`
  - Wires AiApiClient, TenantResolverService, AiProxyService
  - Exports all three for use in ChatModule etc.

- `apps/backend/src/modules/ai-proxy/ai-api.client.ts`
  - Axios wrapper — get/post/put/delete + getRawInstance() for multipart/blob
  - Injects `x-tenant-id` + `x-user-id` headers on every request

- `apps/backend/src/modules/ai-proxy/tenant-resolver.service.ts`
  - Maps userId → companyId via CompanyMember lookup
  - tenantId === companyId (same value)

- `apps/backend/src/modules/chat/chat.service.ts`
  - Now calls `aiProxyService.sendChatMessage()` — real AI responses
  - Stores AI metadata in `chatMessage.metadata` JSONB
  - Graceful fallback if AI-API unreachable

- `apps/backend/src/app.module.ts`
  - Registers all modules: ServicesModule, AuthModule, UserModule, CompanyModule, CaseModule, SessionModule, ChatModule, ActivityLogModule, BillingModule, CompanyMemberModule, DocumentModule, AiProxyModule

- `apps/web/lib/backend/index.ts`
  - Exports all 11 clients; BackendClient has: auth, user, case, chat, company, session, document, billing, activity, member, ai

- `apps/web/lib/backend/ai.ts`
  - AiClient — all AI-API proxy endpoints callable from frontend via backend
  - exportGL uses `this.client` (inherited protected AxiosInstance) with `responseType: 'blob'`

- `apps/web/hooks/useAiQueries.ts`
  - All AI React Query hooks including `useOcrStatus` (auto-polls 3s) and `useExportGL` (returns Blob)

- `apps/web/components/documents/DocumentsPage.tsx`
  - Fully rewired — real document list + upload + delete + OCR trigger
  - Shows ExtractionStatusBadge + DocumentStatusBadge per document

- `apps/web/components/ledger/LedgerPage.tsx`
  - Wired to real GL data; added GL upload modal + export button + status pill
  - 680+ lines — GLUploadModal is inline component using useDropzone
  - Tasks tab still uses MOCK_TASKS

- `apps/web/components/settings/SettingsPage.tsx`
  - New file — 4 tabs: Company, Members (invite/role/remove), Usage (LLM), Chart of Accounts
  - Members tab uses InviteMember + UpdateMemberRole + RemoveMember mutations

- `apps/web/components/profile/ProfilePage.tsx`
  - Updated — shows credit balance + 5 recent transactions with useCreditBalance + useCreditTransactions

- `IMPLEMENTATION_PLAN.md`
  - Master reference — read before implementing anything
  - Phase 4 = Backend tests; Phase 5 = Webhooks (deferred)

- `.github/copilot-instructions.md`
  - Project conventions — @marcx/db imports, NestJS module structure, naming, error handling, React Query rule (no useEffect for data fetching)
</important_files>

<next_steps>
Remaining work:
- [ ] **Run frontend TypeScript check** — `cd apps/web && npx tsc --noEmit` — verify Phase 3 changes compile clean
- [ ] **Phase 4: Backend unit tests** — DocumentService, BillingService, CompanyMemberService, ActivityLogService, AiApiClient, TenantResolver
- [ ] **Phase 4: Integration tests** — full document lifecycle, chat with AI, credit flow, member management, GL operations
- [ ] **Phase 5: Webhooks** — deferred until Jason approves with colleague
- [ ] **Tasks tab in LedgerPage** — currently still uses MOCK_TASKS; should wire to `useDocuments` to show real processed documents

Immediate next action:
1. Run `cd apps/web && npx tsc --noEmit` to verify no TypeScript errors from Phase 3 frontend changes
2. Fix any TS errors (likely: unused imports, type mismatches in LedgerPage `useCallback` import, `documents` variable)
3. Then proceed to Phase 4 (testing) or ask Jason what to tackle next
</next_steps>