<overview>
Jason is building a multi-tenant AI-powered accounting platform (marcx-ai-monorepo) with a NestJS backend, Next.js frontend, shared `@marcx/db` Drizzle ORM package, and an external Django/LangGraph AI-API. The session resumed from prior checkpoints where Phases 1–3 were complete. Phase 4 (Testing + API Docs) is now well underway: Swagger decorators were added to all controllers and DTOs, Scalar API docs are configured in main.ts, all backend E2E test files were written, and test infrastructure issues (ts-jest config, EmailService mocking) are being actively debugged and fixed.
</overview>

<history>
1. **Resumed mid-Phase 4** after prior checkpoint (phases 1–3 complete, swagger-decorators in progress)
   - Added `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse`, `@ApiParam`, `@ApiQuery`, `@ApiConsumes` to all 9 active controllers (auth, user, company, company-member, session, chat, document, billing, activity-log, ai-proxy)
   - Added `@ApiProperty` / `@ApiPropertyOptional` to all 9 DTO files
   - Configured Scalar API docs in `main.ts` (dev-only, served at `/api/docs`, raw JSON at `/api/docs/swagger`)
   - Fixed duplicate class bug: the `old_str` in edit tool only matched the imports section, leaving old class bodies appended — fixed by truncating files at the duplicate interface line

2. **Wrote all backend E2E test files**
   - Created `test/helpers/seed.ts` (initial version — later superseded)
   - Created 9 spec files: auth, user, company, company-member, session, document, chat, billing, activity-log, ai-proxy
   - Created `test/jest-e2e.json` updates and `test/setup-env.js`
   - Installed Playwright, created `playwright.config.ts`, 5 frontend E2E spec files + `auth.setup.ts`
   - Updated `turbo.json` with `test` and `test:e2e` pipeline tasks
   - Added `test:e2e` scripts to `apps/web/package.json`

3. **Jason reported errors running the test commands**
   - First error: `ts-jest` `globals` deprecation + `resolvePackageJsonExports` conflict with `moduleResolution: node` override → Fixed by creating `tsconfig.test.json` (extends main tsconfig, overrides to commonjs/node without `resolvePackageJsonExports`) and updating `jest-e2e.json` to use modern transform syntax
   - Second error: test DB missing tables (`relation "User" does not exist`) → Fixed by running migrations via `node -e "require('./packages/drizzle/dist/index.cjs').migrations()..."` and fixing the broken `migrate()` function in `test-db.sh`
   - Third error: `dotenv/config` loading wrong `.env` file → Fixed with `test/setup-env.js` that explicitly loads `.env.test`
   - Fourth error (current): `EmailService` throws Resend API 401 (`API key is invalid`) which propagates and causes `POST /api/auth/register` to return 401 → Root cause identified: `sendOtpEmail` throws on Resend error, OTP is random (not `000000`), tests cannot guess it

4. **Jason asked to record progress for future models and add rule to instruction file**
   - This is being handled via the checkpoint summary (this document)
   - Still need to add instruction to `.github/copilot-instructions.md`

5. **Currently mid-fix**: Created `MockEmailService` (captures OTPs in memory) and new `test/helpers/test-app.ts` factory (creates TestingModule with `EmailService` overridden by `MockEmailService`). Rewrote `auth.e2e-spec.ts`. Was in the process of updating all other spec files when compaction occurred.
</history>

<work_done>
Files created:
- `apps/backend/tsconfig.test.json` — extends main tsconfig with `module: commonjs`, `moduleResolution: node`, `resolvePackageJsonExports: false` for jest compatibility
- `apps/backend/test/setup-env.js` — explicitly loads `.env.test` before tests run
- `apps/backend/test/helpers/mock-email.service.ts` — `MockEmailService` that captures OTP codes in a Map instead of calling Resend API
- `apps/backend/test/helpers/test-app.ts` — `createTestApp()` factory that builds a TestingModule with `EmailService` overridden, and updated `seedTestUser()` that retrieves real OTP from `MockEmailService`
- `apps/backend/test/helpers/seed.ts` — original seed helper (superseded by `test-app.ts`, but still exists)
- `apps/backend/test/auth.e2e-spec.ts` — fully rewritten to use `createTestApp` and real OTP from mock
- `apps/backend/test/{user,company,company-member,session,document,chat,billing,activity-log,ai-proxy}.e2e-spec.ts` — created, old import lines stripped but NOT yet updated to use `createTestApp`
- `apps/backend/test/jest-e2e.json` — updated: uses `tsconfig.test.json`, modern ts-jest transform syntax, `setup-env.js`
- `apps/backend/tsconfig.test.json` — created for jest-compatible TS compilation
- `apps/web/playwright.config.ts` — Playwright config with auth project + chromium, dev server
- `apps/web/e2e/auth.setup.ts` — auth fixture that logs in once, saves `storageState`
- `apps/web/e2e/{navigation,chat,documents,ledger,settings}.spec.ts` — 5 frontend E2E test files

Files modified:
- `apps/backend/src/modules/auth/auth.controller.ts` — added full Swagger decorators
- `apps/backend/src/modules/user/user.controller.ts` — added Swagger decorators
- `apps/backend/src/modules/company/company.controller.ts` — added Swagger decorators
- `apps/backend/src/modules/company-member/company-member.controller.ts` — added Swagger decorators
- `apps/backend/src/modules/session/session.controller.ts` — added Swagger decorators
- `apps/backend/src/modules/chat/chat.controller.ts` — added Swagger decorators
- `apps/backend/src/modules/document/document.controller.ts` — added Swagger decorators
- `apps/backend/src/modules/billing/billing.controller.ts` — added Swagger decorators
- `apps/backend/src/modules/activity-log/activity-log.controller.ts` — added Swagger decorators
- `apps/backend/src/modules/ai-proxy/ai-proxy.controller.ts` — added Swagger decorators
- `apps/backend/src/modules/auth/dto/auth.dto.ts` — added `@ApiProperty`
- `apps/backend/src/modules/user/dto/user.dto.ts` — added `@ApiPropertyOptional`
- `apps/backend/src/modules/company/dto/company.dto.ts` — added `@ApiProperty`
- `apps/backend/src/modules/company-member/dto/company-member.dto.ts` — added `@ApiProperty`
- `apps/backend/src/modules/session/dto/session.dto.ts` — added `@ApiProperty`
- `apps/backend/src/modules/chat/dto/chat.dto.ts` — added `@ApiProperty`
- `apps/backend/src/modules/document/dto/document.dto.ts` — added `@ApiProperty`
- `apps/backend/src/modules/billing/dto/billing.dto.ts` — added `@ApiProperty`
- `apps/backend/src/modules/activity-log/dto/activity-log.dto.ts` — added `@ApiPropertyOptional`
- `apps/backend/src/main.ts` — added SwaggerModule + Scalar setup (dev-only)
- `scripts/test-db.sh` — fixed `migrate()` function to use `node` + built dist instead of `pnpm tsx`
- `turbo.json` — added `test` and `test:e2e` pipeline tasks
- `apps/web/package.json` — added `test:e2e`, `test:e2e:ui`, `test:e2e:report` scripts

Current state:
- ✅ Backend TypeScript: 0 errors
- ✅ Swagger decorators on all controllers + DTOs
- ✅ Scalar docs configured in main.ts
- ✅ Test infrastructure: docker, .env.test, jest-e2e.json, tsconfig.test.json, setup-env.js
- ✅ `auth.e2e-spec.ts` — fully updated to use `createTestApp` + real OTP
- ⚠️ All other 8 spec files — old imports stripped but NOT updated to use `createTestApp` yet; they still use the old `bootstrapApp`/`seedTestUser` from old `seed.ts` (which doesn't mock email service)
- ❌ Tests not yet passing — need to finish updating all spec files
</work_done>

<technical_details>
**EmailService / OTP mocking:**
- `EmailService` uses Resend API. Invalid key causes it to throw an error object `{ statusCode: 401, name: 'validation_error', message: 'API key is invalid' }` which NestJS re-throws as-is, making `POST /api/auth/register` return 401 instead of 201.
- OTP is generated as `Math.floor(100000 + Math.random() * 900000).toString()` — truly random, cannot be hardcoded as `000000`.
- Fix: `MockEmailService` stores OTP in a `Map<email, code>`. Tests call `testApp.emailService.getLastOtp(email)` to retrieve the real OTP.
- Override pattern: `Test.createTestingModule({...}).overrideProvider(EmailService).useClass(MockEmailService)`

**ts-jest + nodenext tsconfig conflict:**
- Main `tsconfig.json` uses `module: nodenext`, `moduleResolution: nodenext`, `resolvePackageJsonExports: true`
- Jest/ts-jest requires `module: commonjs` and `moduleResolution: node`
- `resolvePackageJsonExports: true` is incompatible with `moduleResolution: node` — causes `TS5098` error
- Fix: `tsconfig.test.json` extends main but overrides all three options; `jest-e2e.json` references it via modern transform syntax `["ts-jest", { "tsconfig": "./tsconfig.test.json" }]`

**dotenv loading in tests:**
- `dotenv/config` loads `.env` by default, not `.env.test`
- Fix: `test/setup-env.js` uses `require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.test') })`
- Referenced in `jest-e2e.json` as `"setupFiles": ["<rootDir>/setup-env.js"]`

**Migrations for test DB:**
- `scripts/test-db.sh migrate` used `pnpm tsx` which wasn't available — fixed to use `node` with the pre-built `packages/drizzle/dist/index.cjs`
- Migrations must be run once before any tests: `bash scripts/test-db.sh migrate`
- Test DB: PostgreSQL on port 15433 (avoids conflict with dev on 15432)

**Duplicate class bug from edit tool:**
- When replacing only the import block at the top of a file, the old class body remained, creating duplicate class exports
- Detected by `TS2300: Duplicate identifier` errors
- Fixed by truncating each file at the line before the second `interface RequestWithUser` declaration using `head -n $((line - 2))`

**Scalar docs setup:**
- Package: `@scalar/nestjs-api-reference` → `apiReference({ content: document, theme: 'kepler' })`
- Raw OpenAPI JSON served by `SwaggerModule.setup('api/docs/swagger', app, document)` at `/api/docs/swagger`
- Scalar UI served at `/api/docs` via `app.use('/api/docs', apiReference(...))`
- `addBearerAuth(...)` key must match `@ApiBearerAuth('access-token')` in controllers

**Test commands (correct):**
```bash
# Start test DB
bash scripts/test-db.sh start

# Run migrations (once)
bash scripts/test-db.sh migrate

# Run backend E2E tests
cd apps/backend && pnpm test:e2e

# Run frontend E2E tests (needs dev server)
cd apps/web && pnpm test:e2e
```

**jest --testPathPatterns flag:**
- Jest 30 renamed `--testPathPattern` to `--testPathPatterns` (plural)

**`@marcx/db` import pattern:**
- `import { db } from '@marcx/db'` for client
- `import { tableName } from '@marcx/db/schema'` for tables
- Never import drizzle-orm directly in backend/frontend
</technical_details>

<important_files>
- `apps/backend/test/helpers/test-app.ts`
  - **Critical**: The correct way to create test app instances with mocked EmailService
  - `createTestApp()` → returns `{ app, emailService: MockEmailService }`
  - `seedTestUser(testApp)` → registers user, gets real OTP from mock, verifies, creates company
  - All 8 remaining spec files need to be updated to import and use this

- `apps/backend/test/helpers/mock-email.service.ts`
  - `MockEmailService` that captures OTPs in `Map<email, code>`
  - `getLastOtp(email)` → used in seed + direct tests
  - `clearOtps()` → for cleanup between tests if needed

- `apps/backend/test/auth.e2e-spec.ts`
  - **Reference implementation** — already fully updated to use `createTestApp` and real OTP retrieval
  - Use this as the template for updating all other 8 spec files

- `apps/backend/test/{user,company,company-member,session,document,chat,billing,activity-log,ai-proxy}.e2e-spec.ts`
  - **8 spec files that need updating**: old imports stripped but still use old `bootstrapApp`/`seedTestUser` pattern
  - Need to add: `import { createTestApp, seedTestUser, TestApp } from './helpers/test-app';`
  - Need to change: `beforeAll` to use `createTestApp()` instead of manual `Test.createTestingModule(...).compile()`
  - Need to change: `seedTestUser(app)` → `seedTestUser(testApp)`

- `apps/backend/test/jest-e2e.json`
  - Jest config for E2E tests; uses `tsconfig.test.json` and `setup-env.js`

- `apps/backend/tsconfig.test.json`
  - Overrides main tsconfig for jest compatibility (commonjs, no resolvePackageJsonExports)

- `apps/backend/test/setup-env.js`
  - Loads `.env.test` explicitly before tests

- `apps/backend/src/main.ts`
  - Scalar + SwaggerModule setup (dev-only, wrapped in `NODE_ENV !== 'production'`)

- `scripts/test-db.sh`
  - Fixed `migrate()` to use `node` + built dist; `start`/`stop`/`reset` commands

- `.env.test`
  - Test DB URL (`postgresql://test:test@localhost:15433/marcx_test`), fake JWT/AWS/AI secrets
  - `RESEND_API_KEY` is absent/fake — that's why EmailService must be mocked

- `apps/backend/src/services/email.service.ts`
  - Uses Resend API; throws on invalid API key → must always be mocked in tests
  - `sendOtpEmail({ to, name, code, purpose })` is the method to mock
</important_files>

<next_steps>
**Immediate — finish test fixes (blocking):**

1. **Update all 8 remaining spec files** to use `createTestApp`/`seedTestUser` from `test/helpers/test-app.ts`. For each file, the pattern is:
   ```ts
   import { INestApplication } from '@nestjs/common';
   import request from 'supertest';
   import { createTestApp, seedTestUser, TestApp, SeedResult } from './helpers/test-app';

   describe('XxxController (e2e)', () => {
     let testApp: TestApp;
     let app: INestApplication;
     let seed: SeedResult;

     beforeAll(async () => {
       testApp = await createTestApp();
       app = testApp.app;
       seed = await seedTestUser(testApp);
     });

     afterAll(() => app.close());
     // ... tests
   });
   ```
   Files to update: `user`, `company`, `company-member`, `session`, `document`, `chat`, `billing`, `activity-log`, `ai-proxy`

2. **Run and verify tests pass**: `bash scripts/test-db.sh start && bash scripts/test-db.sh migrate && cd apps/backend && pnpm test:e2e`

3. **Checkpoint the progress** — update `IMPLEMENTATION_PLAN.md` to reflect current Phase 4 status.

**After tests are green:**

4. **Add progress-tracking rule to `.github/copilot-instructions.md`** — Jason explicitly asked to add a rule that says models should update the IMPLEMENTATION_PLAN.md and create checkpoints to track progress for future model handoffs.

5. **`verify-tests` todo** (the only pending SQL todo) — run full test suite and confirm all pass.

6. **Frontend E2E** — Playwright tests are written but need a running dev server + backend to actually execute. These can be verified once the backend tests are stable.

7. **Phase 5 (Webhooks)** — deferred, needs Jason's approval per prior discussion.
</next_steps>