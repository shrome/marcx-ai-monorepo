# 015 — Ledger Creation & Chat Flow Complete

## What Was Done

Completed the full ledger creation and AI chat interaction flows.

### Backend Changes

**A1 — Chat message proxy route added (`ai-proxy.controller.ts`)**
- Added `POST /ai/chat/sessions/:sessionId/messages` controller route
- Service method `sendChatMessage()` already existed; just needed controller wiring

**A2 — Composite ledger creation endpoint (`ledger.controller.ts` / `ledger.service.ts`)**
- `POST /ledgers/create-with-gl` — accepts multipart/form-data with `files[]`
- Orchestrates: create ledger DB record → GL upload per file via AI API
- Returns `{ ledger, glUploads: [{ file, success, error? }] }`
- Partial failures are non-fatal (ledger is still created, warnings returned)
- `LedgerModule` now imports `AiProxyModule` to inject `AiProxyService`
- New DTO: `create-ledger-with-gl.dto.ts` — `@Transform` on `fiscalYear` to handle form-data string→int

**AiApiClient — `postMultipartBuffer()` added**
- Uses `form-data` npm package (installed) to forward binary files as multipart
- Correctly sets `Content-Type: multipart/form-data; boundary=...` from `form.getHeaders()`

**`ai-proxy.service.ts` — `glUploadFile()` added**
- Accepts `{ buffer, originalname, mimetype }` + `fiscalYear` + `userId`
- Calls `aiApiClient.postMultipartBuffer()` to forward files to AI API

### Frontend Changes

**B1 — `CreateLedgerDialog.tsx` (new)**
- Shadcn Dialog with: ledger name, fiscal year (default: current year), description, file dropzone
- Calls `useCreateLedgerWithGL()` mutation (composite endpoint)
- On success: redirects to `/ledger/{id}` with success toast
- On partial GL failure: warning toast showing which files failed
- On full failure: error toast with message

**B2 — `AppSidebar.tsx`**
- `+` button now opens `CreateLedgerDialog` via `useState`

**B3 — `LedgerListPage.tsx`**
- Replaced inline auto-create with `CreateLedgerDialog`

**C1 — `lib/backend/ai.ts`**
- Added `createAiChatSession()`, `sendAiChatMessage()`, `chatUploadPresign()` methods

**C2 — `hooks/useAiChatQueries.ts` (new)**
- `useCreateAiChatSession`, `useSendAiChatMessage`, `useAiChatUploadPresign` mutation hooks

**D1 — `hooks/useLedgerChat.ts` (new)**
- Core shared hook for per-ledger, per-tab AI chat session management
- Uses `sessionStorage` keys: `ledger-chat-${ledgerId}` (messages) and `ledger-chat-session-${ledgerId}` (AI session ID)
- Persists across refresh, gone on tab close
- `sendMessage(content, files?)` handles: lazy session creation → message send → state update
- Returns: `{ messages, sessionId, isLoading, initialized, sendMessage, clearSession }`

**D1+D2 — `GlobalChatPanel.tsx` reworked**
- Accepts `ledgerId?: string` prop (passed from `AppLayout`)
- Uses `useLedgerChat(ledgerId, ledger?.fiscalYear)` hook — removed all DB session logic
- Shows full message history with user/assistant chat bubbles
- Loading indicator (animated dots) while AI responds
- "Clear" button to reset session
- File attachment support (pending files shown as chips)
- Suggested prompts only shown when no messages yet
- Handles "no ledger" state gracefully

**D2 — `AppLayout.tsx`**
- Extracts `ledgerId` from pathname: `/ledger/:id` → `id`
- Passes `ledgerId` to `GlobalChatPanel`
- Chat panel only available on `/ledger/:id` pages (not on `/ledger` list page)

**D3 — `LedgerPage.tsx` chat box wired**
- `useLedgerChat(ledgerId, ledger?.fiscalYear)` injected
- `handleChatSend()` and `handleChatKeyDown()` wired to send button and Enter key
- Loading state disables textarea and shows spinner on send button
- File input ref added for paperclip button (D4 — presign upload in hook)

**E1 — `DocumentsPage.tsx` cleaned up**
- Removed all upload UI (dropzone, staged files, upload button, upload state)
- Kept document listing with retry/delete functionality
- Fixed duplicate function definitions that caused build errors

## Bugs Fixed

| File | Root Cause | Fix |
|------|-----------|-----|
| `DocumentsPage.tsx` | Duplicate function definitions (`formatBytes`, `FileTypeIcon`, `ExtractionStatusBadge`, `DocumentStatusBadge`, `DocumentsPage`) caused Next.js build failure | Removed the second full copy of all these definitions |
| `DocumentsPage.tsx` | `useUploadDocument` imported but not in useDocumentQueries (removed during previous session cleanup) | Removed all upload-related code and state |

## Files Created
- `apps/backend/src/modules/ledger/dto/create-ledger-with-gl.dto.ts`
- `apps/web/components/ledger/CreateLedgerDialog.tsx`
- `apps/web/hooks/useAiChatQueries.ts`
- `apps/web/hooks/useLedgerChat.ts`

## Files Modified
- `apps/backend/src/modules/ai-proxy/ai-api.client.ts`
- `apps/backend/src/modules/ai-proxy/ai-proxy.controller.ts`
- `apps/backend/src/modules/ai-proxy/ai-proxy.service.ts`
- `apps/backend/src/modules/ledger/ledger.service.ts`
- `apps/backend/src/modules/ledger/ledger.module.ts`
- `apps/backend/src/modules/ledger/ledger.controller.ts`
- `apps/web/lib/backend/ledger.ts`
- `apps/web/lib/backend/ai.ts`
- `apps/web/hooks/useLedgerQueries.ts`
- `apps/web/components/layout/AppSidebar.tsx`
- `apps/web/components/layout/AppLayout.tsx`
- `apps/web/components/layout/GlobalChatPanel.tsx`
- `apps/web/components/ledger/LedgerPage.tsx`
- `apps/web/components/ledger/LedgerListPage.tsx`
- `apps/web/components/documents/DocumentsPage.tsx`

## Test Status

- Frontend build: ✅ passing
- Backend build: ✅ passing (from previous session)
- E2E tests: not run (UI changes require update)

## Architecture Notes

- **`useLedgerChat` is the single source of truth for chat state** — both `LedgerPage` chat box and `GlobalChatPanel` use the same hook with the same `ledgerId`, so they share session and message state via `sessionStorage`.
- **AI session is lazily created** — first message triggers `createAiChatSession()`. Session ID stored in `sessionStorage` and reused on subsequent messages or after refresh.
- **Chat panel scope**: Only shows on `/ledger/:id` pages. When navigating between ledgers, each ledger's chat history is independent. Tab close clears all sessions.

## What Is Next

- **UI polish**: Connect LedgerPage chat box to also open the GlobalChatPanel when a message is sent (currently the message goes through `useLedgerChat` and shows in the panel only if panel is already open)
- **D4 — File upload in chat**: The `useLedgerChat.sendMessage(content, files)` already handles file uploads via presigned URL. The paperclip button in LedgerPage is wired to a file input, but the file list isn't passed to `sendChatMessage` yet.
- **Backend tests**: Write unit/integration tests for `ledger.service.ts createWithGL()` and `ai-proxy.service.ts`
- **UI — Task detail view**: `TaskDetailView.tsx` may need wiring once task/activity data is available from backend
- **Real AI API integration**: Currently using placeholder URLs — update when real AI API domain is provided
