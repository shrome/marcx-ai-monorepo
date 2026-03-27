<overview>
Jason is building a multi-tenant AI-powered accounting platform (marcx-ai-monorepo) with a NestJS backend, Next.js frontend, shared `@marcx/db` Drizzle ORM package, and an external Django/LangGraph AI-API. The session covered: fixing all 18 pre-existing TypeScript errors in the frontend, removing legacy mock-store, planning and starting Phase 4 (Testing + API Docs + Frontend E2E), consolidating redundant documentation files into IMPLEMENTATION_PLAN.md, and beginning execution of Phase 4 — creating test infrastructure, 3 skills, installing Swagger/Scalar deps, and now mid-way through adding Swagger decorators to all 12 backend controllers.
</overview>

<history>
1. **Resumed from prior checkpoint** — Phases 1–3 were complete. Frontend TypeScript check revealed 21 errors (3 from Phase 3 work, 18 pre-existing).

2. **Fixed Phase 3 TS errors (3 new)**:
   - `exportGL.mutateAsync()` → `mutateAsync(undefined)` in LedgerPage
   - `user?.company?.name` → `user?.companyId` in ProfilePage (User type has no `company` object)
   - `SettingsPage.tsx` CompanyTab rewrote to use `companyId` instead of missing `company` object

3. **Fixed 18 pre-existing TS errors**:
   - `trpc/routers/chat.ts`, `files.ts`, `auth.ts` — stubbed out (app no longer uses tRPC)
   - `trpc/init.ts` — removed mock-store import, exported `createCallerFactory` from `t`
   - `trpc/server.ts` — fixed `createCallerFactory` import
   - `lib/db/mock-store.ts` — removed `Folder` import, defined local interface
   - `components/cases/FileGrid.tsx` — local FolderType interface, `file.type` → `file.mimeType`
   - `hooks/useAuthQueries.ts` — removed stale `data.user` access in `useLogin`, replaced `useRefreshToken` body (private method)
   - `lib/backend/auth.ts` — removed `refreshAccessToken` override (base class handles it privately)
   - Result: **0 TS errors**

4. **Deleted mock-store** (Jason's request):
   - Confirmed mock-store only used in `trpc/` files
   - Stubbed all tRPC routers (auth, chat, files) to empty routers
   - Updated `trpc/init.ts` to remove mock-store dependency (context now returns null user)
   - Deleted `lib/db/mock-store.ts`
   - Result: still 0 TS errors

5. **Planning Phase 4** (Testing + API Docs):
   - Jason asked for detailed plan before coding
   - Researched: Scalar (free, no account needed, MIT) vs Redoc vs Swagger UI — recommended Scalar (has try-it-out panel; Redoc is read-only)
   - Clarified: Skills are self-created SKILL.md files, not external
   - Identified 14 planning/documentation files across repo, 5 of which were redundant (TXT + MD files all describing same backend structure)

6. **Consolidated documentation**:
   - Updated `IMPLEMENTATION_PLAN.md` Phase 4 section from 30 lines → 400+ lines with full test coverage details from redundant files
   - Deleted 5 redundant files: `BACKEND_TEST_COVERAGE_PLAN.md`, `README_BACKEND_EXPLORATION.md`, `BACKEND_QUICK_REFERENCE.txt`, `BACKEND_MODULES_DETAILED.txt`, `START_HERE_BACKEND.txt`

7. **Executing Phase 4** (currently in progress):
   - ✅ Created `docker-compose.test.yml` — PG16 on port 15433 with tmpfs
   - ✅ Created `.env.test` with test DB URL and mocked secrets
   - ✅ Created `scripts/test-db.sh` (start/stop/migrate/reset commands)
   - ✅ Created 3 skills: `backend-testing`, `api-docs`, `e2e-testing` under `.github/skills/`
   - ✅ Installed `@nestjs/swagger` and `@scalar/nestjs-api-reference` in backend
   - 🔄 **Currently**: Read all 12 controller files, about to add Swagger decorators to them
</history>

<work_done>
Files created:
- `docker-compose.test.yml` — PG16 test DB on port 15433 with tmpfs (ephemeral, fast)
- `.env.test` — test environment variables (DB, JWT, mocked AWS/AI/email secrets)
- `scripts/test-db.sh` — start/stop/migrate/reset test DB; chmod +x
- `.github/skills/backend-testing/SKILL.md` — NestJS E2E test patterns with AAA, seed helpers, mock patterns
- `.github/skills/api-docs/SKILL.md` — Swagger decorator conventions, Scalar setup, DTO patterns
- `.github/skills/e2e-testing/SKILL.md` — Playwright E2E patterns, auth fixture, visual snapshots

Files modified:
- `IMPLEMENTATION_PLAN.md` — Phase 4 section (section 7) completely rewritten with 400+ lines covering all 12 backend test files, 291 estimated tests, code patterns, Playwright setup, Scalar setup
- `trpc/routers/chat.ts` — replaced 100-line mock → 5-line empty stub (deprecated)
- `trpc/routers/files.ts` — replaced 120-line mock → 5-line empty stub
- `trpc/routers/auth.ts` — replaced 130-line mock → 5-line empty stub
- `trpc/init.ts` — removed mock-store import; exported `createCallerFactory`; context now `{ user: null }`
- `trpc/server.ts` — fixed `createCallerFactory` to use from `./init` instead of `@trpc/server`
- `components/cases/FileGrid.tsx` — local `FolderType` interface, `file.type` → `file.mimeType`
- `hooks/useAuthQueries.ts` — fixed `data.user` access, replaced `useRefreshToken` body
- `lib/backend/auth.ts` — removed `refreshAccessToken` override
- `components/ledger/LedgerPage.tsx` — `mutateAsync()` → `mutateAsync(undefined)`
- `components/profile/ProfilePage.tsx` — `user?.company?.name` → `user?.companyId`
- `components/settings/SettingsPage.tsx` — CompanyTab rewrote using `companyId` only
- `apps/backend/package.json` — added `@nestjs/swagger`, `@scalar/nestjs-api-reference`

Files deleted:
- `lib/db/mock-store.ts`
- `BACKEND_TEST_COVERAGE_PLAN.md`
- `README_BACKEND_EXPLORATION.md`
- `BACKEND_QUICK_REFERENCE.txt`
- `BACKEND_MODULES_DETAILED.txt`
- `START_HERE_BACKEND.txt`

Current State:
- ✅ Frontend: 0 TypeScript errors
- ✅ Backend: 0 TypeScript errors
- ✅ Test infrastructure created
- ✅ 3 skills created
- ✅ Swagger + Scalar installed
- 🔄 Phase 4 SQL todos: `swagger-decorators` is next (install-api-docs marked done)
- ⏳ Remaining: swagger decorators on all controllers + DTOs, Scalar in main.ts, backend E2E tests, Playwright, frontend E2E tests
</work_done>

<technical_details>
- **Scalar vs Redoc**: Both free, MIT, no account. Scalar chosen because it has a try-it-out panel; Redoc is read-only. Package: `@scalar/nestjs-api-reference`. Theme: `kepler`. Served at `/api/docs`. Raw OpenAPI JSON at `/api/docs/swagger`.
- **tRPC is fully deprecated**: All 3 routers stubbed, mock-store deleted. App uses REST backend via `lib/backend/`. tRPC infrastructure kept only to satisfy `AppRouter` type used in `app/layout.tsx`'s `TRPCProvider`.
- **`refreshAccessToken` is private in base class**: The `Backend` base class handles token refresh internally via Axios interceptor. `AuthClient` must NOT override it. The `useRefreshToken` hook is now a no-op.
- **`User` type in AuthContext**: Only has `companyId?: string | null` — no `company` object. Frontend settings/profile pages must use `companyId` directly.
- **`exportGL.mutateAsync()` requires variables arg**: TanStack Query mutation requires explicit `undefined` when no variables: `mutateAsync(undefined)`.
- **Test Docker**: Port 15433 (avoids conflict with dev's 15432). Uses `tmpfs` for data dir — ephemeral, no cleanup needed. Healthcheck: `pg_isready -U test -d marcx_test`.
- **@marcx/db import pattern**: `import { db } from '@marcx/db'` for client; `import { tableName } from '@marcx/db/schema'` for tables. Never import drizzle directly.
- **Auth in tests**: JWT stored in httpOnly cookies. `set('Cookie', authCookie)` pattern with supertest. JwtStrategy extracts from cookie first, then Authorization header.
- **12 backend modules**: auth, user, company, company-member, case (deprecated), session, chat, document, ai-proxy, activity-log, billing, shared services (email + file storage)
- **All routes under `/api` prefix** — set globally in `main.ts`
- **Global ValidationPipe**: `{ whitelist: true, transform: true }` — strips unknown properties, transforms types
- **Skills are self-created**: Just SKILL.md files in `.github/skills/<name>/` following same pattern as existing `db-design` and `frontend-design` skills. No external dependencies.
- **291 estimated tests**: Auth (61), Company (31), Document (37), AI-Proxy (43), Session (18), Case (18), Chat (21), Company-Member (18), Billing (14), Activity-Log (11), User (11), Global (8)
- **AI-API mock in tests**: Override `AiApiClient` provider via `module.overrideProvider(AiApiClient).useValue(mockClient)`
- **Case module is deprecated**: Do not add tests for it; it will be removed in future cleanup
</technical_details>

<important_files>
- `IMPLEMENTATION_PLAN.md`
  - Master reference for entire project — phases 1–5, conventions, APIs
  - Phase 4 (section 7) recently expanded from 30 → 400+ lines with full test detail
  - Sections: 1 Current State, 2 Gap Analysis, 3 Architecture, 4–6 Phases 1–3, **7 Phase 4 (Testing)**, 8 Phase 5 (Webhooks/deferred), 9 Env Vars, 10 Data Flows, 11 Order/Dependencies, Appendices A+B, 12 Execution Guide

- `apps/backend/src/main.ts`
  - Needs Scalar + SwaggerModule setup added here (next step after decorators)
  - Current: sets global prefix `/api`, cookie parser, CORS, ValidationPipe, port 4000

- `apps/backend/src/modules/*/` (all 12 controller files)
  - All read and ready for Swagger decorator addition
  - Pattern: `@Controller('path') @UseGuards(AuthGuard)` at class level; HTTP method decorators on methods
  - File upload: `@UseInterceptors(FileInterceptor('file'))` + `@UploadedFile()`

- `apps/backend/src/modules/*/dto/*.dto.ts`
  - All need `@ApiProperty` / `@ApiPropertyOptional` decorators added
  - Validation decorators already present: `@IsEmail`, `@IsEnum`, `@IsUUID`, etc.

- `.github/skills/backend-testing/SKILL.md`
  - Full NestJS E2E test patterns: beforeAll setup mirroring main.ts, seed helpers, AAA pattern, mock pattern for AiApiClient, DTO validation tests, file upload tests

- `.github/skills/api-docs/SKILL.md`
  - Scalar setup code for main.ts, all decorator patterns, tag names per module, file upload body docs, standard HTTP response codes table

- `.github/skills/e2e-testing/SKILL.md`
  - Playwright config, auth fixture, test structure, selector priority, snapshot pattern, form interaction, `data-testid` convention

- `docker-compose.test.yml`
  - PG16 on port 15433, tmpfs data dir, healthcheck
  - Used by `scripts/test-db.sh`

- `.env.test`
  - `DATABASE_URL=postgresql://test:test@localhost:15433/marcx_test`
  - All other secrets mocked (JWT test-only, AI-API at localhost:8000, fake AWS keys)

- `.github/copilot-instructions.md`
  - Project-wide coding conventions — @marcx/db imports, NestJS module structure, naming, error handling, React Query rule (no useEffect for data fetching)
</important_files>

<next_steps>
Current SQL todo state:
- `test-docker` ✅ done
- `create-skills` ✅ done
- `install-api-docs` ✅ done
- `swagger-decorators` 🔄 in_progress (next immediate task)
- `scalar-main-ts` ⏳ pending (depends on swagger-decorators)
- `backend-e2e-tests` ⏳ pending
- `install-playwright` ⏳ pending
- `frontend-e2e-tests` ⏳ pending
- `turbo-test-pipeline` ⏳ pending
- `verify-tests` ⏳ pending

Immediate next steps:
1. **Add Swagger decorators to all 12 controllers** — all controller files have been read; ready to edit. Apply `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse`, `@ApiParam`, `@ApiQuery` per the api-docs skill conventions.
2. **Add `@ApiProperty` to all DTOs** — auth, user, company, company-member, session, chat, document, billing, activity-log, ai-proxy DTOs
3. **Configure Scalar in `main.ts`** — `DocumentBuilder` + `SwaggerModule.createDocument` + `apiReference` middleware at `/api/docs`
4. **Write backend E2E tests** — `apps/backend/test/` directory; 10 e2e spec files + 2 unit spec files + helpers (seed.ts, cleanup.ts, fixtures.ts)
5. **Install and configure Playwright** in `apps/web`
6. **Write 6 frontend E2E test files** with visual snapshots
7. **Update turbo.json** with test pipeline tasks
8. **Run and verify** all tests pass

Key context for continuing:
- All controller files were read in the last turn — their full content is available in conversation history for adding decorators
- The `@ApiBearerAuth('access-token')` key must match the `addBearerAuth(...)` call in DocumentBuilder
- Auth controller routes are NOT under `@UseGuards(AuthGuard)` at class level — only `revoke` and `revoke-all` have it at method level
- Company-member controller prefix: `companies/:companyId/members`
- Billing controller prefix: `companies/:companyId/credit`
- Activity-log controller prefix: `companies/:companyId/activity`
</next_steps>