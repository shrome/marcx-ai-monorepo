---
name: backend-testing
description: Write clean, comprehensive NestJS E2E and unit tests following the marcx-ai-monorepo project patterns. Use this skill when the user asks to write backend tests, add test coverage, create test helpers, or test NestJS controllers/services/guards.
license: MIT
---

This skill guides writing clean, production-grade backend tests for the NestJS backend in `apps/backend/`. Tests are E2E integration tests by default (real HTTP + real test database), with unit tests only for pure logic like clients and resolvers.

## Project Context

- **Framework**: NestJS 11, Jest 30, Supertest 7
- **Test DB**: PostgreSQL 16 on port 15433 via `docker-compose.test.yml` (see root)
- **Env file**: `.env.test` at repo root
- **Auth**: JWT stored in httpOnly cookies. Guards extract from cookie first, then Authorization header.
- **Global prefix**: All routes are under `/api`
- **Global pipe**: `ValidationPipe({ whitelist: true, transform: true })`
- **@marcx/db**: Import pattern `import { db } from '@marcx/db'` — never import drizzle directly

## Test Types

### E2E Tests (preferred)
Located in `apps/backend/test/`. File naming: `<module>.e2e-spec.ts`.
Test real HTTP requests against a real test database. Do NOT mock services — test the full stack.

### Unit Tests (for pure logic only)
Located in `apps/backend/src/modules/<module>/<file>.spec.ts`.
Use only for logic with no HTTP layer: `AiApiClient`, `TenantResolverService`.

## E2E Test Structure

```typescript
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import cookieParser from 'cookie-parser'
import { AppModule } from '../../src/app.module'
import { seedTestUser, cleanupDb } from './helpers/seed'

describe('DocumentController (e2e)', () => {
  let app: INestApplication
  let authCookie: string
  let companyId: string

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    // Mirror main.ts setup exactly
    app.setGlobalPrefix('api')
    app.use(cookieParser())
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()

    const seed = await seedTestUser(app)
    authCookie = seed.authCookie
    companyId = seed.companyId
  })

  afterAll(async () => {
    await cleanupDb()
    await app.close()
  })

  describe('POST /api/documents', () => {
    it('201 — uploads file and creates document', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/documents')
        .set('Cookie', authCookie)
        .attach('file', Buffer.from('pdf-content'), {
          filename: 'invoice.pdf',
          contentType: 'application/pdf',
        })
        .field('sessionId', testSessionId)
        .expect(201)

      expect(res.body).toHaveProperty('id')
      expect(res.body.name).toBe('invoice.pdf')
    })

    it('400 — rejects without file', async () => {
      await request(app.getHttpServer())
        .post('/api/documents')
        .set('Cookie', authCookie)
        .send({ sessionId: testSessionId })
        .expect(400)
    })

    it('401 — rejects unauthenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/documents')
        .expect(401)
    })
  })
})
```

## Test Helpers Pattern

```typescript
// test/helpers/seed.ts
import * as request from 'supertest'
import { INestApplication } from '@nestjs/common'

export async function seedTestUser(app: INestApplication) {
  // 1. Register user
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email: 'test@marcx.test', name: 'Test User' })

  // 2. Verify OTP (use test OTP bypass or read from mock email service)
  const verifyRes = await request(app.getHttpServer())
    .post('/api/auth/register/verify')
    .send({ email: 'test@marcx.test', code: '000000' })

  const authCookie = verifyRes.headers['set-cookie']

  // 3. Create company
  const companyRes = await request(app.getHttpServer())
    .post('/api/company/register')
    .set('Cookie', authCookie)
    .send({ name: 'Test Company', category: 'ACCOUNTING' })

  return { authCookie, companyId: companyRes.body.id }
}

export async function cleanupDb() {
  // Truncate all tables in reverse dependency order
  const { db } = await import('@marcx/db')
  await db.execute(`TRUNCATE TABLE
    chat_messages, files, sessions,
    company_members, companies,
    credentials, users
    CASCADE`)
}
```

## AAA Pattern (Always Follow)

```typescript
it('description of what it tests', async () => {
  // Arrange — set up data
  const sessionRes = await request(app.getHttpServer())
    .post('/api/sessions')
    .set('Cookie', authCookie)
    .send({ title: 'Test Session' })

  // Act — perform the action being tested
  const res = await request(app.getHttpServer())
    .get(`/api/sessions/${sessionRes.body.id}`)
    .set('Cookie', authCookie)

  // Assert — verify the result
  expect(res.status).toBe(200)
  expect(res.body.id).toBe(sessionRes.body.id)
})
```

## What to Always Test Per Endpoint

1. **Happy path** (200/201) — valid input, authenticated, expected response shape
2. **401** — missing auth cookie/token
3. **400** — invalid/missing required fields (DTO validation)
4. **404** — resource not found (where applicable)
5. **403** — wrong company/user (tenant isolation)

## Mocking External Services

For AI-API calls in `ai-proxy` tests, override the module:

```typescript
const module = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideProvider(AiApiClient)
  .useValue({
    post: jest.fn().mockResolvedValue({ status: 'queued' }),
    get: jest.fn().mockResolvedValue({ status: 'completed' }),
  })
  .compile()
```

## DTO Validation Unit Test Pattern

```typescript
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'

describe('CreateDocumentDto', () => {
  it('passes with valid sessionId', async () => {
    const dto = plainToInstance(CreateDocumentDto, {
      sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('fails with non-UUID sessionId', async () => {
    const dto = plainToInstance(CreateDocumentDto, { sessionId: 'not-a-uuid' })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('sessionId')
  })
})
```

## Key Rules

- Always mirror `main.ts` setup in `beforeAll` (prefix, pipes, cookie parser)
- Use `afterAll` to close the app: `await app.close()`
- Never hardcode UUIDs — use seeded IDs from `seedTestUser()`
- Test auth guard on EVERY authenticated endpoint (one 401 test is enough per controller)
- For file upload tests, use `Buffer.from(...)` not actual files on disk
- Clean up test data between test suites using `cleanupDb()`
