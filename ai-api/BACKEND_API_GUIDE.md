# Backend API Guide (Source-of-Truth)

Last updated: March 23, 2026

This guide is implementation-accurate for the current Django codebase and is intended for backend developers integrating or extending the Accounting AI APIs.

Scope:
- Base routes: `/api/*` and `/api/chat/*`
- Endpoint behavior from `api/views.py` and `chat/views.py`
- Request/response contracts used by current services
- Tenant/user scoping conventions and operational caveats

## 1. Runtime and API Baseline

- Framework: Django 5 + DRF APIView
- Root routing:
  - `/api/` from `api/urls.py`
  - `/api/chat/` from `chat/urls.py`
- Default content type: JSON
- Throttling:
  - anon: `60/minute` (default)
  - user: `120/minute` (default)
- Audit logging middleware enabled by default for `/api/*`.

## 2. Identity, Tenant, and Header Conventions

Primary headers used across endpoints:
- `x-tenant-id`
- `x-user-id`

Current behavior is endpoint-specific:
- Some endpoints require headers and return 400 when missing.
- Some endpoints default missing values to `default` or `default-user`.
- There is no global DRF auth/permission layer configured in settings.

Backend practice recommendation:
- Always send both headers from clients and upstream services.
- For any new endpoint, avoid fallback defaults for tenant/user.
- Validate tenant/user membership at the application boundary.

## 3. Common Response Patterns

Standard success:
- `200 OK` for fetch/process
- `201 Created` for create/import actions

Standard errors:
- `400` validation or missing required fields
- `404` missing doc/session/profile/resource
- `422` enrichment pipeline validation failures
- `500` internal processing failure
- `502` upstream OCR API failures

Most error bodies follow:
```json
{
  "error": "Human readable message",
  "details": "Optional detail"
}
```

## 4. Endpoint Catalog

## 4.1 Health and System

### GET /api/health
- Purpose: shallow health.
- Response keys: `status`, `version`, `timestamp`.

### GET /api/health?deep
- Purpose: deep health.
- Adds: DB check, LLM stats, OCR mode, model counts.

## 4.2 OCR Pipeline

### POST /api/ocr/presign
- Headers: optional `x-tenant-id`
- Body:
  - `filename` (required)
  - `contentType` (required)
- Behavior:
  - Calls OCR presign API.
  - Upserts `OCRJob` with status `RECEIVED`.
- Errors:
  - `400` missing fields
  - `502` upstream presign failure

### GET /api/ocr/jobs/{tenant_id}/{doc_id}
- Purpose: fetch OCR status and persist local mirror.
- Side effect:
  - Upserts local `OCRJob`.
  - Tries supplier-organization copy flow (non-blocking).
- Errors: `502` upstream lookup failure

### POST /api/ocr/jobs/{tenant_id}/{doc_id}/ingest
- Purpose: internal ingest of extracted OCR payload to local DB.
- Errors:
  - `500` ingest failure

### POST /api/ocr/jobs/{tenant_id}/{doc_id}/run
- Body:
  - `useMock` (optional bool)
  - `mockText` (optional)
  - `async` (optional bool)
- Behavior: runs local OCR pipeline execution.
- Errors:
  - `404` if job not found
  - `400` for missing bucket/raw key/config
  - `500` generic run failure

### POST /api/ocr/jobs/{tenant_id}/{doc_id}/process
- Headers: `x-user-id` required
- Body/query: optional `fiscal_year`
- Preconditions:
  - `OCRJob.status` is `COMPLETED` or `VALIDATED`
  - user GL is initialized (`UserGLProfile` exists or in-memory GL exists)
- Behavior:
  - Loads OCR payload from `OCRJob.extracted_fields`
  - Categorizes and posts DR/CR using GL engine
  - Organizes invoice in supplier path and returns document URLs
- Errors:
  - `400` missing header / not ready / no extracted fields / GL not initialized
  - `404` OCR job not found
  - `500` GL reload or posting failure

## 4.3 Core Categorization and Legacy Session APIs

### POST /api/categorise
- Body validated by `CategorizationRequestSerializer`.
- Calls categorization service pipeline.
- Errors:
  - `400` serializer validation errors
  - `500` categorization failure

### GET /api/sessions
- Query: `tenant_id`, `user_id` required.

### GET /api/sessions/{session_id}
### DELETE /api/sessions/{session_id}

### GET /api/sessions/{session_id}/facts

### POST /api/sessions/{session_id}/knowledge-base
- Requires `tenant_id` in body or query.

### GET /api/sessions/{session_id}/suppliers/{supplier_id}/history

### POST /api/sessions/{session_id}/anomaly-detection
- Query required: `supplier_id`, `account_code`, `amount`.

### POST /api/sessions/{session_id}/gl/preview
### POST /api/sessions/{session_id}/gl/post
- Required: `supplier_id`, `supplier_name`, `account_code`, `amount`, `reference_number`.
- Optional: `description`, `posted_by`.

### GET /api/sessions/{session_id}/gl/balances

## 4.4 Multi-tenant GL APIs

### POST /api/gl/upload
- Headers: `x-tenant-id`, `x-user-id` required
- Content type: `multipart/form-data`
- Form fields:
  - `gl_file` required (`.xlsx`, `.xls`, `.csv`)
  - `fiscal_year` required integer
- Limits/validation:
  - max file size: 20 MB
  - returns `400` if no accounts extracted
- Behavior:
  - Parses uploaded GL file in-memory
  - Builds in-memory GL for `(tenant,user,fiscal_year)`
  - Upserts `UserGLProfile`
  - Seeds `tenant_chart_of_accounts`
- Response highlights:
  - `status`, `accounts_count`, `coa_rows_seeded`, `s3_uri`

Recommended production initialization path uses this endpoint.

### POST /api/gl/initialise
- Headers: `x-tenant-id`, `x-user-id` required
- Body:
  - `gl_file_path` required
  - `fiscal_year` required integer
- Behavior:
  - Parses previous-year GL Excel.
  - Builds in-memory COA/GL for `(tenant,user,fiscal_year)`.
  - Persists `UserGLProfile` for reload-on-restart.

### GET /api/tenants/{tenant_id}/gl/status
- Headers: optional `x-user-id` (defaults `default-user`)
- Query: optional `fiscal_year` (default current year)
- Returns:
  - summary
  - trial balance
  - recent entries

### GET /api/tenants/{tenant_id}/gl/transactions
- Headers: optional `x-user-id` (defaults `default-user`)
- Query:
  - `fiscal_year` int
  - `account_code`
  - `start_date`, `end_date` in `YYYY-MM-DD`
  - `include_opening` bool (default true)
  - `page` (default 1)
  - `page_size` 1..500 (default 100)
- Returns:
  - `accounts[]` grouped-by-account sections with opening balance row first
  - legacy paginated `rows[]` flat list
  - summary totals and pagination block

### GET /api/tenants/{tenant_id}/gl/export
- Headers: optional `x-user-id`
- Query: optional `fiscal_year`
- Returns: Excel file (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

## 4.5 Tenant LLM Usage and Cost Controls

### GET /api/tenants/{tenant_id}/llm/usage
- Query: optional `period=YYYY-MM`
- Returns usage totals and budget status.

### PUT /api/tenants/{tenant_id}/llm/usage
- Body optional fields:
  - `period`
  - `max_requests_per_month`
  - `max_cost_usd_per_month`
  - `max_tokens_per_month`
- Behavior: upserts/updates monthly tenant budget limits.

## 4.6 Invoice and Expense Analytics

### GET /api/tenants/{tenant_id}/invoices
- Headers: optional `x-user-id` (maps to `supplier_id` filter in current implementation)
- Query:
  - `vendor`, `status`, `min_amount`, `max_amount`
  - `from_date`, `to_date` (ISO parse)
  - `account`, `page`, `page_size`

### GET /api/tenants/{tenant_id}/expenses
- Headers: optional `x-user-id`
- Query:
  - `fiscal_year` (default current)
  - `category`, `vendor`, `month`, `from_date`, `to_date`
  - `group_by` in `category|vendor|month` for aggregate mode
  - `page`, `page_size`

## 4.7 Enrichment and Human Review Pipeline

### POST /api/documents/enrich
- Inputs: `tenant_id`, `doc_id` (body; tenant can come from header fallback)
- Runs parse/validate/candidate/categorize/summary orchestration.
- Returns `422` when enrichment returns `status=error`.

### POST /api/documents/confirm
- Inputs:
  - `tenant_id`, `doc_id`
  - `final_fields` (non-empty object, required)
  - `user_action` (default `confirmed`)
  - `user_id` optional (body/header)
- Behavior:
  - Stores field-level feedback and confirmed snapshot
  - Triggers learning service (non-blocking)

### GET /api/documents/{tenant_id}/{doc_id}/candidates
- Purpose: ranked candidate account codes using supplier + description.

### POST /api/documents/{tenant_id}/{doc_id}/gl-prepare
- Purpose: build GL-ready payload from confirmed document.

## 4.8 Tenant COA and Rule Administration

### GET /api/tenants/{tenant_id}/chart-of-accounts
### POST /api/tenants/{tenant_id}/chart-of-accounts
### DELETE /api/tenants/{tenant_id}/chart-of-accounts
- POST body: `accounts` non-empty list.
- Behavior: bulk upsert tenant COA entries.
- DELETE behavior: removes tenant COA rows and tenant `UserGLProfile` rows for clean re-initialisation.

### GET /api/tenants/{tenant_id}/categorisation-rules
### POST /api/tenants/{tenant_id}/categorisation-rules
- POST behavior: create deterministic mapping rule.

## 4.9 Bulk Import/Export and Audit

### POST /api/tenants/{tenant_id}/invoices/bulk-import
- Headers: `x-user-id` required
- Body:
  - `invoices`: non-empty array, max 500
  - each invoice requires `reference_number`, `supplier_name`, `account_code`, `amount`
- Returns imported count + per-row errors/results.

### GET /api/tenants/{tenant_id}/invoices/export
- Headers: optional `x-user-id`
- Query:
  - `export_format=csv|json` (default json)
  - `from_date`, `to_date`
- Returns CSV attachment or JSON body.

### GET /api/admin/audit-logs
- Query filters:
  - `tenant_id`, `method`, `status_min`, `path`
  - `from_date`, `to_date`
  - `page`, `page_size` (max 200)

## 4.10 Chat API (/api/chat)

### POST /api/chat/sessions
- Headers used: `x-tenant-id`, `x-user-id` (current fallback `default` if missing)
- Optional body: `title`, `fiscal_year`

### GET /api/chat/sessions/{session_id}
- Returns session metadata + full message timeline.

### POST /api/chat/sessions/{session_id}/messages
- Body: `message` required
- Behavior:
  - Stores human message
  - Invokes LangGraph synchronously
  - Stores assistant message with metadata (`intent`, `citations`, `gl_result`)
  - Handles LangGraph interrupt state (`waiting_for_job=true`)

### POST /api/chat/sessions/{session_id}/uploads/presign
- Optional body: `filename`, `contentType`
- Behavior:
  - Creates OCR upload URL
  - Binds `doc_id` to session active document

### GET /api/chat/jobs/{tenant_id}/{doc_id}
- Returns combined OCR status + confirmed document posting projection.

### GET /api/chat/review/{tenant_id}/{doc_id}
- Returns review-ready flattened field list with confidence and suggested tag.

### POST /api/chat/internal/job-updated
- Internal callback for OCR completion.
- Body typical keys:
  - `tenantId`, `docId`, `status`, `ocrJsonKey`
  - optional `extractedFields`/`extracted_fields`
- Behavior:
  - Logs callback
  - Updates OCR job
  - Resumes LangGraph thread if a session tracks the doc

### Feedback and Rules APIs (also mirrored under `/api/*` routes)
- `POST /api/chat/feedback`
- `GET /api/chat/feedback/kpi/{tenant_id}`
- `GET /api/chat/feedback/{feedback_id}/delta`
- `GET /api/chat/feedback/{tenant_id}/{doc_id}`
- `GET /api/chat/rules`
- `POST /api/chat/rules/{rule_id}/approve`
- `POST /api/chat/rules/{rule_id}/reject`

## 5. Primary Data Flow Sequences

## 5.1 OCR to GL Posting
1. `POST /api/ocr/presign`
2. Upload file to returned URL
3. `POST /api/ocr/jobs/{tenant}/{doc}/run` (or external pipeline run)
4. Poll `GET /api/ocr/jobs/{tenant}/{doc}` until completed
5. Ensure `POST /api/gl/initialise` has been done for user/year
6. `POST /api/ocr/jobs/{tenant}/{doc}/process`
7. Read ledgers via `/api/tenants/{tenant}/gl/status` and `/gl/transactions`

## 5.2 Human-in-the-loop Enrichment
1. `POST /api/documents/enrich`
2. `GET /api/documents/{tenant}/{doc}/candidates`
3. User edits fields
4. `POST /api/documents/confirm`
5. Optional: `POST /api/documents/{tenant}/{doc}/gl-prepare`

## 6. Backend Caveats to Know (Current State)

- Tenant auth is not globally enforced at DRF settings level.
- Some endpoints still allow tenant/user fallback values.
- GL store key is `(tenant_id, user_id, fiscal_year)` in-memory, so GL context is user-scoped by default.
- Chat session fetch/post currently keys by `session_id` only.
- `InvoiceSearchView` user filter maps `x-user-id` to `GLPostingEntry.supplier_id` (naming mismatch).

## 7. Environment Variables That Affect API Behavior

- `DB_ENGINE`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `OCR_API_BASE_URL`
- `OCR_PIPELINE_MODE` (`remote|local`)
- `OCR_S3_BUCKET`
- `AWS_REGION`
- `LANGGRAPH_CHECKPOINTER` (`memory|dynamodb`)
- `LANGGRAPH_DYNAMODB_TABLE`
- `AUDIT_LOG_ENABLED`, `AUDIT_LOG_SKIP_HEALTH`

## 8. Quick Contract Testing Checklist

For each deployment:
1. Health deep check: `GET /api/health?deep`
2. Presign + OCR status happy path
3. GL initialize + OCR process happy path
4. GL transactions grouped payload contract
5. Enrich and confirm endpoints
6. Chat session create/message/upload/job callback flow
7. Bulk import/export endpoints
8. Audit log query endpoint
