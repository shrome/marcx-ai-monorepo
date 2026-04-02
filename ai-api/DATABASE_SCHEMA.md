# Database Schema (Current AWS Build)

System: Receipt OCR AI Categoriser  
Last Updated: March 24, 2026  
Primary DB: AWS RDS PostgreSQL (Django ORM)  
Additional stores: DynamoDB (state/checkpoints), S3 (artifacts)

This document is the source-of-truth schema reference for backend developers, aligned with the current implementation.

Important note:
- This document distinguishes between the **current deployed schema** and **recommended future backend-alignment fields**.
- Unless a field is listed under the “Recommended Future Bridge Fields” section, assume it is part of the current deployed RDS schema.

## 1. Storage Architecture

- RDS PostgreSQL:
  - Persistent business entities for OCR, chat, feedback, enrichment, posting, and audit.
- DynamoDB:
  - LangGraph checkpoint persistence for interrupt/resume.
  - Episodes table in hybrid pipeline infrastructure.
- S3:
  - OCR source/stage/validated artifacts and organized supplier copies.

## 2. RDS Schema by Domain

## 2.1 OCR and Document Domain

### Table: ocr_ocrjob
Purpose: OCR job mirror and extracted payload cache.

Columns:
- id (PK)
- tenant_id (varchar128)
- doc_id (varchar128)
- status (varchar64)
- raw_key (text, nullable)
- stage_key (text, nullable)
- validated_key (text, nullable)
- extracted_fields (json)
- created_at, updated_at

Constraints:
- unique_together: (tenant_id, doc_id)

---

### Table: documents
Purpose: document lifecycle from upload to posted/confirmed.

Columns:
- id (PK)
- doc_id (varchar128, unique, indexed)
- tenant_id (varchar128, indexed)
- filename (varchar512)
- content_type (varchar128)
- file_size (int, nullable)
- upload_source (varchar64)
- s3_raw_key (text)
- status (enum-like varchar32)
- created_at, updated_at

Indexes:
- (tenant_id, status)

---

### Table: ocr_results
Purpose: raw OCR output persisted separately from parsed fields.

Columns:
- id (PK)
- doc_id (FK to documents.doc_id via OneToOne)
- raw_text (text)
- layout_blocks (json list)
- tables (json list)
- ocr_confidence (float, nullable)
- ocr_model (varchar128)
- page_count (int)
- created_at

Relationships:
- one-to-one with documents by doc_id

---

### Table: parsed_fields
Purpose: normalized field-level extraction entries with confidence and validation.

Columns:
- id (PK)
- doc_id (FK to documents.doc_id)
- tenant_id (varchar128, indexed)
- field_name (varchar128)
- value (text)
- confidence (float)
- source (varchar64)
- validation_status (varchar16)
- validation_message (text)
- created_at

Constraints:
- unique_together: (doc, field_name)

Indexes:
- (tenant_id, doc_id)
- (field_name)

## 2.2 Chat and Copilot Domain

### Table: chat_chatsession
Purpose: conversational thread identity and state metadata.

Columns:
- id (PK)
- session_id (varchar128, unique)
- tenant_id (indexed)
- user_id (indexed)
- fiscal_year (int, nullable)
- active_doc_id (varchar256, nullable)
- title (varchar256)
- status (varchar32)
- is_active (bool)
- created_at, updated_at

---

### Table: chat_chatmessage
Purpose: message turns (human/assistant/system/tool).

Columns:
- id (PK)
- session_id (FK to chat_chatsession)
- role (varchar16)
- content (text)
- metadata (json)
- created_at

Relationship:
- many-to-one to chat_chatsession (cascade delete)

---

### Table: chat_jobcallback
Purpose: callback audit and resume tracking for OCR completion.

Columns:
- id (PK)
- doc_id (varchar256, indexed)
- tenant_id (varchar128)
- job_status (varchar64)
- ocr_json_key (text)
- session_id (varchar128, nullable)
- status (varchar16)
- error (text)
- received_at
- processed_at (nullable)

---

### Table: chat_expenserecord
Purpose: expense analytics records derived from successful OCR to GL posting.

Columns:
- id (PK)
- tenant_id, user_id (indexed)
- fiscal_year (indexed)
- expense_date (date, indexed)
- month (int, indexed)
- amount (decimal14,2)
- currency (varchar8)
- category (varchar128, indexed)
- vendor (varchar256)
- description (text)
- reference_number (varchar128)
- gl_account_code (varchar32)
- gl_account_name (varchar256)
- doc_id (varchar256, indexed)
- journal_id (varchar128)
- recorded_at

Indexes:
- (tenant_id, user_id, fiscal_year)
- (tenant_id, user_id, month)
- (tenant_id, user_id, category)

---

### Table: chat_feedbacksubmission
Purpose: review feedback submission storage for audit + learning ingestion.

Columns:
- id (PK)
- feedback_id (varchar128, unique, indexed)
- tenant_id (indexed)
- doc_id (indexed)
- session_id (nullable)
- status (varchar16)
- original_extraction (json)
- corrected_extraction (json)
- corrections (json)
- corrections_summary (json)
- rules_generated (json)
- reprocess_execution_arn (text, nullable)
- created_at, updated_at

Indexes:
- (tenant_id, doc_id)
- (tenant_id, created_at)

---

### Table: chat_tenantllmusage
Purpose: monthly tenant-level token/request/cost budget tracking.

Columns:
- id (PK)
- tenant_id (indexed)
- period (varchar7, indexed, format YYYY-MM)
- total_requests (int)
- total_tokens (int)
- total_cost_usd (decimal10,4)
- max_requests_per_month (int)
- max_cost_usd_per_month (decimal10,2)
- max_tokens_per_month (int)
- created_at, updated_at

Constraints:
- unique_together: (tenant_id, period)

## 2.3 Posting and GL Profile Domain

### Table: posting_glpostingentry
Purpose: persisted GL posting history/events.

Columns:
- id (PK)
- entry_id (varchar128, unique)
- tenant_id (varchar128)
- session_id (varchar128, nullable)
- reference_number (varchar128)
- supplier_id (varchar128)
- supplier_name (varchar256)
- account_code (varchar64)
- amount (float)
- status (varchar64)
- metadata (json)
- posted_at (nullable)
- created_at

---

### Table: posting_userglprofile
Purpose: persisted GL initialization profile for rehydrating in-memory GL.

Columns:
- id (PK)
- tenant_id (varchar128)
- user_id (varchar128)
- fiscal_year (int)
- gl_file_path (text)
- accounts_count (int)
- initialised_at
- updated_at

Constraints:
- unique_together: (tenant_id, user_id, fiscal_year)

---

### Table: gl_persistent_accounts
Purpose: database-backed GL account balances; crash-proof balance tracking.

Columns:
- id (PK)
- tenant_id (varchar128)
- user_id (varchar128)
- fiscal_year (int)
- account_code (varchar64)
- account_name (varchar256)
- account_type (varchar64)
- normal_balance (varchar8, default "Debit")
- opening_balance (decimal18,2)
- current_balance (decimal18,2)
- period_debits (decimal18,2)
- period_credits (decimal18,2)
- is_active (bool)
- updated_at

Constraints:
- unique_together: (tenant_id, user_id, fiscal_year, account_code)

Indexes:
- (tenant_id, user_id, fiscal_year)
- (tenant_id, user_id, fiscal_year, is_active)

---

### Table: gl_journal_entries
Purpose: header for posted journal entries; each has balanced lines.

Columns:
- id (PK)
- entry_id (varchar128, unique)
- tenant_id (varchar128)
- user_id (varchar128)
- fiscal_year (int)
- fiscal_period (int, nullable)
- journal_type (varchar32)
- reference (varchar256)
- description (text)
- entry_date (date)
- posted_at (datetime)
- is_balanced (bool)
- source (varchar32: api, chatbot, bulk_import, session)
- doc_id (varchar128, nullable)
- session_id (varchar128, nullable)
- supplier_name (varchar256)
- invoice_number (varchar128)
- currency (varchar8, default "MYR")
- total_amount (decimal18,2)

Indexes:
- (tenant_id, user_id, fiscal_year)
- (tenant_id, user_id, entry_date)
- (tenant_id, supplier_name)
- (tenant_id, reference)

---

### Table: gl_journal_lines
Purpose: individual debit/credit lines within a journal entry.

Columns:
- id (PK)
- journal_entry_id (FK to gl_journal_entries)
- account_code (varchar64)
- account_name (varchar256)
- debit (decimal18,2)
- credit (decimal18,2)
- description (text)
- counterparty_account (varchar256)

Indexes:
- (account_code)

## 2.4 Learning and Enrichment Domain

### Table: tenant_knowledge
Purpose: tenant-level learned memory and mappings.

Columns:
- id (PK)
- tenant_id (unique, indexed)
- merchant_mappings (json)
- category_rules (json)
- category_statistics (json)
- avg_invoice_amount (decimal, nullable)
- common_gl_accounts (json list)
- custom_terminology (json)
- learning_episode_count (int)
- created_at, updated_at

---

### Table: golden_examples
Purpose: high-quality examples for few-shot behavior.

Columns:
- id (PK)
- example_id (unique, indexed)
- tenant_id (indexed)
- domain (indexed)
- input_text (text)
- output_classification (json)
- embedding (json, nullable)
- quality_score (float)
- usage_count (int)
- success_rate (float)
- created_at
- last_used_at (nullable)

Indexes:
- (tenant_id, domain, -quality_score)

---

### Table: user_profiles
Purpose: user-level preferences and behavioral learning.

Columns:
- id (PK)
- tenant_id (indexed)
- user_id (indexed)
- preferred_categories (json)
- common_vendors (json)
- typical_expense_ranges (json)
- communication_style (varchar32)
- preferred_gl_accounts (json)
- custom_category_rules (json)
- upload_patterns (json)
- correction_history (json)
- interaction_count (int)
- last_interaction_at (nullable)
- created_at, updated_at

Constraints:
- unique_together: (tenant_id, user_id)

---

### Table: extraction_rules
Purpose: generated/managed extraction rules with lifecycle.

Columns:
- id (PK)
- rule_id (unique)
- tenant_id (indexed)
- field_name (varchar128)
- rule_type (varchar32)
- rule_definition (json)
- lifecycle_state (varchar32)
- ai_confidence (float)
- ai_review_summary (text)
- ai_reviewed_at (nullable)
- times_applied (int)
- success_count (int)
- failure_count (int)
- created_at
- activated_at (nullable)
- deprecated_at (nullable)

Indexes:
- (tenant_id, lifecycle_state)
- (field_name, lifecycle_state)

---

### Table: strategy_performance
Purpose: daily strategy-level A/B performance metrics.

Columns:
- id (PK)
- tenant_id (indexed)
- strategy_name (varchar128)
- total_uses (int)
- successful_predictions (int)
- user_corrections (int)
- avg_confidence (float)
- avg_execution_time_ms (float)
- avg_cost_usd (decimal10,4)
- date (date, indexed)
- updated_at

Constraints:
- unique_together: (tenant_id, strategy_name, date)

---

### Table: tenant_chart_of_accounts
Purpose: deterministic tenant COA used in enrichment and categorization.

Columns:
- id (PK)
- tenant_id (indexed)
- account_code (varchar32)
- account_name (varchar256)
- account_type (varchar64)
- category (varchar128)
- keywords (json list)
- is_active (bool)
- version (int)
- created_at, updated_at

Constraints:
- unique_together: (tenant_id, account_code)

Indexes:
- (tenant_id, is_active)
- (tenant_id, account_type)

---

### Table: tenant_categorisation_rules
Purpose: deterministic pre-LLM mapping rules.

Columns:
- id (PK)
- rule_id (unique, indexed)
- tenant_id (indexed)
- priority (int)
- match_type (varchar32)
- match_value (text)
- assigned_account_code (varchar32)
- assigned_account_name (varchar256)
- is_active (bool)
- created_at, updated_at

Indexes:
- (tenant_id, is_active, priority)

---

### Table: historical_mappings
Purpose: confirmed supplier/description to account memory.

Columns:
- id (PK)
- tenant_id (indexed)
- supplier_name (varchar256, indexed)
- normalised_description (text)
- final_account_code (varchar32)
- final_account_name (varchar256)
- occurrence_count (int)
- confidence_score (float)
- last_used_at
- created_at

Constraints:
- unique_together: (tenant_id, supplier_name, final_account_code)

Indexes:
- (tenant_id, supplier_name)

---

### Table: categorisation_results
Purpose: chosen account decision record per doc.

Columns:
- id (PK)
- result_id (unique, indexed)
- doc_id (indexed)
- tenant_id (indexed)
- chosen_account_code (varchar32)
- chosen_account_name (varchar256)
- confidence (float)
- source (varchar64)
- candidate_list (json)
- reasoning (text)
- created_at

Indexes:
- (tenant_id, doc_id)

---

### Table: summary_results
Purpose: generated summary record per doc.

Columns:
- id (PK)
- result_id (unique, indexed)
- doc_id (indexed)
- tenant_id (indexed)
- summary (text)
- confidence (float)
- source (varchar64)
- created_at

Indexes:
- (tenant_id, doc_id)

---

### Table: field_feedback
Purpose: field-level correction audit and hints.

Columns:
- id (PK)
- feedback_id (unique, indexed)
- tenant_id (indexed)
- doc_id (indexed)
- field_name (varchar128)
- original_value (text)
- corrected_value (text)
- final_value (text)
- hint (text)
- original_confidence (float, nullable)
- accepted_by (varchar128)
- created_at

Indexes:
- (tenant_id, doc_id)
- (tenant_id, field_name)

---

### Table: confirmed_documents
Purpose: immutable post-review snapshot.

Columns:
- id (PK)
- doc_id (indexed)
- tenant_id (indexed)
- final_payload (json)
- final_account_code (varchar32)
- final_account_name (varchar256)
- final_summary (text)
- review_status (varchar16)
- confirmed_at
- confirmed_by (varchar128)
- created_at

Indexes:
- (tenant_id, doc_id)
- (tenant_id, review_status)

## 2.5 Export Domain

### Table: autocount_export_batches
Purpose: tracks each AutoCount purchase invoice export run.

Columns:
- id (PK)
- batch_id (varchar128, unique, indexed)
- tenant_id (varchar128, indexed)
- exported_by (varchar128)
- document_count (int)
- skipped_count (int)
- generated_filename (varchar512)
- exported_at (datetime)

Indexes:
- (tenant_id, exported_at)

---

### Table: autocount_export_items
Purpose: links confirmed documents to an export batch and prevents double export.

Columns:
- id (PK)
- batch_id (FK to autocount_export_batches)
- tenant_id (varchar128)
- doc_id (varchar128)
- confirmed_document_id (int)
- export_status (varchar16)
- skip_reason (text)
- exported_at (datetime)

Constraints:
- unique_together: (tenant_id, doc_id)

Indexes:
- (tenant_id, export_status)
- (batch)

## 2.6 Core Observability Domain

### Table: core_auditlog
Purpose: request-level audit trail emitted by middleware.

Columns:
- id (PK)
- request_id (varchar64, unique, indexed)
- tenant_id (varchar128, indexed)
- user_id (varchar128)
- method (varchar10)
- path (varchar512, indexed)
- query_params (text)
- status_code (int, indexed)
- duration_ms (float)
- ip_address (inet, nullable)
- user_agent (varchar256)
- content_length (int)
- timestamp (datetime, indexed)

Indexes:
- (tenant_id, timestamp)
- (status_code, timestamp)

## 2.7 Legacy Session Domain

### Table: sessions_session
Purpose: legacy session state storage (non-chatbot session service).

Columns:
- id (PK)
- session_id (varchar128, unique)
- tenant_id
- user_id
- state_json (json)
- loaded_context_json (json)
- summary (text, nullable)
- summary_updated_at (nullable)
- is_active
- created_at
- last_activity

---

### Table: sessions_sessionmessage
Purpose: message timeline for legacy session service.

Columns:
- id (PK)
- session_id (FK)
- role (varchar32)
- content (text)
- metadata (json)
- timestamp

Relationship:
- many-to-one to sessions_session

## 3. AWS Non-Relational Stores

## 3.1 DynamoDB: LangGraph Checkpoint Table

CloudFormation resource: `LangGraphCheckpointTable`  
Naming pattern: `LangGraphCheckpoints-{Environment}`

Key schema:
- partition key: `thread_id` (S)
- sort key: `checkpoint_id` (S)

Other:
- TTL attribute: `ttl`
- Billing mode: on-demand

Use:
- Persist chatbot graph checkpoints for production interrupt/resume.

## 3.2 DynamoDB: Episodes Table (Hybrid Pipeline)

CloudFormation resource: `EpisodesTable`  
Naming pattern: `receipt-ocr-episodes-{Environment}`

Key schema:
- partition key: `episode_id` (S)

GSI:
- `TenantIdTimestampIndex`:
  - HASH: `tenant_id`
  - RANGE: `timestamp`

Use:
- episode-level pipeline state/history for OCR and categorization flows.

## 3.3 S3 Artifact Domains

Observed key patterns in OCR pipeline:
- `raw/tenant={tenant}/ingest_date={date}/{doc_id}/source.{ext}`
- `stage/tenant={tenant}/ingest_date={date}/{doc_id}/paddle_ocr.json`
- `validated/...`
- `organized/tenant={tenant}/supplier={supplier}/{doc_id}/invoice.{ext}`

These are referenced by API payloads and RDS fields such as:
- `ocr_ocrjob.raw_key`
- `ocr_ocrjob.stage_key`
- `ocr_ocrjob.validated_key`
- document metadata responses from OCR services

## 4. Cross-Domain Relationships (Logical)

Primary doc-centric linkage:
- OCR job and enrichment outputs converge on `(tenant_id, doc_id)`.
- Confirmed document snapshots and field feedback trace back to document identity.
- AutoCount export tracking links confirmed documents to export batches through `autocount_export_items`.
- Chat callbacks and chat status views bridge doc processing and conversation thread state.

Operational GL linkage:
- `posting_userglprofile` stores user/year GL initialization state.
- Runtime GL transactions are generated from in-memory GL engine keyed by `(tenant_id, user_id, fiscal_year)`.
- Posting history persists to `posting_glpostingentry` and `chat_expenserecord`.

## 5. Backend Notes and Caveats

- Not every relationship is enforced via DB foreign keys; many are logical joins on tenant/doc/session IDs.
- Always filter by `tenant_id` first in service/query paths.
- Keep compatibility in mind for API payload aliases (`tenantId` and `tenant_id`, etc.) where used by ingestion flows.
- If adding new high-volume tables, include composite indexes for tenant and time-range queries.

## 6. Schema Ownership Boundary

This service and the backend platform maintain **separate databases** with distinct ownership domains:

### Backend Platform Owns (NOT in this DB)
- Company, User, CompanyMember, Credential, VerificationToken
- Session (workspace sessions), ChatMessage (platform-level)
- File (platform file storage)
- Account (canonical GL accounts), Document (platform document lifecycle)
- JournalEntry / JournalEntryLine (canonical ledger)
- CompanyCredit, CreditTransaction
- ActivityLog

### This AI Service Owns
- OCR pipeline: OCRJob, Document (AI extraction lifecycle), OCRResult, ParsedField
- Categorisation: TenantChartOfAccounts, TenantCategorisationRule, HistoricalMapping, CategorisationResult, SummaryResult
- Confirmed documents: ConfirmedDocument, FieldFeedback
- AI learning: TenantKnowledge, GoldenExample, UserProfile, ExtractionRule, StrategyPerformance
- GL persistence: PersistentGLAccount, PersistentJournalEntry, PersistentJournalLine, GLPostingEntry, UserGLProfile
- Chat: ChatSession, ChatMessage, JobCallback, ExpenseRecord, FeedbackSubmission, TenantLLMUsage
- Export: AutoCountExportBatch, AutoCountExportItem
- Observability: AuditLog

### Recommended Future Bridge Fields (NOT yet implemented in current RDS)
These are the safest bridge fields to add later if backend/platform traceability becomes mandatory.
They are **not** part of the current deployed schema unless corresponding migrations are applied.

| AI Service Table | Bridge Field | Maps To (Backend) |
|---|---|---|
| `documents` | `external_file_id` | `File.id` |
| `documents` | `external_session_id` | `Session.id` |
| `documents` | `document_type` | `Document.documentType` |
| `documents` | `error_message` | `Document.errorMessage` |
| `documents` | `approved_at` / `approved_by` | approval metadata |
| `tenant_chart_of_accounts` | `external_account_id` | `Account.id` |
| `tenant_chart_of_accounts` | `parent_account_code` | account hierarchy |
| `tenant_chart_of_accounts` | `description` / `is_system` / `deleted_at` | account metadata |
| `gl_journal_entries` | `external_journal_entry_id` | `JournalEntry.id` |
| `gl_journal_entries` | `lifecycle_status` / `posted_by` / `voided_at` / `voided_by` / `deleted_at` | journal lifecycle |
| `gl_journal_lines` | `sort_order` | document line ordering |
| `gl_journal_lines` | `external_account_id` | `Account.id` |

Shared identifiers (already present, no new columns needed):
- `tenant_id` = backend `Company.id`
- `user_id` = backend `User.id`
- `session_id` = backend `Session.id` (for chat and legacy sessions)

## 7. Related Diagram

For visual ERD and AWS store mapping, see:
- [docs-repo/diagrams/DATABASE_ERD_DIAGRAM.md](docs-repo/diagrams/DATABASE_ERD_DIAGRAM.md)
