# Ledger Schema Design

**Status:** Design finalised (v1, 12 tables) — pending implementation into `schema.ts`
**Context:** AI-powered accounting workflow. Users open a GL session, chat with AI, upload financial documents (invoices, receipts, bank statements), and the AI extracts and structures the data. v1 focuses on document extraction and processing. Double-entry ledger (`Account`, `JournalEntry`, `JournalEntryLine`) is deferred to v2.

---

## User Flow

```
User opens a GL session (scoped to a Company)
  └─ Uploads files via chat (invoice, receipt, bank statement, etc.)
       └─ File record created
            └─ Document record created (1:1 with File) — extractionStatus: PENDING
                 └─ AI processes file → rawData populated (immutable)
                      └─ draftData populated (copy of rawData; user reviews & corrects)
                           └─ User approves → approvedData snapshot (immutable)
                                └─ JournalEntry + JournalEntryLines generated (DRAFT)
                                     └─ User posts → status: POSTED
                                          └─ Account.currentBalance updated transactionally
                                               └─ CreditTransaction written (USAGE)
```

The GL view = query over all POSTED JournalEntryLines grouped by Account.

---

## Table Overview

### Auth & Identity
| Table | Status | Purpose |
|---|---|---|
| `Company` | Modified | Multi-level company hierarchy via `parentId` self-ref |
| `User` | Modified | Removed `companyId` and `role` — moved to `CompanyMember` |
| `CompanyMember` | **New** | Junction: user ↔ company with role; schema supports multi-company, backend enforces one membership per user |
| `Credential` | Unchanged | Email/OAuth credentials per user |
| `VerificationToken` | Unchanged | Email verification, password reset, login tokens |

### Workspace
| Table | Status | Purpose |
|---|---|---|
| `Session` | Modified | Added `fiscalYear`, `summary`; dropped `type`, `priority` |
| `ChatMessage` | Modified | Added `metadata`, `feedback`, `feedbackNote` |
| `File` | Modified | Renamed `type` → `mimeType` |

### Document
| Table | Status | Purpose |
|---|---|---|
| `Document` | **New** | 1:1 with File; AI extraction lifecycle + three JSONB data versions |

### Billing
| Table | Status | Purpose |
|---|---|---|
| `CompanyCredit` | **New** | Credit wallet per company (cached balance) |
| `CreditTransaction` | **New** | Every credit movement — top-up, usage, refund, adjustment |

### Platform
| Table | Status | Purpose |
|---|---|---|
| `ActivityLog` | **New** | Append-only event stream across all entities |

### Dropped
| Table | Reason |
|---|---|
| `CaseInfo` | Not relevant to GL workflow |
| `Contact` | Vendor info lives in Document JSONB; normalise in v2 |
| `AccountingPeriod` | Overhead for v1; filter by date range in queries |
| `Account` | Deferred — no double-entry ledger in v1 |
| `JournalEntry` | Deferred — no double-entry ledger in v1 |
| `JournalEntryLine` | Deferred — no double-entry ledger in v1 |

---

## Design Decisions

### 1. Multi-level Company via `parentId` self-reference
`Company.parentId` nullable FK to itself. `null` = holding/top-level. Any depth supported. Same pattern as `Account` hierarchy.

### 2. `CompanyMember` junction — multi-company access per user
Schema supports one user belonging to multiple companies at different roles. Backend currently enforces a single membership per user during registration. Lift that constraint when multi-company access is needed — no schema migration required.

### 3. Role hierarchy — 4 levels (per company, via `CompanyMember`)

### 4. JSONB for all extracted document data
AI output varies by document type. Three versions handle the review lifecycle cleanly without schema changes per doc type.

### 5. Three JSONB versions on `Document`
- `rawData` — immutable. Raw AI output, written once, never overwritten.
- `draftData` — mutable. User reviews and corrects fields here.
- `approvedData` — immutable. Snapshot written once on approval.

Feedback signal = diff between `rawData` and `approvedData`. No separate feedback table needed.

### 6. `amount` + `entryType` instead of `debit`/`credit` columns
Two columns where one is always 0 is redundant. Single `amount NUMERIC(19,4) > 0` with `entryType DEBIT|CREDIT` is normalised. Reserved for when double-entry ledger tables are added in v2.


### 7. Credit-based billing via `CompanyCredit` + `CreditTransaction`
One wallet per company (`CompanyCredit`). Every movement is a `CreditTransaction` row — top-ups, AI usage (with model/token/cost in `metadata`), refunds. Balance is cached on `CompanyCredit` and updated transactionally per insert.

### 8. Chat feedback as fields, not a table
`ChatMessage.feedback` (enum: `HELPFUL | UNHELPFUL`) and `feedbackNote` (text) are sufficient for v1. A separate feedback table is only needed if corrections need to feed a rule-generation pipeline (v2 concern).

### 9. `Session.summary` for AI context compression
AI writes a compressed summary of session context as conversations grow. Used as context instead of loading all raw messages — keeps token costs manageable for long sessions.

### 10. `ChatMessage.metadata` (JSONB)
Carries structured AI response data: model name, token counts, tool calls, processing status updates. Essential for rendering rich AI responses beyond plain text.

### 11. `ActivityLog` — append-only event stream
Namespaced `action` strings (`document.uploaded`, `credit.topped_up`, etc.) across all entities. `varchar` not enum — event types grow constantly and migrations per new event type are wasteful. Not a replacement for `CreditTransaction` — that has financial integrity requirements. ActivityLog is for observability.

### 13. `Session.creatorId` → `User`, not `CompanyMember`
`creatorId` is a FK to `User` (not `CompanyMember`) by design. The session already carries `companyId` for company context. `creatorId` answers *who* created the session — that is a permanent user identity, not a role/membership. Linking to `CompanyMember` would be problematic: membership records can be deleted or changed, which would corrupt the audit trail. If the creator's role is needed, JOIN through `companyMember` on `(userId, companyId)` at query time.

`deletedAt TIMESTAMPTZ` on `Document`. Financial documents must never be hard-deleted. Partial indexes on `WHERE deletedAt IS NULL` maintain query performance.

---

## Enums

```
Existing (unchanged):
  CredentialType:       EMAIL | OAUTH
  ProviderType:         GOOGLE
  VerificationPurpose:  EMAIL_VERIFICATION | PASSWORD_RESET | LOGIN
  ChatRole:             USER | ASSISTANT

Modified:
  (none — SessionType removed along with Session.type)

Replaced:
  Role → dropped from User; replaced by MemberRole on CompanyMember
  MemberRole:           OWNER | ADMIN | ACCOUNTANT | VIEWER

New:
  DocumentType:         INVOICE | RECEIPT | BANK_STATEMENT | CONTRACT | OTHER
  ExtractionStatus:     PENDING | PROCESSING | COMPLETED | FAILED
  DocumentStatus:       DRAFT | UNDER_REVIEW | APPROVED | POSTED | VOID
  CreditTransactionType: TOP_UP | USAGE | REFUND | ADJUSTMENT
  ChatFeedback:         HELPFUL | UNHELPFUL

Deferred to v2 (double-entry ledger):
  AccountType:          ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE
  JournalEntryStatus:   DRAFT | POSTED | VOID
  EntryType:            DEBIT | CREDIT
```

---

## Key Indexes

```sql
-- CompanyMember
UNIQUE (userId, companyId)
INDEX  (companyId)

-- Company hierarchy
INDEX  (parentId)                   WHERE parentId IS NOT NULL

-- CompanyCredit
UNIQUE (companyId)

-- CreditTransaction
INDEX  (companyCreditId)
INDEX  (companyCreditId, type)

-- Document
UNIQUE (fileId)
INDEX  (companyId, documentStatus)  WHERE deletedAt IS NULL
INDEX  (sessionId)
INDEX  (extractionStatus)           WHERE extractionStatus IN ('PENDING','PROCESSING')
GIN    (draftData)

-- ActivityLog
INDEX  (companyId, createdAt)
INDEX  (entityType, entityId)
INDEX  (userId)                     WHERE userId IS NOT NULL
```

---

## Representative Queries

### Documents in processing queue for a session
```sql
SELECT
  d."id",
  d."documentType",
  d."extractionStatus",
  d."documentStatus",
  d."confidenceScore",
  d."draftData",
  f."name" AS "fileName"
FROM "Document" d
JOIN "File" f ON f."id" = d."fileId"
WHERE d."sessionId" = $1
  AND d."deletedAt" IS NULL
ORDER BY d."createdAt" DESC;
```

### Trial Balance for a company over a date range
> ⚠️ Deferred to v2 — requires `Account`, `JournalEntry`, `JournalEntryLine` tables.

### AI usage cost for a company this month
```sql
SELECT
  ct."metadata"->>'model'                             AS "model",
  COUNT(*)                                             AS "requests",
  SUM((ct."metadata"->>'tokens')::int)                AS "totalTokens",
  SUM((ct."metadata"->>'cost')::numeric)              AS "totalCost",
  ABS(SUM(ct."amount"))                               AS "creditsConsumed"
FROM "CreditTransaction" ct
JOIN "CompanyCredit" cc ON cc."id" = ct."companyCreditId"
WHERE cc."companyId" = $1
  AND ct."type"      = 'USAGE'
  AND ct."createdAt" >= date_trunc('month', NOW())
GROUP BY ct."metadata"->>'model'
ORDER BY "totalCost" DESC;
```
