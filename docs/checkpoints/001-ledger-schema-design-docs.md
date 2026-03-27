<overview>
Jason is building an AI-powered accounting platform (marcx-ai-monorepo) where users open a General Ledger session, chat with an AI, upload financial documents (invoices, receipts, bank statements), and the AI automatically extracts structured data and compiles it into a double-entry general ledger. The work in this session focused entirely on schema design — iteratively planning, refining, and documenting the Drizzle ORM schema additions needed to support the accounting/ledger feature on top of the existing auth/session/chat schema. No code has been implemented yet; all output is design documentation.
</overview>

<history>
1. **User asked to create a `db-design` skill**
   - Created `.agents/skills/db-design/SKILL.md` — a comprehensive skill file defining the db-design process (entity discovery, normalization, indexing, naming conventions, output format, quality checklist)
   - Registered it in `skills-lock.json` with `sourceType: "local"`

2. **User asked to study `schema.ts` and propose a ledger schema**
   - Read the existing schema: `Company`, `User`, `Credential`, `VerificationToken`, `Session`, `CaseInfo`, `ChatMessage`, `File` with Drizzle ORM + PostgreSQL
   - Proposed 6 new tables: `Contact`, `Account`, `AccountingPeriod`, `FinancialDocument`, `JournalEntry`, `JournalEntryLine` + 8 enums
   - Wrote initial plan to `plan.md` in session state and inserted todos into SQL db

3. **User questioned merging `document_extractions` + `invoices`** → merged into `FinancialDocument`

4. **User said invoice typed columns should be removed** — use JSONB instead with 3 versions: `rawData`, `draftData`, `approvedData`. Dropped `document_line_items` table.

5. **User asked for structured output matching the `db-design` skill format**
   - Rewrote proposal using the skill's output format: ER summary, DDL, indexes, migration notes, design decisions, query examples

6. **User challenged debit/credit columns** → changed to `amount NUMERIC(19,4)` + `entryType DEBIT|CREDIT` enum

7. **User questioned running balance storage** → confirmed it's computed via window function; added `currentBalance` cached field on `Account`

8. **User questioned Contact vs Account** → explained the difference; Contact = real-world counterparty, Account = GL bucket

9. **User asked for a summary of all changes** — produced consolidated table of all 6 tables + 9 enums

10. **User asked to write session progress to repo** → created `packages/drizzle/LEDGER_SCHEMA_DESIGN.md`

11. **User asked for a Mermaid ERD file** → created `packages/drizzle/mermaid.md`

12. **User said mermaid structure should match `AWS_ACCOUNTING_AI_ERD.md` Logical ERD section** (relationships first, then entity blocks, 4-space indent) → rewrote `mermaid.md` to match exactly

13. **User said design is too complicated** — proposed simplification:
    - Drop `Contact`, `AccountingPeriod`, `CaseInfo`
    - Rename `FinancialDocument` → `Document`
    - Replace polymorphic `sourceType`/`sourceId` with simple `documentId FK`
    - Result: 11 tables, 6 new enums

14. **User requested multi-level company + user hierarchy changes**
    - Added `Company.parentId` self-reference
    - Replaced `User.companyId` + `User.role` with `CompanyMember` junction table
    - Refined role enum: `OWNER | ADMIN | ACCOUNTANT | VIEWER`

15. **Updated both docs** with simplified + hierarchy design

16. **User asked to review colleague's `AWS_ACCOUNTING_AI_ERD.md`** for gaps
    - Identified 6 gaps: missing `ChatMessage.metadata`, `Account.keywords`, LLM usage tracking, audit log, feedback/learning loop, `Session.fiscalYear`
    - Concluded colleague's GL model (single-entry float) is worse than ours

17. **User decided to share schema with AI API layer** — agreed to add:
    - `CompanyCredit` + `CreditTransaction` (replaces colleague's `CHAT_TENANTLLMUSAGE`)
    - `ActivityLog` (append-only event stream)
    - `Account.keywords JSONB`
    - `Session.fiscalYear`

18. **User asked about chat feedback and chat history tracking**
    - Chat feedback → two nullable fields on `ChatMessage` (`feedback` enum, `feedbackNote` text), not a separate table
    - Chat history → already covered by `ChatMessage`; add `Session.summary` for AI context compression; agent state/checkpoints belong in AI API layer (DynamoDB/Redis)

19. **User said to proceed** → updated both `mermaid.md` and `LEDGER_SCHEMA_DESIGN.md` with all additions (14 tables total)

20. **User asked to add comments and enums to the mermaid doc** → full rewrite of `mermaid.md` with:
    - `%%` section comments grouping tables by domain
    - Inline field comments on every non-obvious column
    - Enum Reference section (all 9 enums with values)
    - Column Type Reference (shorthand → actual PostgreSQL type)
    - Domain Glossary
</history>

<work_done>
Files created:
- `.agents/skills/db-design/SKILL.md` — comprehensive db-design skill for the CLI
- `packages/drizzle/LEDGER_SCHEMA_DESIGN.md` — full design doc (ER summary, decisions, enums, indexes, queries)
- `packages/drizzle/mermaid.md` — Mermaid ERD with inline comments, enum reference, type reference, glossary

Files modified:
- `skills-lock.json` — registered `db-design` skill with `sourceType: "local"`

Files NOT yet modified (pending implementation):
- `packages/drizzle/src/schema.ts` — the actual Drizzle schema; no code written yet

Work completed:
- [x] Created db-design skill
- [x] Studied existing schema
- [x] Iteratively designed and refined ledger schema (6 rounds of feedback)
- [x] Multi-level company hierarchy design
- [x] CompanyMember role system design
- [x] Credit/billing system design
- [x] ActivityLog design
- [x] Chat feedback design
- [x] Cross-referenced colleague's AWS ERD for gaps
- [x] Written full annotated mermaid.md
- [x] Written full LEDGER_SCHEMA_DESIGN.md
- [ ] Implementation into schema.ts — NOT STARTED
</work_done>

<technical_details>
**Final schema: 14 tables total**

Auth/Identity (5): `Company` (+ parentId), `User` (- companyId, - role), `CompanyMember` (new), `Credential`, `VerificationToken`

Workspace (3): `Session` (+ fiscalYear, + summary), `ChatMessage` (+ metadata jsonb, + feedback enum, + feedbackNote), `File` (type → mimeType)

Ledger (4): `Account` (new, + keywords jsonb, + currentBalance, hierarchical), `Document` (new, 1:1 File), `JournalEntry` (new), `JournalEntryLine` (new)

Billing (2): `CompanyCredit` (new, one wallet per company), `CreditTransaction` (new, append-only)

Platform (1): `ActivityLog` (new, append-only)

**Key design decisions:**
- `Document` merges extraction pipeline + structured data — 3 JSONB versions: `rawData` (immutable AI output), `draftData` (user edits), `approvedData` (locked on approval)
- No `debit`/`credit` columns — use `amount NUMERIC(19,4)` + `entryType DEBIT|CREDIT`
- `Account.currentBalance` is cached, updated transactionally — not computed on every read
- `JournalEntry.documentId` is simple nullable FK — null = manual entry
- `ActivityLog.action` is `varchar` not enum — event types grow constantly
- `CreditTransaction` replaces `CHAT_TENANTLLMUSAGE` — every AI call = a USAGE transaction with `metadata: {model, tokens, cost}`
- Running balance is computed via window function at query time, NOT stored per line
- Soft-delete (`deletedAt`) on `Account`, `Document`, `JournalEntry` — accounting records must never be hard-deleted
- `JournalEntryLine` has no `updatedAt` — immutable once parent entry posted
- `CompanyMember` unique constraint on `(userId, companyId)` — one role per user per company
- Feedback on documents captured via rawData vs approvedData diff — no separate feedback table needed

**Enums (9 new/modified):**
- `MemberRole`: OWNER | ADMIN | ACCOUNTANT | VIEWER (replaces Role)
- `SessionType`: CHAT | CASE | LEDGER (added LEDGER)
- `DocumentType`: INVOICE | RECEIPT | BANK_STATEMENT | CONTRACT | OTHER
- `ExtractionStatus`: PENDING | PROCESSING | COMPLETED | FAILED
- `DocumentStatus`: DRAFT | UNDER_REVIEW | APPROVED | POSTED | VOID
- `AccountType`: ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE
- `JournalEntryStatus`: DRAFT | POSTED | VOID
- `EntryType`: DEBIT | CREDIT
- `CreditTransactionType`: TOP_UP | USAGE | REFUND | ADJUSTMENT
- `ChatFeedback`: HELPFUL | UNHELPFUL

**Dropped from original proposal:** `Contact`, `AccountingPeriod`, `CaseInfo`, polymorphic sourceType/sourceId, separate debit/credit columns, invoice typed columns, document_line_items table

**From colleague's ERD — NOT adopted (v2 or AI API layer concern):** `FIELD_FEEDBACK`, `EXTRACTION_RULES`, `GOLDEN_EXAMPLES`, `TENANT_KNOWLEDGE`, `HISTORICAL_MAPPINGS`, `STRATEGY_PERFORMANCE`, `USER_PROFILES`, LangGraph checkpoints (DynamoDB)
</technical_details>

<important_files>
- `packages/drizzle/src/schema.ts`
  - The actual Drizzle ORM schema to be implemented
  - NOT yet modified — this is the target for the next phase
  - Existing tables: Company, User, Credential, VerificationToken, Session, CaseInfo, ChatMessage, File

- `packages/drizzle/mermaid.md`
  - Final ERD with all 14 tables, relationships, inline field comments, enum reference, column type reference, domain glossary
  - Fully updated — paste the mermaid block into mermaid.live to visualise
  - Structure matches `ai-api/AWS_ACCOUNTING_AI_ERD.md` format (relationships first, then entity blocks)

- `packages/drizzle/LEDGER_SCHEMA_DESIGN.md`
  - Comprehensive design doc: table overview, 16 design decisions with rationale, all enums, key indexes, 4 representative SQL queries
  - Fully updated — the authoritative reference for implementation

- `.agents/skills/db-design/SKILL.md`
  - Local skill defining the db-design process used throughout this session
  - Referenced for output format structure

- `skills-lock.json`
  - Updated to register the db-design skill with sourceType: "local"

- `ai-api/AWS_ACCOUNTING_AI_ERD.md`
  - Colleague's existing AWS/Django ERD — used as comparison reference
  - Identified gaps: ChatMessage.metadata, Account.keywords, fiscalYear, usage tracking, audit log
  - NOT modified
</important_files>

<next_steps>
Remaining work:
- Implement all schema changes into `packages/drizzle/src/schema.ts`

Implementation order (respects FK dependencies):
1. Add all new enums (MemberRole, SessionType update, DocumentType, ExtractionStatus, DocumentStatus, AccountType, JournalEntryStatus, EntryType, CreditTransactionType, ChatFeedback)
2. Modify `Company` — add `parentId FK → self`
3. Modify `User` — remove `companyId`, remove `role`
4. Add `CompanyMember` table
5. Modify `Session` — add `fiscalYear`, `summary`; remove `priority`; update sessionTypeEnum
6. Modify `ChatMessage` — add `metadata`, `feedback`, `feedbackNote`
7. Modify `File` — rename `type` → `mimeType`
8. Add `Account` table (self-ref parentId)
9. Add `Document` table (FK → File, Company, Session, User)
10. Add `JournalEntry` table (FK → Company, Session, Document, User×2)
11. Add `JournalEntryLine` table (FK → JournalEntry, Account)
12. Add `CompanyCredit` table (FK → Company)
13. Add `CreditTransaction` table (FK → CompanyCredit, User)
14. Add `ActivityLog` table (FK → Company, User, Session)
15. Wire up all Drizzle `relations()`
16. Export all new `$inferSelect` / `$inferInsert` types

Note: `CaseInfo` table should be dropped (or left as-is if migration risk). The `role` enum on User and old `sessionTypeEnum` values need careful migration handling.
</next_steps>