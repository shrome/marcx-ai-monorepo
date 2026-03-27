# Implementation Plan — MarcX AI Accounting Platform

> **Purpose:** This document is the master plan for building out all backend APIs, AI-API integration, and frontend wiring. It is written so that any engineer (or AI agent) can read it and execute each phase precisely without ambiguity.
>
> **Rule:** No code changes until Jason approves the plan. Execute phase-by-phase, confirm completion before moving on.

### Key Conventions

- **`tenant` = `company`** — The AI-API uses `tenant_id` which maps to our `company.id`. Wherever the AI-API docs say "tenant", it means a Company in our schema.
- **Case module is DEPRECATED** — `apps/backend/src/modules/case/` is no longer active. Do not add new features to it. It will be removed in a future cleanup.
- **Webhooks are DEFERRED** — Webhook endpoints for AI-API callbacks are not in scope until Jason explicitly approves after discussing with colleagues. See Phase 5.
- **Error handling & logging** — Every backend service must handle errors gracefully with structured error responses. Use NestJS built-in logger for all operations. Every external API call must be wrapped in try/catch with meaningful error messages.
- **S3 file storage** — File upload/retrieval goes through `FileStorageService`. Ensure files are uploaded with proper content types, size validation, and secure key naming.

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Gap Analysis](#2-gap-analysis)
3. [Architecture Overview](#3-architecture-overview)
4. [Phase 1 — Backend API Completion](#4-phase-1--backend-api-completion)
5. [Phase 2 — AI-API Integration (Proxy Layer)](#5-phase-2--ai-api-integration-proxy-layer)
6. [Phase 3 — Frontend Wiring](#6-phase-3--frontend-wiring)
7. [Phase 4 — Testing](#7-phase-4--testing)
8. [Phase 5 — Webhooks (DEFERRED — Pending Approval)](#8-phase-5--webhooks-deferred--pending-approval)
9. [Environment Variables](#9-environment-variables)
10. [Data Flow Sequences](#10-data-flow-sequences)
11. [Implementation Order & Dependencies](#11-implementation-order--dependencies)
12. [How to Execute This Plan](#12-how-to-execute-this-plan)

---

## 1. Current State Summary

### 1.1 Schema (`packages/drizzle/src/schema.ts`)

12 tables fully defined with Drizzle ORM:

| Domain | Tables |
|--------|--------|
| **Auth & Identity** | `Company`, `User`, `CompanyMember`, `Credential`, `VerificationToken` |
| **Workspace** | `Session`, `ChatMessage`, `File` |
| **Document** | `Document` |
| **Billing** | `CompanyCredit`, `CreditTransaction` |
| **Platform** | `ActivityLog` |

Key design points:
- `User` has NO `companyId` or `role` — these live on `CompanyMember` junction table
- `CompanyMember` supports multi-company; backend enforces single membership for now
- `Document` has 3 JSONB fields: `rawData` (immutable AI output), `draftData` (user edits), `approvedData` (immutable on approval)
- `CompanyCredit` is a credit wallet per company; `CreditTransaction` is an append-only ledger
- `ActivityLog` is an append-only event stream with namespaced `action` strings
- `Session.creatorId` → `User` (not `CompanyMember`) for stable audit trail

### 1.2 Backend (`apps/backend`) — NestJS

**Existing modules & endpoints:**

| Module | Endpoints | Status |
|--------|-----------|--------|
| **Auth** | `POST /auth/register`, `/login`, `/otp/send`, `/register/verify`, `/login/verify`, `/refresh`, `/revoke`, `/revoke-all` | ✅ Working |
| **User** | `GET /users/me`, `GET /users/:id`, `PATCH /users/:id` | ✅ Working |
| **Company** | `POST /company`, `/company/register`, `GET /company`, `GET /company/:id`, `PATCH /company/:id`, `DELETE /company/:id`, `GET /company/:id/users`, `GET /company/:id/sessions` | ✅ Working |
| **Session** | `POST /sessions/chat`, `POST /sessions`, `GET /sessions`, `GET /sessions/:id`, `PATCH /sessions/:id`, `DELETE /sessions/:id` | ✅ Working |
| **Chat** | `POST /chat/sessions/:id/messages`, `GET /chat/sessions/:id/messages`, `DELETE /chat/messages/:id`, `POST /chat/sessions/:id/messages/:chatId/attachments` | ✅ Working (lorem ipsum AI — **will be replaced with real AI-API in Phase 2**) |
| **Case** | `POST /cases`, `GET /cases`, etc. | ⛔ **DEPRECATED** — do not extend; will be removed in future cleanup |

**Shared services:** `FileStorageService` (S3 via AWS SDK), `EmailService` (Resend)

### 1.3 AI-API (`ai-api/`) — Django 5 + DRF (External Python service)

> **Note:** `tenant` in AI-API = `company` in our schema. `x-tenant-id` header = `company.id`.

60+ endpoints documented in `BACKEND_API_GUIDE.md`. Key capabilities:
- **OCR pipeline:** presign → upload → run → process → GL posting
- **Document enrichment:** parse → validate → candidates → categorize → confirm
- **Chat (LangGraph):** sessions, messages (invokes AI agent), job callbacks — **this is the core AI chat engine that powers our chat feature**
- **GL management:** upload, initialise, status, transactions, export
- **Tenant management:** Chart of Accounts, categorisation rules, LLM usage/budget
- **Bulk operations:** invoice import/export
- **Identity via headers:** `x-tenant-id` (= our `company.id`), `x-user-id` (= our `user.id`). No auth layer — our backend handles auth.

### 1.4 Frontend (`apps/web`) — Next.js 16

**Pages:** Login, Register, Company Setup, Chat (AskPio), Documents, Ledger, Marketplace, Profile, Settings

**Integration layers:**
- **tRPC** — auth, chat sessions/messages, files (local mock data)
- **Axios REST client** (`lib/backend/`) — talks to NestJS backend for auth, users, companies, sessions, chat

**State:** currently uses mock/lorem data for AI responses and file management.

---

## 2. Gap Analysis

### 2.1 Backend — Missing Modules & Endpoints

| Module | What's Missing | Schema Tables |
|--------|---------------|---------------|
| **Document** | Full CRUD + extraction workflow + review/approve flow | `Document`, `File` |
| **CompanyMember** | Invite, remove, change role, list members | `CompanyMember` |
| **CompanyCredit** | View balance, top-up | `CompanyCredit` |
| **CreditTransaction** | List transactions, create usage record | `CreditTransaction` |
| **ActivityLog** | List activity, create entries | `ActivityLog` |
| **AI Proxy** | Forward requests to AI-API, map tenant/user headers | — |

> **Note:** Webhook endpoints (for AI-API callbacks) are deferred to Phase 5 pending approval.
> **Note:** Case module is deprecated and excluded from this plan.

### 2.2 Backend — Existing Module Gaps

| Module | Gap |
|--------|-----|
| **Chat** | Currently returns lorem ipsum. **This is the #1 integration priority.** The AI-API's LangGraph chat engine (`POST /api/chat/sessions/{id}/messages`) is what powers real AI responses. Our `ChatService.createMessage` must proxy user messages to AI-API and store the AI response with metadata. |
| **Session** | Needs `fiscalYear` support in create; needs `summary` update endpoint |
| **File** | File upload currently just stores in S3; needs to also create `Document` record and trigger AI extraction |

### 2.3 Frontend — What Needs Wiring

| Page | Current State | Needs |
|------|--------------|-------|
| **Chat** | Mock AI responses | Wire to real AI-API via backend proxy |
| **Documents** | Mock file browser | Wire to Document CRUD + show extraction status |
| **Ledger** | Static placeholder | Wire to GL status, transactions, export via backend |
| **Profile** | Basic user info | Show company membership, credit balance |
| **Settings** | Placeholder | Company settings, member management |

---

## 3. Architecture Overview

```
┌──────────────┐     REST/JSON      ┌──────────────┐     REST/JSON      ┌──────────────┐
│              │  ←───────────────→  │              │  ←───────────────→  │              │
│   Frontend   │  Cookie JWT auth   │   Backend    │  x-tenant-id       │   AI-API     │
│  (Next.js)   │                    │  (NestJS)    │  x-user-id         │  (Django)    │
│              │                    │              │                    │              │
└──────────────┘                    └──────┬───────┘                    └──────┬───────┘
                                          │                                   │
                                          │  Drizzle ORM                      │  Django ORM
                                          ▼                                   ▼
                                   ┌──────────────┐                    ┌──────────────┐
                                   │  PostgreSQL   │                    │ PostgreSQL   │
                                   │  (Our DB)     │                    │ (AI-API DB)  │
                                   └──────────────┘                    └──────────────┘
                                                                              │
                                                                       ┌──────┴───────┐
                                                                       │  S3 / OCR    │
                                                                       └──────────────┘
```

**Key principle:** Our NestJS backend is the **gateway**. The frontend never talks to AI-API directly. The backend:
1. Authenticates the user (JWT)
2. Resolves `companyId` (= tenant) and `userId` from the session
3. Proxies requests to AI-API with `x-tenant-id` and `x-user-id` headers
4. Stores/updates records in our DB based on AI-API responses
5. *(Phase 5, deferred)* Receives webhook callbacks from AI-API

---

## 4. Phase 1 — Backend API Completion

### 4.1 New Module: `document`

**File:** `src/modules/document/`

Handles the Document extraction lifecycle tied to our schema.

#### Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| `POST` | `/documents` | Create document from an uploaded file. Creates `File` + `Document` records. | 🔐 |
| `GET` | `/documents` | List documents for user's company. Supports filters: `documentType`, `extractionStatus`, `documentStatus`, `sessionId`. Excludes soft-deleted (`deletedAt IS NULL`). | 🔐 |
| `GET` | `/documents/:id` | Get single document with file, session info. | 🔐 |
| `PATCH` | `/documents/:id` | Update document: edit `draftData`, change `documentType`, add `notes`. | 🔐 |
| `POST` | `/documents/:id/approve` | Approve document: copies `draftData` → `approvedData`, sets `documentStatus = APPROVED`. Immutable once set. | 🔐 |
| `DELETE` | `/documents/:id` | Soft-delete: sets `deletedAt` timestamp. Never hard-deletes. | 🔐 |

#### Service Methods

```
DocumentService:
  create(fileUpload, sessionId, userId, companyId)
    → Insert File record (S3 upload via FileStorageService)
    → Insert Document record (extractionStatus: PENDING)
    → Return document with file

  findAll(companyId, filters)
    → Query documents WHERE companyId = X AND deletedAt IS NULL
    → Apply optional filters (documentType, extractionStatus, documentStatus, sessionId)
    → Include file relation

  findOne(id, companyId)
    → Single document with file, session

  updateDraft(id, companyId, draftData, notes?, documentType?)
    → Verify document belongs to company
    → Update draftData (JSONB merge or replace)

  approve(id, userId, companyId)
    → Verify document is UNDER_REVIEW or DRAFT
    → Copy draftData → approvedData (immutable snapshot)
    → Set documentStatus = APPROVED, postedBy = userId, postedAt = now

  softDelete(id, companyId)
    → Set deletedAt = now

  updateExtractionResult(id, rawData, extractedBy, confidenceScore)
    → Called when OCR status poll returns COMPLETED (or by webhook handler in Phase 5)
    → Set rawData (immutable), draftData (copy of rawData)
    → Set extractionStatus = COMPLETED, extractedAt = now

  updateExtractionFailed(id, errorMessage)
    → Called when OCR status poll returns FAILED (or by webhook handler in Phase 5)
    → Set extractionStatus = FAILED, errorMessage
```

#### DTOs

```typescript
CreateDocumentDto {
  sessionId: string;        // required
  documentType?: DocumentType; // optional, default OTHER
}

UpdateDocumentDto {
  draftData?: Record<string, any>;
  notes?: string;
  documentType?: DocumentType;
}

ListDocumentsQueryDto {
  sessionId?: string;
  documentType?: DocumentType;
  extractionStatus?: ExtractionStatus;
  documentStatus?: DocumentStatus;
  page?: number;
  limit?: number;
}
```

---

### 4.2 New Module: `company-member`

**File:** `src/modules/company-member/`

Manages company membership (invitation, role changes, removal).

#### Endpoints

| Method | Route | Description | Auth | Role Required |
|--------|-------|-------------|------|---------------|
| `GET` | `/companies/:companyId/members` | List all members of a company | 🔐 | Any member |
| `POST` | `/companies/:companyId/members` | Invite a user to the company (by email) | 🔐 | OWNER, ADMIN |
| `PATCH` | `/companies/:companyId/members/:memberId` | Change member role | 🔐 | OWNER |
| `DELETE` | `/companies/:companyId/members/:memberId` | Remove member from company | 🔐 | OWNER, ADMIN |

#### Service Methods

```
CompanyMemberService:
  listMembers(companyId)
    → Query companyMember WHERE companyId with user relation

  inviteMember(companyId, email, role, invitedByUserId)
    → Find user by email (or create invite)
    → Insert companyMember record
    → Log ActivityLog: "member.invited"

  updateRole(memberId, newRole, updatedByUserId)
    → Verify updater is OWNER
    → Cannot change own role or last OWNER
    → Update role

  removeMember(memberId, removedByUserId)
    → Verify remover is OWNER or ADMIN
    → Cannot remove last OWNER
    → Delete companyMember record
    → Log ActivityLog: "member.removed"
```

#### DTOs

```typescript
InviteMemberDto {
  email: string;
  role: MemberRole; // OWNER | ADMIN | ACCOUNTANT | VIEWER
}

UpdateMemberRoleDto {
  role: MemberRole;
}
```

---

### 4.3 New Module: `billing`

**File:** `src/modules/billing/`

Manages company credit balance and transaction history.

#### Endpoints

| Method | Route | Description | Auth | Role Required |
|--------|-------|-------------|------|---------------|
| `GET` | `/companies/:companyId/credit` | Get current credit balance | 🔐 | Any member |
| `POST` | `/companies/:companyId/credit/top-up` | Top up credit (placeholder for Stripe integration) | 🔐 | OWNER, ADMIN |
| `GET` | `/companies/:companyId/credit/transactions` | List credit transactions with pagination | 🔐 | Any member |

#### Service Methods

```
BillingService:
  getBalance(companyId)
    → Find or create CompanyCredit for company
    → Return balance, currency

  topUp(companyId, amount, reference, userId)
    → Begin transaction:
      1. Insert CreditTransaction (type: TOP_UP, amount: +X)
      2. Update CompanyCredit.balance += amount
      3. Set balanceAfter on the transaction
    → Log ActivityLog: "credit.topped_up"

  recordUsage(companyId, amount, description, metadata, userId?)
    → Begin transaction:
      1. Check sufficient balance
      2. Insert CreditTransaction (type: USAGE, amount: -X)
      3. Update CompanyCredit.balance -= amount
      4. Set balanceAfter on the transaction
    → Log ActivityLog: "credit.used"
    → Called internally by AI proxy after successful extraction

  listTransactions(companyId, filters)
    → Query CreditTransaction with pagination
    → Support filter by type, date range
```

#### DTOs

```typescript
TopUpCreditDto {
  amount: number;       // must be > 0
  reference?: string;   // payment reference
  metadata?: object;    // payment method info
}

ListTransactionsQueryDto {
  type?: CreditTransactionType;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
```

---

### 4.4 New Module: `activity-log`

**File:** `src/modules/activity-log/`

Read-only query endpoint + internal write helper.

#### Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| `GET` | `/companies/:companyId/activity` | List activity log entries | 🔐 |

#### Service Methods

```
ActivityLogService:
  log(params: { companyId, userId?, sessionId?, action, entityType, entityId, metadata? })
    → Insert ActivityLog record
    → Used internally by all other services (not exposed as API)

  list(companyId, filters)
    → Query ActivityLog WHERE companyId
    → Support filters: action, entityType, userId, dateRange
    → Paginated, ordered by createdAt DESC
```

#### DTOs

```typescript
ListActivityQueryDto {
  action?: string;          // e.g., "document.uploaded"
  entityType?: string;      // e.g., "Document"
  userId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
```

---

### 4.5 Existing Module Updates

#### Session Module

Add support for `fiscalYear` in session creation:

```typescript
// Update CreateSessionDto:
CreateSessionDto {
  title: string;
  description?: string;
  companyId?: string;
  fiscalYear?: number;  // NEW — for GL sessions
}

// Update CreateChatSessionDto:
CreateChatSessionDto {
  title?: string;
  fiscalYear?: number;  // NEW
}
```

Update `SessionService.createChatSession` to accept and store `fiscalYear`.

#### Chat Module

Replace lorem ipsum with AI-API proxy (see Phase 2 below). The current `createMessage` method will be refactored to:
1. Store user message in DB
2. Forward to AI-API chat endpoint
3. Store AI response in DB with `metadata` (model, tokens, etc.)
4. Return AI message

#### File Upload Flow Update

When files are uploaded (via chat or case), also create a `Document` record:

```
Current flow:  Upload → File record in DB → done
New flow:      Upload → File record → Document record (PENDING) → trigger AI extraction
```

This applies to:
- `ChatService.createMessage` (when files attached)
- `CaseService.create` (when files attached)
- `CaseService.addAttachments`

---

## 5. Phase 2 — AI-API Integration (Proxy Layer)

### ⭐ Why This Matters

The AI-API (Django/LangGraph) is the **brain** of the platform. Our NestJS backend is the **gateway** — it authenticates users, resolves their company (tenant), and proxies requests to the AI-API with the correct headers. The most critical integration is **Chat**: the AI-API's LangGraph agent handles all intelligent conversation, document analysis, and GL operations. Without this proxy layer, the chat is just lorem ipsum.

### 5.1 New Module: `ai-proxy`

**File:** `src/modules/ai-proxy/`

Central service that proxies requests to the external AI-API Django service. All outbound calls to AI-API go through this module.

#### Configuration

```typescript
// Environment variables:
AI_API_BASE_URL=http://localhost:8000  // or https://ai-api.piofin.ai
```

#### Core Service: `AiApiClient`

A shared injectable service wrapping Axios/fetch for AI-API communication.

```
AiApiClient:
  constructor()
    → Create Axios instance with baseURL from env
    → Set default timeout (30s for sync, 120s for extraction)

  private makeRequest(method, path, body?, tenantId, userId)
    → Set headers: { 'x-tenant-id': tenantId, 'x-user-id': userId }
    → Execute request
    → Handle errors (502 upstream, 500 internal, etc.)
    → Return typed response
```

#### 5.1.1 OCR & Document Extraction Proxy

| Our Endpoint | Proxies To | Purpose |
|---|---|---|
| `POST /ai/ocr/presign` | `POST /api/ocr/presign` | Get presigned upload URL for document |
| `GET /ai/ocr/jobs/:docId/status` | `GET /api/ocr/jobs/{tenant}/{doc}` | Poll OCR extraction status |
| `POST /ai/ocr/jobs/:docId/run` | `POST /api/ocr/jobs/{tenant}/{doc}/run` | Trigger OCR pipeline |
| `POST /ai/ocr/jobs/:docId/process` | `POST /api/ocr/jobs/{tenant}/{doc}/process` | Post extracted data to GL |

**Flow in our backend:**
1. Frontend calls `POST /ai/ocr/presign` with `{ filename, contentType }`
2. Backend resolves `tenantId` from user's company membership
3. Backend forwards to AI-API, gets presigned URL + `docId`
4. Backend creates `File` + `Document` record (status: PENDING)
5. Frontend uploads file directly to presigned S3 URL
6. Frontend calls `POST /ai/ocr/jobs/:docId/run` to trigger extraction
7. Backend forwards to AI-API
8. AI-API processes asynchronously; frontend polls `GET /ai/ocr/jobs/:docId/status` until completion (webhook callback available in Phase 5)

#### 5.1.2 Document Enrichment Proxy

| Our Endpoint | Proxies To | Purpose |
|---|---|---|
| `POST /ai/documents/:docId/enrich` | `POST /api/documents/enrich` | Run enrichment pipeline |
| `GET /ai/documents/:docId/candidates` | `GET /api/documents/{tenant}/{doc}/candidates` | Get ranked account codes |
| `POST /ai/documents/:docId/confirm` | `POST /api/documents/confirm` | Confirm reviewed fields |
| `POST /ai/documents/:docId/gl-prepare` | `POST /api/documents/{tenant}/{doc}/gl-prepare` | Build GL-ready payload |

**After enrichment completes:**
- Backend updates our `Document.rawData` and `draftData` from AI-API response
- Backend records `CreditTransaction` (USAGE) for the AI processing cost

#### 5.1.3 GL Management Proxy

| Our Endpoint | Proxies To | Purpose |
|---|---|---|
| `POST /ai/general-ledger/upload` | `POST /api/gl/upload` | Upload GL file (multipart) |
| `POST /ai/general-ledger/initialise` | `POST /api/gl/initialise` | Initialize GL from file |
| `GET /ai/general-ledger/status` | `GET /api/tenants/{tenant}/gl/status` | GL status + trial balance |
| `GET /ai/general-ledger/transactions` | `GET /api/tenants/{tenant}/gl/transactions` | Paginated GL transactions |
| `GET /ai/general-ledger/export` | `GET /api/tenants/{tenant}/gl/export` | Export GL as Excel |

#### 5.1.4 Chat AI Proxy

| Our Endpoint | Proxies To | Purpose |
|---|---|---|
| `POST /ai/chat/sessions` | `POST /api/chat/sessions` | Create AI chat session (mirrored) |
| `POST /ai/chat/sessions/:sessionId/message` | `POST /api/chat/sessions/{session_id}/messages` | Send message to AI agent |
| `POST /ai/chat/sessions/:sessionId/upload` | `POST /api/chat/sessions/{session_id}/uploads/presign` | Presign upload for chat context |
| `GET /ai/chat/jobs/:docId` | `GET /api/chat/jobs/{tenant}/{doc}` | OCR status + posting projection |
| `GET /ai/chat/review/:docId` | `GET /api/chat/review/{tenant}/{doc}` | Review-ready field list |

**Chat message flow (replacing lorem ipsum):**
1. Frontend sends `POST /chat/sessions/:sessionId/messages` (existing endpoint)
2. `ChatService` stores user message in our DB
3. `ChatService` calls `AiApiClient.sendChatMessage(sessionId, content, tenantId, userId)`
4. AI-API returns assistant response with metadata (intent, citations, gl_result)
5. `ChatService` stores assistant message in our DB with `metadata` JSONB
6. If AI-API returns `waiting_for_job: true`, store that in metadata for frontend to show loading state
7. Return assistant message to frontend

#### 5.1.5 Tenant Management Proxy

| Our Endpoint | Proxies To | Purpose |
|---|---|---|
| `GET /ai/chart-of-accounts` | `GET /api/tenants/{tenant}/chart-of-accounts` | List Chart of Accounts |
| `POST /ai/chart-of-accounts` | `POST /api/tenants/{tenant}/chart-of-accounts` | Bulk upsert chart of accounts |
| `DELETE /ai/chart-of-accounts` | `DELETE /api/tenants/{tenant}/chart-of-accounts` | Remove chart of accounts |
| `GET /ai/categorisation-rules` | `GET /api/tenants/{tenant}/categorisation-rules` | List categorisation rules |
| `POST /ai/categorisation-rules` | `POST /api/tenants/{tenant}/categorisation-rules` | Create rule |
| `GET /ai/llm/usage` | `GET /api/tenants/{tenant}/llm/usage` | LLM usage stats |
| `PUT /ai/llm/usage` | `PUT /api/tenants/{tenant}/llm/usage` | Set budget limits |

---

### 5.2 Tenant ID Mapping

Our backend uses `company.id` (UUID) as the tenant identifier. The AI-API expects `x-tenant-id` header.

**Mapping strategy:**
- `tenantId` = `company.id` from the user's `CompanyMember` record
- When proxying to AI-API: `x-tenant-id: companyMember.companyId`

A helper on the `AiApiClient` or a shared `TenantResolver` service:

```typescript
TenantResolver:
  resolve(userId: string): Promise<{ tenantId: string, companyId: string }>
    → Find first CompanyMember for userId
    → Return { tenantId: companyMember.companyId, companyId: companyMember.companyId }
```

---

## 6. Phase 3 — Frontend Wiring

### 6.1 New Backend Client Classes (`lib/backend/`)

Add Axios client classes for new backend endpoints:

```
lib/backend/
├── index.ts          # Add new client exports
├── document.ts       # NEW — Document CRUD + extraction
├── billing.ts        # NEW — Credit balance + transactions
├── activity.ts       # NEW — Activity log
├── ai.ts             # NEW — AI proxy endpoints (GL, OCR, enrichment)
└── member.ts         # NEW — Company member management
```

#### `DocumentClient`

```typescript
DocumentClient {
  create(sessionId, file, documentType?): Promise<Document>
  findAll(filters): Promise<Document[]>
  findOne(id): Promise<Document>
  updateDraft(id, draftData, notes?): Promise<Document>
  approve(id): Promise<Document>
  delete(id): Promise<void>
}
```

#### `BillingClient`

```typescript
BillingClient {
  getBalance(companyId): Promise<{ balance, currency }>
  topUp(companyId, amount, reference?): Promise<CreditTransaction>
  listTransactions(companyId, filters?): Promise<CreditTransaction[]>
}
```

#### `AiClient`

```typescript
AiClient {
  // OCR
  presignUpload(filename, contentType): Promise<{ url, docId }>
  getOcrStatus(docId): Promise<OcrJobStatus>
  triggerOcr(docId): Promise<void>
  processToGL(docId, fiscalYear?): Promise<GLResult>

  // Enrichment
  enrichDocument(docId): Promise<EnrichmentResult>
  getCandidates(docId): Promise<AccountCandidate[]>
  confirmDocument(docId, finalFields): Promise<void>

  // GL
  uploadGL(file, fiscalYear): Promise<GLUploadResult>
  getGLStatus(fiscalYear?): Promise<GLStatus>
  getGLTransactions(filters): Promise<GLTransactions>
  exportGL(fiscalYear?): Promise<Blob>

  // Chart of Accounts
  getChartOfAccounts(): Promise<Account[]>
  upsertChartOfAccounts(accounts): Promise<void>
}
```

#### `MemberClient`

```typescript
MemberClient {
  list(companyId): Promise<CompanyMember[]>
  invite(companyId, email, role): Promise<CompanyMember>
  updateRole(companyId, memberId, role): Promise<CompanyMember>
  remove(companyId, memberId): Promise<void>
}
```

---

### 6.2 Page-by-Page Wiring

#### Chat Page (`/chat`)

| Feature | Current | Target |
|---------|---------|--------|
| Send message | Lorem ipsum response | Real AI response via `POST /chat/sessions/:id/messages` → AI-API |
| File upload in chat | Stores file only | Stores file + creates Document + triggers AI extraction |
| AI response rendering | Plain text | Rich markdown + metadata (citations, GL results) |
| Extraction status | Not shown | Show extraction progress indicator when `waiting_for_job: true` |
| Chat feedback | Not wired | Wire `ChatMessage.feedback` + `feedbackNote` to backend |

#### Documents Page (`/documents`)

| Feature | Current | Target |
|---------|---------|--------|
| File list | Mock data | `GET /documents` with real data from backend |
| Upload | Mock | Upload via presign → create Document → trigger extraction |
| Document detail | Not exists | Show extraction status, rawData/draftData, review UI |
| Review/Edit | Not exists | Edit `draftData` fields, then approve |
| Status badges | Not exists | Show `extractionStatus` and `documentStatus` badges |

#### Ledger Page (`/ledger`)

| Feature | Current | Target |
|---------|---------|--------|
| Overview | Static placeholder | Wire to `GET /ai/general-ledger/status` — show trial balance, summary |
| Transactions | Not exists | Wire to `GET /ai/general-ledger/transactions` — paginated table |
| Export | Not exists | Wire to `GET /ai/general-ledger/export` — download Excel |
| General Ledger Upload | Not exists | Wire to `POST /ai/general-ledger/upload` — upload general ledger file |
| Right-side chat | GlobalChatPanel exists | Wire to AI chat with ledger context |

#### Profile Page (`/profile`)

| Feature | Current | Target |
|---------|---------|--------|
| User info | Basic | Show company membership + role |
| Credit balance | Not exists | Show `CompanyCredit.balance` |
| Transaction history | Not exists | Show recent `CreditTransaction` list |

#### Settings Page (`/settings`)

| Feature | Current | Target |
|---------|---------|--------|
| Company info | Not exists | Edit company details |
| Members | Not exists | List members, invite, change roles, remove |
| LLM usage | Not exists | Show usage stats, set budget limits |
| Chart of accounts management | Not exists | View/edit Chart of Accounts |

---

### 6.3 Frontend UX Patterns

**Loading states:**
- Document extraction: "AI is analyzing your document..." with progress spinner
- Chat AI response: Typing indicator / streaming placeholder
- GL operations: "Processing your general ledger..."

**Error messages (comprehensive, user-friendly):**
- Upload failure: "Failed to upload [filename]. Please check your connection and try again."
- Extraction failure: "AI couldn't extract data from this document. You can try uploading a clearer image."
- Insufficient credit: "Your company doesn't have enough credit. Please contact your admin to top up."
- Webhook timeout: "Document processing is taking longer than expected. We'll notify you when it's ready."

**Optimistic updates:**
- Message sending: show user message immediately, show loading for AI response
- Document approval: update UI immediately, revert on error

---

## 7. Phase 4 — Testing, API Documentation & Frontend E2E

### 7.0 Test Infrastructure

#### Test Docker Environment (`docker-compose.test.yml`)
A lightweight compose file for CI and local test runs:
- **PostgreSQL 16** on port 15433 (separate from dev's 15432)
  - Ephemeral: `tmpfs` mounted data dir (fast, auto-cleaned)
  - Env: `POSTGRES_DB=marcx_test`, `POSTGRES_USER=test`, `POSTGRES_PASSWORD=test`
- No PgBouncer, Redis, or app services — tests connect directly to Postgres

**Bootstrap script** (`scripts/test-setup.sh`):
1. Spin up `docker-compose.test.yml`
2. Wait for Postgres to be healthy
3. Run Drizzle migrations against test DB
4. Execute tests
5. Tear down

**Env file**: `.env.test` with `DATABASE_URL=postgresql://test:test@localhost:15433/marcx_test`

#### Skills (`.github/skills/`)
Three new self-created skills to guide future AI-assisted test writing:
- `backend-testing` — NestJS E2E + unit test patterns, AAA, seed/cleanup
- `api-docs` — Swagger/OpenAPI decorator conventions for NestJS
- `e2e-testing` — Playwright patterns with visual snapshots

---

### 7.1 API Documentation (Scalar)

> Using **Scalar** (`@scalar/nestjs-api-reference`) — free, open-source (MIT), no account needed.
> Renders a modern API docs UI with built-in try-it-out panel, dark/light themes, and search.
> Uses the same `@nestjs/swagger` decorators under the hood.

#### Dependencies
```bash
cd apps/backend
pnpm add @nestjs/swagger @scalar/nestjs-api-reference
```

#### Setup in `main.ts`
```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'

const config = new DocumentBuilder()
  .setTitle('Marcx AI API')
  .setDescription('AI-powered accounting platform API')
  .setVersion('1.0')
  .addBearerAuth()
  .build()
const document = SwaggerModule.createDocument(app, config)

// OpenAPI JSON at /api/docs/swagger
SwaggerModule.setup('api/docs/swagger', app, document)

// Beautiful Scalar UI at /api/docs
app.use('/api/docs', apiReference({ content: document, theme: 'kepler' }))
```

#### Decorator Work — All 12 Modules

Each controller gets `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse`.
Each DTO gets `@ApiProperty` / `@ApiPropertyOptional` with `type`, `example`, `description`.

---

### 7.2 Backend Tests (NestJS + Jest + Supertest)

#### Approach: E2E Integration Tests
Test actual HTTP endpoints against a real test database using `supertest`.
This provides true confidence — tests validate routes, guards, validation pipes, services, and DB queries together.

#### Bootstrap Setup Reference
- **Global Prefix**: All routes prefixed with `/api`
- **Cookie Parser**: Enabled for cookie-based auth
- **CORS**: staging.piofin.ai, ai.marinecx.com, localhost:3000 (dev)
- **Global ValidationPipe**: `whitelist: true`, `transform: true`
- **Port**: 4000 (or `process.env.PORT`)

#### AppModule Imports (12 modules)
```
ServicesModule, AuthModule, UserModule, CompanyModule, CaseModule,
SessionModule, ChatModule, ActivityLogModule, BillingModule,
CompanyMemberModule, DocumentModule, AiProxyModule
```

#### Validation Decorators Used Across DTOs
`@IsEmail`, `@IsString`, `@IsNumber`, `@IsEnum`, `@IsUUID`, `@IsUrl`, `@IsNotEmpty`,
`@IsOptional`, `@IsInt`, `@MinLength`, `@MaxLength`, `@Min`, `@Max`, `@IsObject`, `@Type`

#### Guards & Auth
- **AuthGuard**: Custom guard extending `PassportAuthGuard('jwt')`
- **JwtStrategy**: Extracts from cookies first, then Authorization header
- **Token storage**: httpOnly cookies (15 min access, 7 day refresh via Redis)

#### File Upload Patterns
- **Single file**: `@UseInterceptors(FileInterceptor('file'))` + `@UploadedFile()`
- **Multiple files**: `@UseInterceptors(FilesInterceptor('files', 10, multerConfig))` + `@UploadedFiles()`
- **Document module**: MulterModule with 50 MB file size limit

#### Test Helpers (`apps/backend/test/helpers/`)
- `seed.ts` — Create test user, company, company member; return JWT auth cookie
- `cleanup.ts` — Truncate all tables between test suites
- `fixtures.ts` — Reusable test data factories for each entity type

#### Test Files — Detailed Breakdown

**1. Auth Module Tests** (Priority: CRITICAL) — `auth.e2e-spec.ts`
- POST /auth/register → Valid registration, missing email, missing name, duplicate email
- POST /auth/login → Valid login, invalid email format, user not found
- POST /auth/otp/send → Valid OTP request, invalid email, rate limiting
- POST /auth/register/verify & /auth/login/verify → Valid OTP, invalid OTP, expired OTP, cookie setting (httpOnly, secure, expiry)
- POST /auth/refresh → Valid refresh token, missing token, invalid token, new access token cookie set
- POST /auth/revoke & /auth/revoke-all → Authenticated revoke, unauthenticated (401), cookies cleared
- Guard tests: valid JWT in cookies, valid JWT in bearer header, missing token (401), expired token (401), invalid token (401)
- JwtStrategy tests: extraction from cookies, extraction from bearer, user exists, user not found (401)

**2. User Module Tests** (Priority: LOW) — `user.e2e-spec.ts`
- GET /users/profile (AuthGuard) → Get current user, unauthenticated (401)
- PATCH /users/:id (AuthGuard) → Update name, update image, invalid fields stripped (whitelist)

**3. Company Module Tests** (Priority: HIGH) — `company.e2e-spec.ts`
- POST /company → Valid creation, missing required fields (name, category), invalid category enum, invalid URL for website
- POST /company/register → Register with req.user.id
- GET /company → List companies, empty list
- GET /company/:id → Valid retrieval, non-existent (404), invalid UUID format
- PATCH /company/:id → Valid update, invalid category enum, URL validation, authorization check
- DELETE /company/:id → Deletion, authorization check
- GET /company/:id/users & /sessions → Return related entities

**DTOs**: CreateCompanyDto: name (IsString, MaxLength 255), category (IsEnum: ACCOUNTING|MARKETING), description (optional), website (IsUrl, optional), image (optional). UpdateCompanyDto: all fields optional.

**4. Company-Member Module Tests** (Priority: MEDIUM) — `company-member.e2e-spec.ts`
- POST invite → Valid InviteMemberDto (IsEmail, IsEnum), invalid email, invalid role enum
- PATCH update role → Valid UpdateMemberRoleDto, invalid role, last-OWNER protection (BadRequestException)
- DELETE remove → Valid removal, last-OWNER guard, authorization check

**DTOs**: InviteMemberDto: email (IsEmail), role (IsEnum: OWNER|ADMIN|ACCOUNTANT|VIEWER). UpdateMemberRoleDto: role (IsEnum).

**5. Session Module Tests** (Priority: MEDIUM) — `session.e2e-spec.ts`
- CRUD operations, all AuthGuard protected
- FiscalYear validation (Min 2000), query filters

**DTOs**: CreateSessionDto: title (IsString), companyId (optional), fiscalYear (IsInt, Min 2000, optional), description (optional). UpdateSessionDto: title, description, status (all optional). CreateChatSessionDto: title (optional), fiscalYear (IsInt, Min 2000, optional).

**6. Chat Module Tests** (Priority: MEDIUM) — `chat.e2e-spec.ts`
- POST /chat/sessions/:sessionId/messages → Message creation, file uploads (FilesInterceptor, 10 file limit)
- GET /chat/sessions/:sessionId/messages → List messages
- DELETE /chat/sessions/:sessionId/messages/:id → Delete message

**DTOs**: CreateMessageDto: content (IsString). Module imports: AuthModule, AiProxyModule, ServicesModule.

**7. Document Module Tests** (Priority: HIGH) — `document.e2e-spec.ts`
- POST /documents → File upload with CreateDocumentDto, no file (BadRequestException), invalid sessionId (not UUID), invalid documentType
- GET /documents → Query with filters (sessionId, documentType, extractionStatus, documentStatus), pagination (page, limit), type transforms
- GET /documents/:id → Valid retrieval, non-existent (404), company ownership check
- PATCH /documents/:id → Update draft data, update notes, enum validation
- POST /documents/:id/approve → Approval, status change, activity log created
- DELETE /documents/:id → Soft delete, user & companyId audit

**DTOs**: CreateDocumentDto: sessionId (IsUUID), documentType (IsEnum, optional). UpdateDocumentDto: draftData (IsObject, optional), notes (IsString, optional), documentType (optional). UpdateExtractionResultDto: rawData (IsObject), extractedBy (optional), confidenceScore (IsNumber, Min 0, Max 1). ListDocumentsQueryDto: sessionId, documentType, extractionStatus, documentStatus, page, limit (all optional).
**Enums**: DocumentType: INVOICE|RECEIPT|BANK_STATEMENT|CONTRACT|OTHER. ExtractionStatus: PENDING|PROCESSING|COMPLETED|FAILED. DocumentStatus: DRAFT|UNDER_REVIEW|APPROVED|POSTED|VOID.

**8. AI-Proxy Module Tests** (Priority: HIGH) — `ai-proxy.e2e-spec.ts`
Mock AI-API external calls with `jest.spyOn` or module override.

- **OCR Pipeline**: POST /ai/ocr/presign (valid, missing filename/contentType), GET /ai/ocr/jobs/:docId/status, POST /ai/ocr/jobs/:docId/run, POST /ai/ocr/jobs/:docId/process
- **Document Enrichment**: POST /ai/documents/:docId/enrich, GET /ai/documents/:docId/candidates, POST /ai/documents/:docId/confirm, POST /ai/documents/:docId/gl-prepare
- **General Ledger**: POST /ai/general-ledger/upload (Record<string, unknown>), POST /ai/general-ledger/initialise (gl_file_path, fiscal_year), GET /ai/general-ledger/status, GET /ai/general-ledger/transactions, GET /ai/general-ledger/export (query params)
- **Chat**: POST /ai/chat/sessions, POST /ai/chat/sessions/:sessionId/upload, GET /ai/chat/jobs/:docId, GET /ai/chat/review/:docId
- **Chart of Accounts**: GET/POST/DELETE /ai/chart-of-accounts (upsert with accounts array)
- **Categorisation Rules**: GET/POST /ai/categorisation-rules
- **LLM Usage**: GET /ai/llm/usage (query: period), PUT /ai/llm/usage (set budget)

**9. Billing Module Tests** (Priority: LOW) — `billing.e2e-spec.ts`
- GET /billing/balance → Credit balance for company
- POST /billing/top-up → TopUpCreditDto: amount (IsNumber, Min 0.01), reference (optional), metadata (optional)
- GET /billing/transactions → ListTransactionsQueryDto: type, fromDate, toDate, page, limit (all optional)

**10. Activity-Log Module Tests** (Priority: LOW) — `activity-log.e2e-spec.ts`
- GET /activity-logs → ListActivityQueryDto: action, entityType, userId (IsUUID), fromDate, toDate, page, limit (all optional, with @Type transformers)

**11. Unit Tests (No HTTP — Pure Logic)**

- `tenant-resolver.spec.ts` — userId → companyId mapping via CompanyMember lookup, throws when no membership
- `ai-api.client.spec.ts` — Axios 4xx re-throw with AI message as BadGatewayException, 5xx/network → generic "unavailable", `x-tenant-id` + `x-user-id` header injection

**12. Global / Bootstrap Tests** — `app.e2e-spec.ts`
- Migrations run before app initialization
- Global prefix `/api` applied
- CORS enabled with correct origins
- ValidationPipe configured (whitelist, transform)
- Cookie parser middleware
- Error handling: ValidationPipe 400s, AuthGuard 401s, 404 for missing resources

#### Estimated Test Coverage

| Module | Controller | Service | DTO | Guard | Integration | Total |
|--------|-----------|---------|-----|-------|-------------|-------|
| Auth | 25 | 15 | 8 | 8 | 5 | 61 |
| Company | 15 | 8 | 5 | — | 3 | 31 |
| Document | 18 | 10 | 5 | — | 4 | 37 |
| AI-Proxy | 20 | 12 | 3 | — | 8 | 43 |
| Session | 8 | 5 | 3 | — | 2 | 18 |
| Case | 8 | 5 | 3 | — | 2 | 18 |
| Chat | 10 | 6 | 2 | — | 3 | 21 |
| Company-Member | 8 | 5 | 3 | — | 2 | 18 |
| Billing | 6 | 4 | 3 | — | 1 | 14 |
| Activity-Log | 5 | 3 | 2 | — | 1 | 11 |
| User | 5 | 3 | 2 | — | 1 | 11 |
| Global/Boot | — | — | — | 3 | 5 | 8 |
| **TOTAL** | **128** | **76** | **39** | **11** | **37** | **291** |

#### Testing Code Patterns

**E2E Test Pattern:**
```typescript
describe('DocumentController (e2e)', () => {
  let app: INestApplication
  let authCookie: string

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()
    app = module.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.use(cookieParser())
    await app.init()
    authCookie = await seedTestUserAndGetCookie(app)
  })

  afterAll(() => app.close())

  it('uploads a file and creates a document', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/documents')
      .set('Cookie', authCookie)
      .attach('file', Buffer.from('test'), 'invoice.pdf')
      .field('sessionId', testSessionId)
      .expect(201)
    expect(res.body).toHaveProperty('id')
  })

  it('rejects without file', async () => {
    await request(app.getHttpServer())
      .post('/api/documents')
      .set('Cookie', authCookie)
      .send({ sessionId: testSessionId })
      .expect(400)
  })

  it('rejects unauthenticated', async () => {
    await request(app.getHttpServer())
      .post('/api/documents')
      .expect(401)
  })
})
```

**DTO Validation Pattern:**
```typescript
describe('RegisterDto', () => {
  it('should validate valid email', async () => {
    const dto = new RegisterDto()
    dto.email = 'test@example.com'
    dto.name = 'Test User'
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should fail invalid email', async () => {
    const dto = new RegisterDto()
    dto.email = 'invalid-email'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})
```

**File Upload Test Pattern:**
```typescript
it('should reject without file', async () => {
  await request(app.getHttpServer())
    .post('/api/documents')
    .set('Cookie', authCookie)
    .field('sessionId', testSessionId)
    .expect(400)
})

it('should accept with valid file', async () => {
  await request(app.getHttpServer())
    .post('/api/documents')
    .set('Cookie', authCookie)
    .attach('file', Buffer.from('pdf-content'), { filename: 'test.pdf', contentType: 'application/pdf' })
    .field('sessionId', testSessionId)
    .expect(201)
})
```

---

### 7.3 Frontend E2E Tests (Playwright)

> Using **Playwright** — free (Apache 2.0, by Microsoft).
> Auto-click/input, built-in visual snapshots (`toHaveScreenshot()`), cross-browser, trace viewer.

#### Setup
```bash
cd apps/web
npm init playwright@latest
```

#### Configuration (`apps/web/playwright.config.ts`)
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
```

#### Test Files (`apps/web/e2e/`)

| File | What it Tests | Key Interactions |
|---|---|---|
| `auth.spec.ts` | Login flow | Fill email → Submit → OTP page → Verify → Dashboard |
| `chat.spec.ts` | Chat session | Create session → Type message → See AI response → Delete |
| `documents.spec.ts` | Document upload | Navigate → Upload file → See in list → Trigger OCR → Check status |
| `ledger.spec.ts` | Ledger page | View GL → Upload GL → Export GL → Status changes |
| `settings.spec.ts` | Settings tabs | Navigate tabs → Invite member → Change role → View usage |
| `navigation.spec.ts` | Sidebar nav | Click each nav item → Verify page loads → Visual snapshot |

#### Snapshot Tests
```typescript
test('dashboard loads correctly', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('[data-testid="dashboard"]')
  await expect(page).toHaveScreenshot('dashboard.png', {
    maxDiffPixelRatio: 0.05,
  })
})
```

Snapshots stored in `e2e/__snapshots__/` — committed to git as baseline.

---

### 7.4 Turbo Pipeline Integration

Add to `turbo.json`:
```json
{
  "test": { "dependsOn": ["^build"], "cache": false },
  "test:e2e": { "dependsOn": ["build"], "cache": false }
}
```

Add to root `package.json`:
```json
{
  "test": "turbo run test",
  "test:e2e": "turbo run test:e2e"
}
```

### 7.5 Execution Order

1. Create test Docker environment — `docker-compose.test.yml`, `.env.test`, `scripts/test-setup.sh`
2. Create skills — `backend-testing`, `api-docs`, `e2e-testing`
3. Install API docs deps — `@nestjs/swagger`, `@scalar/nestjs-api-reference`
4. Add Swagger decorators to all 12 controllers + all DTOs
5. Configure Scalar in `main.ts`
6. Write backend E2E tests — 10 test files + 2 unit tests + helpers
7. Install Playwright in `apps/web`
8. Write frontend E2E tests — 6 test files with snapshots
9. Add test scripts to turbo.json pipeline
10. Verify everything — `pnpm test` (backend), `pnpm test:e2e` (frontend)

---

## 8. Phase 5 — Webhooks (DEFERRED — Pending Approval)

> ⚠️ **This phase is NOT to be executed until Jason explicitly approves it.** The webhook design needs to be discussed with colleagues first. The rest of the system (Phases 1–4) works via polling or synchronous proxy calls without webhooks.

### What This Phase Will Add

Webhook endpoints that the AI-API calls back to notify us of completed async operations.

**File:** `src/modules/webhooks/`

#### Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/webhooks/ocr/job-completed` | OCR extraction completed or failed |
| `POST` | `/webhooks/document/enriched` | Document enrichment completed |

#### Webhook Security

```typescript
// Validate webhook via shared secret in header
WebhookGuard:
  canActivate(context)
    → Check header 'x-webhook-secret' matches env WEBHOOK_SECRET
    → Return true/false
```

#### Webhook: OCR Job Completed

```
POST /webhooks/ocr/job-completed
Body: {
  tenantId: string,         // maps to our company.id
  docId: string,            // maps to our Document by external reference
  status: "COMPLETED" | "FAILED",
  ocrJsonKey?: string,      // S3 key of OCR output
  extractedFields?: object  // parsed fields from OCR
}

Handler:
  1. Find Document by matching criteria (companyId from tenantId, docId)
  2. If status === "COMPLETED":
     → documentService.updateExtractionResult(docId, extractedFields, ...)
     → Set extractionStatus = COMPLETED
     → Copy extractedFields → rawData (immutable) + draftData (mutable copy)
  3. If status === "FAILED":
     → documentService.updateExtractionFailed(docId, errorMessage)
     → Set extractionStatus = FAILED
  4. Log ActivityLog: "document.extraction_completed" or "document.extraction_failed"
  5. Record CreditTransaction (USAGE) if completed
  6. Return 200 OK
```

#### Webhook: Document Enriched

```
POST /webhooks/document/enriched
Body: {
  tenantId: string,
  docId: string,
  status: "success" | "error",
  enrichedData?: object,
  errorMessage?: string
}

Handler:
  1. Find Document
  2. If success:
     → Merge enrichedData into draftData
     → Set documentStatus = UNDER_REVIEW
  3. If error:
     → Log error, set extractionStatus = FAILED
  4. Log ActivityLog: "document.enriched"
  5. Return 200 OK
```

#### Additional Environment Variable

```env
WEBHOOK_SECRET=your-webhook-shared-secret  # Shared secret for webhook auth
```

---

## 9. Environment Variables

### Backend (new additions)

```env
# AI-API Integration
AI_API_BASE_URL=http://localhost:8000      # AI-API Django server URL (fake for now, replace when ready)

# Existing (already configured)
AWS_ASSETS_BUCKET_NAME=marcx-assets
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
DATABASE_URL=postgresql://...
JWT_SECRET=xxx
RESEND_API_KEY=xxx
```

### Frontend (new additions)

```env
# Existing
NEXT_PUBLIC_API_URL=http://localhost:4000   # Backend URL
API_URL=http://localhost:4000              # Server-side backend URL
```

---

## 10. Data Flow Sequences

### 10.1 Document Upload & Extraction (Full Flow)

```
Frontend                    Backend (NestJS)              AI-API (Django)              S3
   │                            │                             │                        │
   │ POST /ai/ocr/presign      │                             │                        │
   │ { filename, contentType }  │                             │                        │
   │ ──────────────────────────>│                             │                        │
   │                            │ Resolve tenantId from user  │                        │
   │                            │ POST /api/ocr/presign       │                        │
   │                            │ ───────────────────────────>│                        │
   │                            │ { url, docId }              │                        │
   │                            │ <───────────────────────────│                        │
   │                            │ Create File record          │                        │
   │                            │ Create Document (PENDING)   │                        │
   │ { url, docId, documentId } │                             │                        │
   │ <──────────────────────────│                             │                        │
   │                            │                             │                        │
   │ PUT url (upload to S3)     │                             │                        │
   │ ─────────────────────────────────────────────────────────────────────────────────>│
   │                            │                             │                        │
   │ POST /ai/ocr/jobs/:docId/run                             │                        │
   │ ──────────────────────────>│                             │                        │
   │                            │ POST /api/ocr/jobs/T/D/run  │                        │
   │                            │ ───────────────────────────>│                        │
   │                            │ { status: running }         │                        │
   │                            │ <───────────────────────────│                        │
   │                            │ Update Document:            │                        │
   │                            │   extractionStatus=PROCESSING                       │
   │ { status: processing }     │                             │                        │
   │ <──────────────────────────│                             │                        │
   │                            │                             │                        │
   │         ... frontend polls ...                           │                        │
   │                            │                             │                        │
   │ GET /ai/ocr/jobs/:docId/status (poll every few seconds)  │                        │
   │ ──────────────────────────>│                             │                        │
   │                            │ GET /api/ocr/jobs/T/D       │                        │
   │                            │ ───────────────────────────>│                        │
   │                            │ { status: COMPLETED, ... }  │                        │
   │                            │ <───────────────────────────│                        │
   │                            │ Update Document:            │                        │
   │                            │   rawData = extractedFields │                        │
   │                            │   draftData = copy(rawData) │                        │
   │                            │   extractionStatus=COMPLETED│                        │
   │                            │   Record CreditTransaction  │                        │
   │                            │   Log ActivityLog           │                        │
   │ { document with draftData }│                             │                        │
   │ <──────────────────────────│                             │                        │
```

> **Note:** When Phase 5 (webhooks) is approved, the polling loop can be replaced with a push-based callback from AI-API → our webhook endpoint, which is more efficient.

### 10.2 Chat with AI (Message Flow)

```
Frontend                    Backend (NestJS)              AI-API (Django)
   │                            │                             │
   │ POST /chat/sessions/S/messages                           │
   │ { content: "Analyze..." } │                             │
   │ ──────────────────────────>│                             │
   │                            │ Store user ChatMessage      │
   │                            │ POST /api/chat/sessions/S/messages
   │                            │ { message: "Analyze..." }   │
   │                            │ ───────────────────────────>│
   │                            │ { role: assistant,          │
   │                            │   content: "I found...",    │
   │                            │   metadata: { intent, ... } │
   │                            │ } (or waiting_for_job:true) │
   │                            │ <───────────────────────────│
   │                            │ Store assistant ChatMessage │
   │                            │   with metadata JSONB       │
   │ { message with metadata }  │                             │
   │ <──────────────────────────│                             │
```

### 10.3 Document Review & Approval

```
Frontend                    Backend (NestJS)
   │                            │
   │ GET /documents/:id         │
   │ ──────────────────────────>│
   │ { draftData: {...} }       │
   │ <──────────────────────────│
   │                            │
   │ User edits fields...       │
   │                            │
   │ PATCH /documents/:id       │
   │ { draftData: { edited } }  │
   │ ──────────────────────────>│
   │                            │ Update draftData
   │ { updated document }       │
   │ <──────────────────────────│
   │                            │
   │ POST /documents/:id/approve│
   │ ──────────────────────────>│
   │                            │ Copy draftData → approvedData
   │                            │ Set status = APPROVED
   │                            │ Log ActivityLog
   │ { approved document }      │
   │ <──────────────────────────│
```

### 10.4 Credit Top-Up & Usage

```
Frontend                    Backend (NestJS)
   │                            │
   │ POST /companies/C/credit/top-up
   │ { amount: 100.00 }        │
   │ ──────────────────────────>│
   │                            │ BEGIN TRANSACTION:
   │                            │   Insert CreditTransaction(TOP_UP, +100)
   │                            │   Update CompanyCredit.balance += 100
   │                            │   Set balanceAfter
   │                            │ COMMIT
   │                            │ Log ActivityLog
   │ { transaction, newBalance }│
   │ <──────────────────────────│
   │                            │
   │      ... later, AI extraction completes ...
   │                            │
   │                            │ recordUsage(companyId, 0.50, "AI extraction: invoice.pdf",
   │                            │   { model: "claude-3-5-sonnet", tokens: 1500 })
   │                            │ BEGIN TRANSACTION:
   │                            │   Insert CreditTransaction(USAGE, -0.50)
   │                            │   Update CompanyCredit.balance -= 0.50
   │                            │   Set balanceAfter
   │                            │ COMMIT
```

---

## 11. Implementation Order & Dependencies

### Phase 1: Backend API Completion

```
Step 1.1: ActivityLog module (no deps — used by everything else)
Step 1.2: Billing module (CompanyCredit + CreditTransaction)
Step 1.3: CompanyMember module (move existing getCompanyUsers logic)
Step 1.4: Document module (File + Document CRUD + approve flow)
Step 1.5: Update Session module (fiscalYear support)
Step 1.6: Update Chat module (feedback fields)
Step 1.7: Update File upload flow (auto-create Document on upload)
```

### Phase 2: AI-API Integration (Proxy Layer)

```
Step 2.1: AiApiClient shared service (Axios wrapper with header mapping)
Step 2.2: TenantResolver service (userId → tenantId mapping)
Step 2.3: AI proxy endpoints — Chat AI ⭐ (replace lorem ipsum — HIGHEST PRIORITY)
Step 2.4: AI proxy endpoints — OCR pipeline
Step 2.5: AI proxy endpoints — Document enrichment
Step 2.6: AI proxy endpoints — GL management
Step 2.7: AI proxy endpoints — Tenant management (Chart of Accounts, rules, LLM usage)
Step 2.8: Credit deduction integration (after AI operations)
```

### Phase 3: Frontend Wiring

```
Step 3.1: New backend client classes (document, billing, ai, member)
Step 3.2: Chat page — real AI responses ⭐ (HIGHEST PRIORITY)
Step 3.3: Documents page — upload, extraction status, review UI
Step 3.4: Ledger page — GL status, transactions, export
Step 3.5: Profile page — membership, credit balance
Step 3.6: Settings page — company, members, chart of accounts
Step 3.7: UX polish — loading states, error messages, optimistic updates
```

### Phase 4: Testing

```
Step 4.1: Backend unit tests (all new services)
Step 4.2: Integration tests (full flows)
Step 4.3: Frontend component tests (deferred)
```

### Phase 5: Webhooks (BLOCKED — pending Jason's approval)

```
Step 5.1: WebhookGuard (shared secret validation)
Step 5.2: OCR job-completed webhook endpoint
Step 5.3: Document enriched webhook endpoint
Step 5.4: Webhook-specific tests
```

---

## Appendix A: AI-API Endpoint Quick Reference

Comprehensive mapping from our backend proxy routes to AI-API endpoints:

| Our Route | AI-API Route | Method | Purpose |
|-----------|-------------|--------|---------|
| `/ai/ocr/presign` | `/api/ocr/presign` | POST | Get presigned S3 upload URL |
| `/ai/ocr/jobs/:docId/status` | `/api/ocr/jobs/{tenantId}/{docId}` | GET | Poll OCR extraction status |
| `/ai/ocr/jobs/:docId/run` | `/api/ocr/jobs/{tenantId}/{docId}/run` | POST | Trigger OCR pipeline |
| `/ai/ocr/jobs/:docId/process` | `/api/ocr/jobs/{tenantId}/{docId}/process` | POST | Post extracted data to general ledger |
| `/ai/documents/:docId/enrich` | `/api/documents/enrich` | POST | Run enrichment pipeline |
| `/ai/documents/:docId/candidates` | `/api/documents/{tenantId}/{docId}/candidates` | GET | Get ranked account code candidates |
| `/ai/documents/:docId/confirm` | `/api/documents/confirm` | POST | Confirm reviewed document fields |
| `/ai/documents/:docId/gl-prepare` | `/api/documents/{tenantId}/{docId}/gl-prepare` | POST | Build general ledger-ready payload |
| `/ai/general-ledger/upload` | `/api/gl/upload` | POST | Upload general ledger file (multipart) |
| `/ai/general-ledger/initialise` | `/api/gl/initialise` | POST | Initialise general ledger from file |
| `/ai/general-ledger/status` | `/api/tenants/{tenantId}/gl/status` | GET | General ledger status + trial balance |
| `/ai/general-ledger/transactions` | `/api/tenants/{tenantId}/gl/transactions` | GET | Paginated general ledger transactions |
| `/ai/general-ledger/export` | `/api/tenants/{tenantId}/gl/export` | GET | Export general ledger as Excel |
| `/ai/chart-of-accounts` | `/api/tenants/{tenantId}/chart-of-accounts` | GET/POST/DELETE | Chart of accounts |
| `/ai/categorisation-rules` | `/api/tenants/{tenantId}/categorisation-rules` | GET/POST | Categorisation rules |
| `/ai/llm/usage` | `/api/tenants/{tenantId}/llm/usage` | GET/PUT | LLM usage stats and budget limits |

> Webhook routes (`/webhooks/*`) are deferred to Phase 5.

## Appendix B: Database Tables ↔ API Coverage Matrix

| Table | Existing API | New API (Phase 1) | AI-API Integration (Phase 2) |
|-------|-------------|-------------------|------------------------------|
| `Company` | ✅ Full CRUD | — | Mapped as `tenantId` (= company.id) |
| `User` | ✅ Read/Update | — | Mapped as `x-user-id` |
| `CompanyMember` | Partial (list via company) | ✅ Full CRUD | — |
| `Credential` | ✅ (via auth) | — | — |
| `VerificationToken` | ✅ (via auth) | — | — |
| `Session` | ✅ CRUD | Add `fiscalYear` | Chat sessions mirrored to AI-API |
| `ChatMessage` | ✅ CRUD | Add feedback fields | **AI response + metadata (core integration)** |
| `File` | ✅ Upload + DB | Auto-create Document | OCR presign |
| `Document` | ❌ None | ✅ Full CRUD + approve | Extraction + enrichment |
| `CompanyCredit` | ❌ None | ✅ Balance + top-up | Usage deduction |
| `CreditTransaction` | ❌ None | ✅ List + internal create | Auto-created on AI usage |
| `ActivityLog` | ❌ None | ✅ List + internal log | Logged on all operations |

---

## 12. How to Execute This Plan

### Prerequisites

Before starting implementation, ensure:

1. **Schema is deployed** — `packages/drizzle/src/schema.ts` has been built and exported (`pnpm build` in `packages/drizzle`).
2. **Database migrations are run** — All 12 tables + enums exist in your local/staging PostgreSQL.
3. **Backend compiles** — `npx tsc --noEmit` passes in `apps/backend` (already verified ✅).
4. **AI-API URL is set** — Add `AI_API_BASE_URL` to your backend `.env` (can be placeholder until Django server is ready).
5. **Review copilot instructions** — Read `.github/copilot-instructions.md` for project conventions (NestJS patterns, error handling, tenant=company, etc.).

### Execution Instructions

**For Jason:**
1. Review this plan. If you want changes, edit this file directly or tell the agent.
2. When ready, tell the agent: "Start Phase 1" (or whichever phase).
3. Each phase should be executed sequentially (Phase 1 before Phase 2, etc.).
4. After each phase, verify: `npx tsc --noEmit` passes, manual smoke test if desired.
5. Phase 5 (Webhooks) is blocked — only start when you give explicit approval.

**For AI Agent (executing the plan):**
1. **Always read this file first** before writing any code.
2. **Read `.github/copilot-instructions.md`** for coding conventions.
3. **Read `packages/drizzle/src/schema.ts`** for all table/type definitions.
4. **Read `ai-api/BACKEND_API_GUIDE.md`** when working on Phase 2 (AI-API integration).
5. Execute steps in order within each phase. Each step should result in compilable code.
6. After completing each step, run `npx tsc --noEmit` in `apps/backend` to verify.
7. When a module is complete, update this plan by adding `✅` next to the completed step.
8. If you encounter ambiguity, check the design docs in `packages/drizzle/LEDGER_SCHEMA_DESIGN.md` and `packages/drizzle/mermaid.md`.

### Key Files to Reference

| File | When to Read |
|------|-------------|
| `IMPLEMENTATION_PLAN.md` (this file) | Always — master plan |
| `.github/copilot-instructions.md` | Before any coding — conventions |
| `packages/drizzle/src/schema.ts` | Schema types and table definitions |
| `packages/drizzle/LEDGER_SCHEMA_DESIGN.md` | Design decisions and rationale |
| `ai-api/BACKEND_API_GUIDE.md` | Phase 2 — AI-API endpoints and flows |
| `design/*.png` | Phase 3 — UI mockups for frontend |

### Phase Completion Checklist

- [ ] **Phase 1:** All new backend modules compile. CRUD endpoints work for Document, Billing, CompanyMember, ActivityLog.
- [ ] **Phase 2:** AI-API proxy endpoints work. Chat returns real AI responses (not lorem ipsum). OCR pipeline callable.
- [ ] **Phase 3:** Frontend pages wired to real backend. Chat, Documents, Ledger, Settings pages functional.
- [ ] **Phase 4:** Unit and integration tests pass for all new modules.
- [ ] **Phase 5:** ⏸️ BLOCKED — Webhook endpoints (pending Jason's approval after colleague discussion).
