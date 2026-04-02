# Ledger Schema Design

**Status:** v2 — implemented & migrated (migrations `0001`–`0005` applied)
**Tables:** 13 active tables + Invitation added in `0004`, Ledger added + File removed in `0005`

**Context:** AI-powered accounting workflow. Users create a General Ledger (GL) for a fiscal year, open chat sessions under it, upload financial documents (invoices, receipts, bank statements), and the AI extracts and structures the data. v1 focuses on document extraction and processing. Double-entry ledger (`Account`, `JournalEntry`, `JournalEntryLine`) is deferred to v2.

---

## User Flow

```
User creates a Ledger (company + fiscal year — unique per company per year)
  └─ Opens a Session (chat thread, linked to Ledger via ledgerId)
       └─ Uploads files via chat (invoice, receipt, bank statement, etc.)
            └─ Document record created with file metadata inline
               (name, url, size, mimeType stored on Document — no separate File table)
                 └─ AI processes file → rawData populated (immutable)
                      └─ draftData populated (copy of rawData; user reviews & corrects)
                           └─ User approves → approvedData snapshot (immutable)
                                └─ CreditTransaction written (USAGE)
```

The GL view = query Ledger by `ledger_scope_id` on AI API using `Ledger.fiscalYear` + `Company.id`.

---

## Table Overview

### Auth & Identity
| Table | Status | Purpose |
|---|---|---|
| `Company` | Modified | Multi-level company hierarchy via `parentId` self-ref |
| `User` | Modified | Removed `companyId` and `role` — moved to `CompanyMember` |
| `CompanyMember` | New | Junction: user ↔ company with role |
| `Credential` | Unchanged | Email/OAuth credentials per user |
| `VerificationToken` | Unchanged | Email verification, password reset, login tokens |
| `Invitation` | **New (0004)** | Email invitation flow — invite link even for non-users |

### General Ledger
| Table | Status | Purpose |
|---|---|---|
| `Ledger` | **New (0005)** | GL wrapper — one per company per fiscal year. `id` = `ledger_scope_id` for AI API |

### Workspace
| Table | Status | Purpose |
|---|---|---|
| `Session` | Modified | Removed `fiscalYear`; added `ledgerId` FK → Ledger |
| `ChatMessage` | Modified | Added `metadata`, `feedback`, `feedbackNote`; `ChatRole` expanded to `SYSTEM`/`TOOL` |

### Document
| Table | Status | Purpose |
|---|---|---|
| `Document` | Modified (0005) | File metadata merged in (`name`, `url`, `size`, `mimeType`). Added `ledgerId`, `chatId`, `uploadSource`. Removed `fileId`. |
| `File` | **Removed (0005)** | Merged into Document — no longer exists |

### Billing
| Table | Status | Purpose |
|---|---|---|
| `CompanyCredit` | New | Credit wallet per company (cached balance) |
| `CreditTransaction` | New | Every credit movement — top-up, usage, refund, adjustment |

### Platform
| Table | Status | Purpose |
|---|---|---|
| `ActivityLog` | New | Append-only event stream across all entities |

### Dropped (pre-v1)
| Table | Reason |
|---|---|
| `CaseInfo` | Not relevant to GL workflow |
| `Contact` | Vendor info lives in Document JSONB; normalise in v2 |
| `AccountingPeriod` | Overhead for v1; filter by date range in queries |
| `Account` | Deferred — no double-entry ledger in v1 |
| `JournalEntry` | Deferred — no double-entry ledger in v1 |
| `JournalEntryLine` | Deferred — no double-entry ledger in v1 |

---

## Schema Fields Reference

### `Ledger`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | = `ledger_scope_id` for AI API |
| `companyId` | `uuid FK` | = `tenant_id` for AI API |
| `creatorId` | `uuid FK → User` | Audit identity |
| `name` | `varchar(255)` | e.g. "FY 2024 General Ledger" |
| `fiscalYear` | `integer` | Unique per company — enforced via index |
| `status` | `LedgerStatus` | `ACTIVE \| CLOSED \| ARCHIVED` |
| `description` | `text` | Nullable |
| `deletedAt` | `timestamp` | Soft-delete |
| `updatedAt` | `timestamp` | |
| `createdAt` | `timestamp` | |

### `Session` (updated)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | = `external_session_id` for AI API |
| `companyId` | `uuid FK` | |
| `creatorId` | `uuid FK → User` | Stable audit identity |
| `ledgerId` | `uuid FK → Ledger` | **New** — nullable; links session to a GL |
| `title` | `text` | |
| `description` | `text` | Nullable |
| `status` | `text` | `open \| closed` |
| `summary` | `text` | AI-maintained context compression |
| `createdAt` | `timestamp` | |
| `updatedAt` | `timestamp` | |
| ~~`fiscalYear`~~ | ~~`integer`~~ | **Removed** — moved to `Ledger.fiscalYear` |

### `Document` (updated)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | = `external_file_id` for AI API |
| `companyId` | `uuid FK` | |
| `sessionId` | `uuid FK → Session` | |
| `ledgerId` | `uuid FK → Ledger` | **New** — nullable |
| `chatId` | `uuid FK → ChatMessage` | **New** — nullable; message that triggered upload |
| `uploadedBy` | `uuid FK → User` | |
| `name` | `text` | **New** — original file name (was on File) |
| `url` | `text` | **New** — S3 storage URL (was on File) |
| `size` | `text` | **New** — bytes as string (was on File) |
| `mimeType` | `text` | **New** — e.g. `application/pdf` (was on File) |
| `uploadSource` | `varchar(32)` | **New** — `chat \| upload \| api \| bulk_import` |
| `documentType` | `DocumentType` | `INVOICE \| RECEIPT \| BANK_STATEMENT \| CONTRACT \| OTHER` |
| `extractionStatus` | `ExtractionStatus` | `PENDING \| PROCESSING \| COMPLETED \| FAILED` |
| `extractedBy` | `text` | AI model name |
| `confidenceScore` | `numeric(4,3)` | 0.000–1.000 |
| `errorMessage` | `text` | Nullable |
| `extractedAt` | `timestamp` | |
| `rawData` | `jsonb` | **IMMUTABLE** — raw AI output |
| `draftData` | `jsonb` | **MUTABLE** — user edits |
| `approvedData` | `jsonb` | **IMMUTABLE** — snapshot on approval |
| `documentStatus` | `DocumentStatus` | `DRAFT \| UNDER_REVIEW \| APPROVED \| POSTED \| VOID` |
| `notes` | `text` | Nullable |
| `postedAt` | `timestamp` | Nullable |
| `postedBy` | `uuid FK → User` | Nullable |
| `deletedAt` | `timestamp` | Soft-delete |
| `createdAt` | `timestamp` | |
| `updatedAt` | `timestamp` | |
| ~~`fileId`~~ | ~~`uuid FK`~~ | **Removed** — File table no longer exists |

### `ChatMessage` (updated)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `sessionId` | `uuid FK` | |
| `userId` | `uuid FK` | |
| `role` | `ChatRole` | `USER \| ASSISTANT \| SYSTEM \| TOOL` (**SYSTEM + TOOL new**) |
| `content` | `text` | |
| `metadata` | `jsonb` | model name, token count, tool calls |
| `feedback` | `ChatFeedback` | `HELPFUL \| UNHELPFUL` — nullable |
| `feedbackNote` | `text` | Nullable |
| `createdAt` | `timestamp` | |

### `Invitation` (new, migration 0004)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `companyId` | `uuid FK` | |
| `invitedBy` | `uuid FK → User` | |
| `email` | `text` | Invitee email |
| `role` | `MemberRole` | Role to assign on accept |
| `token` | `text` | Unique invite token |
| `status` | `InvitationStatus` | `PENDING \| ACCEPTED \| EXPIRED \| REVOKED` |
| `expiresAt` | `timestamp` | |
| `acceptedAt` | `timestamp` | Nullable |
| `createdAt` | `timestamp` | |
| `updatedAt` | `timestamp` | |

---

## Design Decisions

### 1. `Ledger` as dedicated GL wrapper (v2 change)
The previous design used `Session.fiscalYear` to double a session as a GL context. This was inflexible — one session per fiscal year and no way to have multiple chat threads per GL. The new `Ledger` table is a proper GL book per company per fiscal year. Multiple sessions can belong to one Ledger via `Session.ledgerId`. `Ledger.id` maps to `ledger_scope_id` on the AI API.

### 2. File→Document merge
`File` and `Document` were always 1:1 — created simultaneously in every code path, with no standalone File use case (Case module is deprecated). Merging eliminates all JOINs and the `fileId` FK. File metadata (`name`, `url`, `size`, `mimeType`) moved directly onto `Document`. Also added `chatId` (which message triggered the upload) and `uploadSource` (how the file arrived).

### 3. `ChatRole` expansion
Added `SYSTEM` (AI system prompt messages) and `TOOL` (tool-call result messages) to `ChatRole`. Required for LangGraph AI API responses which return structured tool call logs alongside regular assistant messages.

### 4. Multi-level Company via `parentId` self-reference
`Company.parentId` nullable FK to itself. `null` = holding/top-level.

### 5. `CompanyMember` junction — multi-company access per user
Schema supports one user belonging to multiple companies at different roles. Backend currently enforces single membership per user on registration. Lift that constraint when multi-company access is needed — no schema migration required.

### 6. Three JSONB versions on `Document`
- `rawData` — immutable. Raw AI output, written once, never overwritten.
- `draftData` — mutable. User reviews and corrects fields here.
- `approvedData` — immutable. Snapshot written once on approval.

Feedback signal = diff between `rawData` and `approvedData`. No separate feedback table needed.

### 7. Credit-based billing
One wallet per company (`CompanyCredit`). Every movement is a `CreditTransaction` row. Balance is cached on `CompanyCredit` and updated transactionally per insert.

### 8. `Session.creatorId` → `User`, not `CompanyMember`
`creatorId` is a FK to `User` (not `CompanyMember`) by design. Membership records can be deleted or changed, which would corrupt the audit trail. If creator's role is needed, JOIN through `companyMember` on `(userId, companyId)` at query time.

### 9. Soft-delete on Document and Ledger
`deletedAt TIMESTAMPTZ` on both. Financial documents and GL books must never be hard-deleted.

### 10. Invitation as its own table (not pending CompanyMember)
Invitation requires state (`PENDING | ACCEPTED | EXPIRED | REVOKED`), an expiry, and must work for users who don't have an account yet. A pending `CompanyMember` row would pollute membership queries and lacks expiry/revocation semantics.

---

## Enums

```
Existing (unchanged):
  CredentialType:        EMAIL | OAUTH
  ProviderType:          GOOGLE
  VerificationPurpose:   EMAIL_VERIFICATION | PASSWORD_RESET | LOGIN
  Category:              ACCOUNTING | MARKETING
  MemberRole:            OWNER | ADMIN | ACCOUNTANT | VIEWER
  DocumentType:          INVOICE | RECEIPT | BANK_STATEMENT | CONTRACT | OTHER
  ExtractionStatus:      PENDING | PROCESSING | COMPLETED | FAILED
  DocumentStatus:        DRAFT | UNDER_REVIEW | APPROVED | POSTED | VOID
  CreditTransactionType: TOP_UP | USAGE | REFUND | ADJUSTMENT
  ChatFeedback:          HELPFUL | UNHELPFUL

Updated (migration 0005):
  ChatRole:              USER | ASSISTANT | SYSTEM | TOOL   (was: USER | ASSISTANT)

New (migration 0005):
  LedgerStatus:          ACTIVE | CLOSED | ARCHIVED

New (migration 0004):
  InvitationStatus:      PENDING | ACCEPTED | EXPIRED | REVOKED

Deferred to v2 (double-entry ledger):
  AccountType:           ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE
  JournalEntryStatus:    DRAFT | POSTED | VOID
  EntryType:             DEBIT | CREDIT
```

---

## Key Indexes

```sql
-- Ledger
UNIQUE (companyId, fiscalYear)   WHERE deletedAt IS NULL
INDEX  (companyId)

-- CompanyMember
UNIQUE (userId, companyId)
INDEX  (companyId)

-- Company hierarchy
INDEX  (parentId)                WHERE parentId IS NOT NULL

-- CompanyCredit
UNIQUE (companyId)

-- CreditTransaction
INDEX  (companyCreditId)
INDEX  (companyCreditId, type)

-- Document
INDEX  (companyId, documentStatus)  WHERE deletedAt IS NULL
INDEX  (sessionId)
INDEX  (ledgerId)
INDEX  (extractionStatus)           WHERE extractionStatus IN ('PENDING','PROCESSING')
GIN    (draftData)

-- ActivityLog
INDEX  (companyId, createdAt)
INDEX  (entityType, entityId)
INDEX  (userId)                  WHERE userId IS NOT NULL
```

---

## Representative Queries

### Documents in a Ledger
```sql
SELECT d.*
FROM "Document" d
WHERE d."ledgerId" = $1
  AND d."deletedAt" IS NULL
ORDER BY d."createdAt" DESC;
```

### Sessions for a Ledger
```sql
SELECT s.*
FROM "Session" s
WHERE s."ledgerId" = $1
ORDER BY s."createdAt" DESC;
```

### Documents uploaded via chat in a session
```sql
SELECT d.*
FROM "Document" d
WHERE d."sessionId" = $1
  AND d."uploadSource" = 'chat'
  AND d."deletedAt" IS NULL
ORDER BY d."createdAt" DESC;
```

### AI usage cost for a company this month
```sql
SELECT
  ct."metadata"->>'model'                       AS "model",
  COUNT(*)                                       AS "requests",
  SUM((ct."metadata"->>'tokens')::int)           AS "totalTokens",
  SUM((ct."metadata"->>'cost')::numeric)         AS "totalCost",
  ABS(SUM(ct."amount"))                          AS "creditsConsumed"
FROM "CreditTransaction" ct
JOIN "CompanyCredit" cc ON cc."id" = ct."companyCreditId"
WHERE cc."companyId" = $1
  AND ct."type"      = 'USAGE'
  AND ct."createdAt" >= date_trunc('month', NOW())
GROUP BY ct."metadata"->>'model'
ORDER BY "totalCost" DESC;
```

### Trial Balance for a company over a date range
> ⚠️ Deferred to v2 — requires `Account`, `JournalEntry`, `JournalEntryLine` tables.
