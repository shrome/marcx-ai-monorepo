# Checkpoint 011 — Phase 5 & 6 Complete: Invitation + Session=GL Alignment

## Date
Current session

## What Was Done

### Phase 5 — Invitation Feature (COMPLETE)

**A1: Schema — `invitation` table**
- Added `invitationStatusEnum` pgEnum: `["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"]`
- Added `invitation` pgTable with: id, companyId, email, role, invitedBy, token (unique), status, expiresAt, acceptedAt, timestamps
- Added `invitationRelations` (→ company, → user via invitedBy)
- Added `Invitation`, `NewInvitation` type exports
- Added `invitations: many(invitation)` to `companyRelations`
- Migration generated: `packages/drizzle/drizzle/0004_daffy_kat_farrell.sql`
- `packages/drizzle` built and TypeScript clean ✅

**A2: Backend — Invitation module**
- Created `apps/backend/src/modules/invitation/invitation.module.ts`
- Created `apps/backend/src/modules/invitation/invitation.controller.ts`
  - `POST /companies/:companyId/invitations` — create (OWNER/ADMIN only)
  - `GET /companies/:companyId/invitations` — list pending
  - `DELETE /companies/:companyId/invitations/:id` — revoke (OWNER/ADMIN only)
  - `GET /invitations/:token` — get by token (public)
  - `POST /invitations/:token/accept` — accept (auth required)
- Created `apps/backend/src/modules/invitation/invitation.service.ts`
  - Full business logic: create (with duplicate check, email send), list, getByToken (with expiry check), accept (creates CompanyMember), revoke
  - Uses `EmailService.sendEmail()` for invitation emails
- Created `apps/backend/src/modules/invitation/dto/invitation.dto.ts`
- Added `sendEmail()` generic method to `apps/backend/src/services/email.service.ts`
- Registered `InvitationModule` in `apps/backend/src/app.module.ts`
- Backend TypeScript: **0 errors** ✅

**A3: Frontend — Invitation UI**
- Created `apps/web/lib/backend/invitation.ts` — `InvitationClient` with create/list/revoke/getByToken/accept
- Registered `InvitationClient` in `apps/web/lib/backend/index.ts` (added to `BackendClient`)
- Created `apps/web/hooks/useInvitationQueries.ts` — hooks: `useInvitations`, `useInvitationByToken`, `useCreateInvitation`, `useRevokeInvitation`, `useAcceptInvitation`
- Created `apps/web/app/invitations/[token]/page.tsx` — route page
- Created `apps/web/components/auth/AcceptInvitationPage.tsx` — full UI:
  - Shows company name, role, inviter info, expiry date
  - Logged-in user: "Accept Invitation" button → calls accept API → redirect to `/`
  - Not logged in: "Create Account & Accept" → `/register?invitation=<token>`, "Log In & Accept" → `/login?redirect=...`
  - Handles loading/error/expired states

---

### Phase 6 — Session=GL Alignment (COMPLETE)

**B1: Backend — Session scoping fix**
- Fixed `session.service.ts` `findAll(userId, fiscalYear?)`:
  - Now resolves user's `companyId` from `companyMember` table
  - Queries `WHERE companyId = X` (not `WHERE creatorId = userId`)
  - Supports optional `fiscalYear` filter
- Fixed `session.service.ts` `findOne(id, userId)`:
  - Validates user's company matches session's `companyId` (not creator check)
  - All company members can now see all company sessions
- Updated `session.controller.ts`:
  - Added `@Query('fiscalYear')` param support
  - Added `ApiQuery` decorator for Swagger docs

**B2: Backend — AI proxy sessionId passthrough**
- Updated `ai-proxy.service.ts` `ocrPresign()`:
  - Now accepts `sessionId?: string` and `fileId?: string` in body
  - Passes them to AI API as bridge fields (`external_session_id`, `external_file_id`)
- Updated `ai-proxy.controller.ts` to accept the new optional fields in body type

**C1: Frontend — `/ledger` page → session list**
- Changed `apps/web/app/(auth)/ledger/page.tsx` to render `<LedgerListPage />`
- Created `apps/web/components/ledger/LedgerListPage.tsx`:
  - Fetches all sessions via `useSessions()`
  - Filters sessions with `fiscalYear` set (= GL sessions)
  - Renders a card grid with title, fiscal year, status, date
  - Empty state prompts to create ledger in Chat
  - Loading skeletons while fetching

**C2: Frontend — `/ledger/[id]` page → GL detail**
- Changed `apps/web/app/(auth)/ledger/[id]/page.tsx` from redirect to actual page
- Now renders `<LedgerPage sessionId={params.id} />`

**C3: Frontend — LedgerPage refactor**
- Added `{ sessionId: string }` prop to `LedgerPage` component
- Documents now filtered to `sessionId`: `allDocuments.filter(d => d.sessionId === sessionId)`
- `isLoading` passed to `TasksTab`
- Added `fiscalYear` to `Session` type in `lib/backend/types.ts`
- Updated `SessionClient.findAll()` to accept optional `fiscalYear` param

**C4: Frontend — Sidebar dynamic sessions**
- Updated `AppSidebar.tsx` to import `useSessions()` hook
- Shows up to 5 most recent GL sessions (with `fiscalYear`) as children under Ledger nav
- Each child links to `/ledger/[id]`
- Active state styling on current session

---

## Files Created/Modified

### New Files
| File | Description |
|------|-------------|
| `packages/drizzle/drizzle/0004_daffy_kat_farrell.sql` | Migration for invitation table |
| `apps/backend/src/modules/invitation/invitation.module.ts` | Module |
| `apps/backend/src/modules/invitation/invitation.controller.ts` | Controller (5 endpoints) |
| `apps/backend/src/modules/invitation/invitation.service.ts` | Service (create/list/accept/revoke/getByToken) |
| `apps/backend/src/modules/invitation/dto/invitation.dto.ts` | DTO |
| `apps/web/lib/backend/invitation.ts` | Frontend client |
| `apps/web/hooks/useInvitationQueries.ts` | React Query hooks |
| `apps/web/app/invitations/[token]/page.tsx` | Accept invitation route |
| `apps/web/components/auth/AcceptInvitationPage.tsx` | Accept invitation UI |
| `apps/web/components/ledger/LedgerListPage.tsx` | Session list page |

### Modified Files
| File | Change |
|------|--------|
| `packages/drizzle/src/schema.ts` | Added invitation table, enum, relations |
| `apps/backend/src/app.module.ts` | Registered InvitationModule |
| `apps/backend/src/services/email.service.ts` | Added generic `sendEmail()` method |
| `apps/backend/src/modules/session/session.service.ts` | B1: company-scoped findAll/findOne, fiscalYear filter |
| `apps/backend/src/modules/session/session.controller.ts` | Added fiscalYear query param |
| `apps/backend/src/modules/ai-proxy/ai-proxy.service.ts` | B2: sessionId/fileId passthrough in ocrPresign |
| `apps/backend/src/modules/ai-proxy/ai-proxy.controller.ts` | Accept sessionId/fileId in ocrPresign body |
| `apps/web/lib/backend/index.ts` | Registered InvitationClient |
| `apps/web/lib/backend/session.ts` | Updated findAll to support fiscalYear filter |
| `apps/web/lib/backend/types.ts` | Added fiscalYear to Session type |
| `apps/web/app/(auth)/ledger/page.tsx` | Renders LedgerListPage |
| `apps/web/app/(auth)/ledger/[id]/page.tsx` | Renders LedgerPage with sessionId |
| `apps/web/components/ledger/LedgerPage.tsx` | Accepts sessionId, filters docs by session |
| `apps/web/components/layout/AppSidebar.tsx` | Dynamic ledger session children |
| `IMPLEMENTATION_PLAN.md` | Phase 5 & 6 marked done in checklist |

---

## Current Test Status
- Backend E2E: **73 tests passing** (no regressions — invitation tests not yet written)
- Frontend TypeScript: **0 errors** ✅
- Backend TypeScript: **0 errors** ✅

---

## Bugs Fixed
| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Sessions only visible to creator | `session.findAll()` filtered `WHERE creatorId = userId` | Now resolves companyId from membership, filters by `companyId` |
| `/ledger/[id]` was redirecting | Previous checkpoint changed it to redirect | Restored as real page rendering `<LedgerPage sessionId={id}>` |
| LedgerPage showing all docs regardless of session | `useDocuments()` had no session filter applied in component | Filter applied: `allDocuments.filter(d => d.sessionId === sessionId)` |
| OCR presign missing bridge fields | `sessionId`/`fileId` not passed to AI API | Added optional `sessionId`/`fileId` to ocrPresign body and forwarded to AI API |

---

## What Is Next

### Still Pending (Phase 5/6 tests)
- `a4-invitation-tests`: Backend E2E for invitation CRUD + accept/revoke flows
- `b4-session-tests`: Backend E2E for company-wide session visibility
- `c5-ledger-tests`: Playwright tests for ledger list → detail → document flow

### Phase D — TaskDetailView Wiring (next priority)
- `d1-doc-taskdata-mapping`: Map `Document` → `TaskData` utility
- `d2-taskdetail-integration`: Wire TaskDetailView to real document data in LedgerPage
- `d3-ai-review-integration`: Fetch AI review fields `GET /api/chat/review/{tenant_id}/{doc_id}`
- `d4-taskdetail-tests`: E2E tests

### Not Yet Done
- RegisterForm: auto-accept invitation after registration with `?invitation=token`
- Settings page → Members tab: invite UI + pending invitations list
- Migration applied to dev DB (run `pnpm drizzle-kit push` or apply manually)

---

## Instructions for Next Session
1. Read this checkpoint first
2. Read `IMPLEMENTATION_PLAN.md` (Phases 5 & 6 marked ✅)
3. Read `docs/checkpoints/index.md` for full history
4. Apply migration: `cd packages/drizzle && pnpm drizzle-kit push`
5. Next work items: TaskDetailView wiring (D1-D3), then tests (A4, B4, C5, D4)
