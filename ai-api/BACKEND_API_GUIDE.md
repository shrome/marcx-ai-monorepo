# Backend API Guide (Source-of-Truth)

Last updated: March 26, 2026

This guide is implementation-accurate for the current Django codebase and is intended for backend developers integrating or extending the Accounting AI APIs.

Scope:
- Base routes: `/api/*` and `/api/chat/*`
- Endpoint behavior from `api/views.py` and `chat/views.py`
- Request/response contracts used by current services
- Tenant/user scoping conventions and operational caveats

Important design rule:
- When backend ERDs or schema drafts include fields/tables that are not yet deployed on live AWS, treat them as **future-only**.
- Future-only means they may influence design direction, but they are **not** part of the current runtime/API contract yet.
- Developers should not add hard dependencies, DB assumptions, or new duplicate tables in this service just because a future-only backend concept exists.
- For implementation and integration decisions, prefer the live AWS/API contract over an undeployed backend schema draft.

Quick integration checklist:
- Is the backend field live in the current AWS API, or only in a future ERD?
- Is this a naming mismatch only, for example `company_id` vs `tenant_id`?
- Can the request layer map it without a schema change?
- Does this endpoint need a bridge field, or only header/body alias support?
- Would this change introduce duplicate ownership between backend and AI service?
- If the answer is unclear, do not hard-code the new concept yet; document it as future-only.

## 1. Runtime and API Baseline

- Framework: Django 5 + DRF APIView
- Root routing:
  - `/api/` from `api/urls.py`
  - `/api/chat/` from `chat/urls.py`
- Live AWS base domain verified on March 24, 2026:
  - `http://chatbot-alb-dev-343845085.ap-southeast-1.elb.amazonaws.com`
- Full API base URLs:
  - `http://chatbot-alb-dev-343845085.ap-southeast-1.elb.amazonaws.com/api`
  - `http://chatbot-alb-dev-343845085.ap-southeast-1.elb.amazonaws.com/api/chat`
- Important:
  - This is currently the ALB DNS name, not a custom Route53 domain.
  - If infrastructure changes, the ALB DNS may change and this guide must be updated.
- Default content type: JSON
- Throttling:
  - anon: `60/minute` (default)
  - user: `120/minute` (default)
- Audit logging middleware enabled by default for `/api/*`.

## 2. Identity, Tenant, and Header Conventions

### ID Mapping Contract (Backend ↔ AI Service)

| Backend field | Our field | Header | Body aliases |
|---|---|---|---|
| `company_id` | `tenant_id` | `x-tenant-id` or `x-company-id` | `tenant_id`, `company_id`, `companyId`, `tenantId` |
| `user_id` | `user_id` | `x-user-id` | `user_id`, `userId` |
| `sessionId` | `external_session_id` | — | `sessionId`, `session_id`, `external_session_id` |
| `fileId` | `external_file_id` | — | `fileId`, `file_id`, `external_file_id` |

Centralized resolution is in `core/id_resolution.py`. All API and chat endpoints use these shared helpers.

### Primary headers used across all endpoints:
- `x-tenant-id` (or `x-company-id` alias) — **required** on most endpoints
- `x-user-id` — **required** on write endpoints, optional on read-only GET endpoints
- `x-ledger-scope-id` (optional — defaults to `tenant_id` for company-wide GL)

### Header alias behavior:
- `x-company-id` is accepted as an alias for `x-tenant-id` on **all** endpoints.
- Header priority: `x-tenant-id` > `x-company-id` > body field.
- URL path `tenant_id` always takes top priority when present.

### Endpoints that accept `x-company-id`:
- All endpoints that accept `x-tenant-id` (via shared `resolve_tenant_id()`)
- Includes: `/api/gl/initialise`, `/api/gl/upload`, `/api/ocr/presign`, `/api/chat/sessions`, `/api/chat/feedback`, `/api/chat/internal/job-updated`

### Required vs optional headers by endpoint type:
- **Write endpoints** (POST): both `x-tenant-id` and `x-user-id` required (returns 400 if missing)
- **Read endpoints with URL tenant** (GET `/api/tenants/{tenant_id}/*`): tenant from URL, user optional
- **Internal callbacks**: `tenantId` from body, fallback to `x-tenant-id`/`x-company-id`

### Removed unsafe defaults:
No endpoint silently defaults to `"default"` or `"default-user"` anymore. Missing required IDs return `400 Bad Request`.

**Ledger Scope Model:**
GL data (accounts, journal entries, trial balance) is scoped by `(tenant_id, ledger_scope_id, fiscal_year)`.
By default `ledger_scope_id` equals `tenant_id`, meaning all users in the same company share one ledger.
`user_id` is preserved as the **actor** (who performed the action) for audit purposes.

To override ledger scope, supply:
1. `x-ledger-scope-id` header, or
2. `ledger_scope_id` in request body/query params.

### Bridge fields (Document model):
When the backend sends `fileId` or `sessionId` in the request body,
they are stored on the `Document` record as `external_file_id` and `external_session_id`.
This enables cross-service traceability.

### Content-type field naming:
OCR presign endpoints accept both `contentType` (camelCase) and `content_type` (snake_case).
Internally stored as `content_type`.

Recommended backend convention for every request unless explicitly not needed:
- `x-tenant-id: <tenant>` (or `x-company-id: <company_id>`)
- `x-user-id: <user>`

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

## 3.1 Integration Quickstart with Full Domain

Use the live AWS base domain:

```text
http://chatbot-alb-dev-343845085.ap-southeast-1.elb.amazonaws.com
```

Typical backend integration sequence:
1. Initialize the user GL:
   - `POST http://chatbot-alb-dev-343845085.ap-southeast-1.elb.amazonaws.com/api/gl/upload`
2. Create or ingest OCR job:
   - `POST http://chatbot-alb-dev-343845085.ap-southeast-1.elb.amazonaws.com/api/ocr/presign`
   - upload raw file to returned URL
   - run external or local OCR
   - `POST http://chatbot-alb-dev-343845085.ap-southeast-1.elb.amazonaws.com/api/ocr/jobs/{tenant_id}/{doc_id}/ingest`
3. Enrich for account categorization + summary:
   - `POST http://chatbot-alb-dev-343845085.ap-southeast-1.elb.amazonaws.com/api/documents/enrich`
4. Confirm corrected/final fields:
   - `POST http://chatbot-alb-dev-343845085.ap-southeast-1.elb.amazonaws.com/api/documents/confirm`
5. Export AutoCount purchase invoice workbook:
   - `POST http://chatbot-alb-dev-343845085.ap-southeast-1.elb.amazonaws.com/api/tenants/{tenant_id}/exports/autocount-purchase-invoices`

Minimal request examples:

```bash
curl -X GET \
  "http://chatbot-alb-dev-343845085.ap-southeast-1.elb.amazonaws.com/api/health"
```

```bash
curl -X POST \
  "http://chatbot-alb-dev-343845085.ap-southeast-1.elb.amazonaws.com/api/gl/upload" \
  -H "x-tenant-id: company-abc" \
  -H "x-user-id: company-abc-tester" \
  -F "fiscal_year=2026" \
  -F "gl_file=@/path/to/GeneralLedger.xlsx"
```

```bash
curl -X POST \
  "http://chatbot-alb-dev-343845085.ap-southeast-1.elb.amazonaws.com/api/documents/enrich" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: company-abc" \
  -H "x-user-id: company-abc-tester" \
  -d '{"tenant_id":"company-abc","doc_id":"<doc-id>"}'
```

## 4. Endpoint Catalog

## 4.1 Health and System

### GET /api/health
- Purpose: shallow health.
- Response keys: `status`, `version`, `timestamp`.

### GET /api/health?deep
- Purpose: deep health.
- Adds: DB check, LLM stats, OCR diagnostics, model counts.
- OCR diagnostics include:
  - `ocr.mode`: `local` or `remote`
  - `ocr.s3_bucket`: whether S3 bucket is configured
  - `ocr.api_base_url`: whether remote API URL is configured
  - `ocr.presign_ready`: whether OCR presign will work
  - `ocr.presign_issue`: description of any config problem

## 4.2 OCR Pipeline

### POST /api/ocr/presign
- Headers: `x-tenant-id` or `x-company-id` (**required**)
- Body:
  - `filename` (required)
  - `contentType` or `content_type` (required — both accepted)
  - `fileId` (optional — stored as `external_file_id` on Document)
  - `sessionId` (optional — stored as `external_session_id` on Document)
- Behavior:
  - Creates OCR presign URL for file upload.
  - Upserts `OCRJob` with status `RECEIVED`.
  - Creates `Document` record with bridge fields.
  - In `local` mode: generates S3 presigned PUT URL directly.
  - In `remote` mode: proxies to external OCR API Gateway.
- Errors:
  - `400` missing tenant or missing filename/contentType
  - `502` upstream presign failure (remote mode)

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
- Headers: `x-tenant-id` (or `x-company-id`), `x-user-id` required, `x-ledger-scope-id` optional
- Content type: `multipart/form-data`
- Form fields:
  - `gl_file` required (`.xlsx`, `.xls`, `.csv`)
  - `fiscal_year` required integer
- Limits/validation:
  - max file size: 20 MB
  - returns `400` if no accounts extracted
- Behavior:
  - Parses uploaded GL file in-memory
  - Builds in-memory GL for `(tenant, ledger_scope_id, fiscal_year)`
  - Upserts `UserGLProfile` keyed by `(tenant_id, ledger_scope_id, fiscal_year)`
  - Seeds `tenant_chart_of_accounts`
  - `user_id` stored as the actor who performed the upload
- Response highlights:
  - `status`, `accounts_count`, `ledger_scope_id`, `coa_rows_seeded`, `s3_uri`

**Testing / manual dev flow:** Use this endpoint to upload GL files interactively. It handles S3 archival, parsing, COA seeding, and persistent account creation in one multipart call.

**Production flow:** For automated server-to-server integrations, prefer uploading the file to S3 directly, then calling `POST /api/gl/initialise` with the `s3://` URI. This avoids sending large files through the API.

Full URL example:
- `POST http://chatbot-alb-dev-343845085.ap-southeast-1.elb.amazonaws.com/api/gl/upload`

### POST /api/gl/initialise
- Headers: `x-tenant-id` (or `x-company-id`), `x-user-id` required, `x-ledger-scope-id` optional
- Body:
  - `gl_file_path` required (absolute path or `s3://` URI)
  - `fiscal_year` required integer
- Validation:
  - Path must be non-empty and either an absolute local path or `s3://` URI.
  - When `GL_REQUIRE_S3=true`, only `s3://` URIs are accepted (returns 400 otherwise).
  - Returns 400 if 0 accounts are extracted from the file.
- Behavior:
  - Parses previous-year GL Excel.
  - Builds in-memory COA/GL for `(tenant,user,fiscal_year)`.
  - Persists `UserGLProfile` for reload-on-restart.
  - Seeds `tenant_chart_of_accounts` (same as gl/upload).
  - Persists `PersistentGLAccount` balances (same as gl/upload).
- Response keys: `status`, `accounts_count`, `coa_rows_seeded`, `persisted_accounts`, `gl_file_path`

**Production flow:** Backend uploads GL file directly to S3, then calls this endpoint with the `s3://` URI.  Set `GL_REQUIRE_S3=true` in production to enforce this.

**Testing/dev flow:** Can accept a local absolute path when `GL_REQUIRE_S3` is unset.

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

### GET /api/tenants/{tenant_id}/ledger/trial-balance
- Headers: optional `x-user-id` (defaults `default-user`)
- Query: optional `fiscal_year`
- Purpose:
  - Read DB-backed trial balance from persistent ledger tables.
  - Survives process restarts better than memory-only GL state.

### GET /api/tenants/{tenant_id}/ledger/transactions
- Headers: optional `x-user-id` (defaults `default-user`)
- Query:
  - `fiscal_year`
  - `account_code`
  - `start_date`, `end_date`
  - `page`, `page_size`
- Purpose:
  - Read DB-backed journal lines from persistent ledger tables.

### GET /api/tenants/{tenant_id}/ledger/balances
- Headers: optional `x-user-id` (defaults `default-user`)
- Query: optional `fiscal_year`
- Purpose:
  - Return persistent account balance summary from `gl_persistent_accounts`.

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

## 4.10 AutoCount Purchase Invoice Export

### POST /api/tenants/{tenant_id}/exports/autocount-purchase-invoices
- Headers:
  - `x-user-id` recommended
  - `x-tenant-id` recommended and should match path tenant
- Body optional fields:
  - `doc_ids` list[str]
  - `include_already_exported` bool
  - `from_confirmed_at` ISO datetime
  - `to_confirmed_at` ISO datetime
- Behavior:
  - Reads from `ConfirmedDocument.final_payload`
  - Exports only confirmed/corrected documents
  - Excludes previously exported docs by default
  - Returns `.xlsx` on success
  - Returns JSON with `status=nothing_new|no_candidates|all_skipped` when no file is produced
- Current production note:
  - `Description` is truncated to 80 chars in export mapping
  - `DetailDescription` is truncated to 100 chars

## 4.11 Chat API (/api/chat)

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
5. Ensure `POST /api/gl/upload` or `POST /api/gl/initialise` has been done for user/year
6. `POST /api/ocr/jobs/{tenant}/{doc}/process`
7. Read ledgers via `/api/tenants/{tenant}/gl/status` and `/gl/transactions`

## 5.2 Human-in-the-loop Enrichment
1. `POST /api/documents/enrich`
2. `GET /api/documents/{tenant}/{doc}/candidates`
3. User edits fields
4. `POST /api/documents/confirm`
5. Optional: `POST /api/documents/{tenant}/{doc}/gl-prepare`

## 5.3 Confirmed OCR to AutoCount Export
1. `POST /api/documents/enrich`
2. `POST /api/documents/confirm`
3. `POST /api/tenants/{tenant_id}/exports/autocount-purchase-invoices`
4. Store returned `.xlsx` file or hand it to downstream accounting import

## 6. Backend Caveats to Know (Current State)

- Tenant auth is not globally enforced at DRF settings level.
- Some endpoints still allow tenant/user fallback values.
- GL store key is `(tenant_id, user_id, fiscal_year)` in-memory, so GL context is user-scoped by default.
- Chat session fetch/post currently keys by `session_id` only.
- `InvoiceSearchView` user filter maps `x-user-id` to `GLPostingEntry.supplier_id` (naming mismatch).
- Live AWS currently uses ALB DNS instead of a friendly custom domain.
- Summary text returned by enrich is not capped at 80 chars; only AutoCount export truncates description fields.

## 7. Environment Variables That Affect API Behavior

- `DB_ENGINE`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `OCR_API_BASE_URL`
- `OCR_PIPELINE_MODE` (`remote|local`)
- `OCR_S3_BUCKET`
- `AWS_REGION`
- `LANGGRAPH_CHECKPOINTER` (`memory|dynamodb`)
- `LANGGRAPH_DYNAMODB_TABLE`
- `AUDIT_LOG_ENABLED`, `AUDIT_LOG_SKIP_HEALTH`
- `GL_REQUIRE_S3` (`true|1|yes`) — when set, `POST /api/gl/initialise` rejects local file paths and only accepts `s3://` URIs. Recommended for production deployments.

## 8. Security and Architecture Notes (Current State)

### Authentication
- There is **no DRF-level authentication** configured (`DEFAULT_AUTHENTICATION_CLASSES` and `DEFAULT_PERMISSION_CLASSES` are unset in `settings.py`).
- The API relies on network-level security: ALB + security groups + private subnets.
- Tenant/user identity comes from `x-tenant-id` / `x-user-id` headers, which are trusted without verification.
- **Recommendation:** For server-to-server calls, consider adding a lightweight `X-API-Key` header check (env-var based) before exposing the API to additional callers.

### GL File Path Security
- `POST /api/gl/initialise` accepts file paths. Without `GL_REQUIRE_S3=true`, a caller could pass an arbitrary local path.
- In production, set `GL_REQUIRE_S3=true` to ensure only S3 URIs are accepted.
- The S3 URI is passed to `gl_parser.py` which uses boto3 (inheriting the ECS task role). No path traversal is possible with S3 URIs.

### ALB DNS Stability
- The current base URL uses an ALB DNS name (`chatbot-alb-dev-*`). This name may change if the ALB is recreated.
- For durable integrations, consider adding a Route53 CNAME or API Gateway in front of the ALB.

### In-Memory GL Lifecycle
- The in-memory GL store (`gl_store`) lives in the ECS task process. It is lost on redeploy or task replacement.
- `UserGLProfile` + `PersistentGLAccount` persist the data to RDS, so GL can be rebuilt on next access.
- Both `gl/upload` and `gl/initialise` now perform the same persistence steps (profile + COA + persistent accounts).

## 9. Quick Contract Testing Checklist

For each deployment:
1. Health deep check: `GET /api/health?deep`
2. Presign + OCR status happy path
3. GL upload/initialize + OCR process happy path
4. GL transactions grouped payload contract
5. Persistent ledger trial balance / transactions / balances endpoints
6. Enrich and confirm endpoints
7. AutoCount export endpoint
8. Chat session create/message/upload/job callback flow
9. Bulk import/export endpoints
10. Audit log query endpoint
