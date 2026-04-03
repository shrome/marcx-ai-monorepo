import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, seedTestUser, TestApp, SeedResult } from './helpers/test-app';

describe('LedgerController (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let seed: SeedResult;
  let ledgerId: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    seed = await seedTestUser(testApp);
  });

  afterAll(() => app.close());

  // ── CREATE ────────────────────────────────────────────────────────────────

  describe('POST /api/ledgers', () => {
    it('creates a new ledger', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ledgers')
        .set('Cookie', seed.authCookie)
        .send({ name: 'FY 2024 General Ledger', fiscalYear: 2024 })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('FY 2024 General Ledger');
      expect(res.body.fiscalYear).toBe(2024);
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.companyId).toBe(seed.companyId);
      ledgerId = res.body.id;
    });

    it('creates a ledger with optional description', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ledgers')
        .set('Cookie', seed.authCookie)
        .send({ name: 'FY 2023 General Ledger', fiscalYear: 2023, description: 'Prior year' })
        .expect(201);

      expect(res.body.description).toBe('Prior year');
    });

    it('rejects duplicate fiscalYear within the same company', async () => {
      await request(app.getHttpServer())
        .post('/api/ledgers')
        .set('Cookie', seed.authCookie)
        .send({ name: 'Duplicate Ledger', fiscalYear: 2024 })
        .expect(409);
    });

    it('rejects missing name', async () => {
      await request(app.getHttpServer())
        .post('/api/ledgers')
        .set('Cookie', seed.authCookie)
        .send({ fiscalYear: 2025 })
        .expect(400);
    });

    it('rejects missing fiscalYear', async () => {
      await request(app.getHttpServer())
        .post('/api/ledgers')
        .set('Cookie', seed.authCookie)
        .send({ name: 'No Year Ledger' })
        .expect(400);
    });

    it('rejects fiscalYear below 2000', async () => {
      await request(app.getHttpServer())
        .post('/api/ledgers')
        .set('Cookie', seed.authCookie)
        .send({ name: 'Old Ledger', fiscalYear: 1999 })
        .expect(400);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/ledgers')
        .send({ name: 'No Auth Ledger', fiscalYear: 2030 })
        .expect(401);
    });
  });

  // ── LIST ──────────────────────────────────────────────────────────────────

  describe('GET /api/ledgers', () => {
    it('lists ledgers for the current company', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/ledgers')
        .set('Cookie', seed.authCookie)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      const ids = res.body.map((l: { id: string }) => l.id);
      expect(ids).toContain(ledgerId);
    });

    it('does not return ledgers from another company', async () => {
      const otherApp = await createTestApp();
      const otherSeed = await seedTestUser(otherApp);

      // Create a ledger under a different company
      await request(otherApp.app.getHttpServer())
        .post('/api/ledgers')
        .set('Cookie', otherSeed.authCookie)
        .send({ name: 'Other Company Ledger', fiscalYear: 2024 })
        .expect(201);

      // The original user should not see the other company's ledger
      const res = await request(app.getHttpServer())
        .get('/api/ledgers')
        .set('Cookie', seed.authCookie)
        .expect(200);

      const ids = res.body.map((l: { id: string }) => l.id);
      // All returned ledgers must belong to seed.companyId
      res.body.forEach((l: { companyId: string }) => {
        expect(l.companyId).toBe(seed.companyId);
      });
      // Verify no cross-tenant leak
      expect(ids).not.toContain(expect.stringContaining(otherSeed.companyId));

      await otherApp.app.close();
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer()).get('/api/ledgers').expect(401);
    });
  });

  // ── GET ONE ───────────────────────────────────────────────────────────────

  describe('GET /api/ledgers/:id', () => {
    it('returns ledger by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/ledgers/${ledgerId}`)
        .set('Cookie', seed.authCookie)
        .expect(200);

      expect(res.body.id).toBe(ledgerId);
      expect(res.body.fiscalYear).toBe(2024);
    });

    it('returns 404 for unknown ledger', async () => {
      await request(app.getHttpServer())
        .get('/api/ledgers/00000000-0000-0000-0000-000000000000')
        .set('Cookie', seed.authCookie)
        .expect(404);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get(`/api/ledgers/${ledgerId}`)
        .expect(401);
    });
  });

  // ── UPDATE ────────────────────────────────────────────────────────────────

  describe('PATCH /api/ledgers/:id', () => {
    it('updates ledger name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/ledgers/${ledgerId}`)
        .set('Cookie', seed.authCookie)
        .send({ name: 'FY 2024 Updated' })
        .expect(200);

      expect(res.body.name).toBe('FY 2024 Updated');
    });

    it('updates ledger status to CLOSED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/ledgers/${ledgerId}`)
        .set('Cookie', seed.authCookie)
        .send({ status: 'CLOSED' })
        .expect(200);

      expect(res.body.status).toBe('CLOSED');
    });

    it('rejects invalid status value', async () => {
      await request(app.getHttpServer())
        .patch(`/api/ledgers/${ledgerId}`)
        .set('Cookie', seed.authCookie)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });

    it('returns 404 for unknown ledger', async () => {
      await request(app.getHttpServer())
        .patch('/api/ledgers/00000000-0000-0000-0000-000000000000')
        .set('Cookie', seed.authCookie)
        .send({ name: 'Ghost' })
        .expect(404);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch(`/api/ledgers/${ledgerId}`)
        .send({ name: 'No Auth' })
        .expect(401);
    });
  });

  // ── DELETE ────────────────────────────────────────────────────────────────

  describe('DELETE /api/ledgers/:id', () => {
    it('deletes a ledger', async () => {
      await request(app.getHttpServer())
        .delete(`/api/ledgers/${ledgerId}`)
        .set('Cookie', seed.authCookie)
        .expect(200);
    });

    it('returns 404 after deletion', async () => {
      await request(app.getHttpServer())
        .get(`/api/ledgers/${ledgerId}`)
        .set('Cookie', seed.authCookie)
        .expect(404);
    });

    it('returns 404 for unknown ledger', async () => {
      await request(app.getHttpServer())
        .delete('/api/ledgers/00000000-0000-0000-0000-000000000000')
        .set('Cookie', seed.authCookie)
        .expect(404);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .delete(`/api/ledgers/${ledgerId}`)
        .expect(401);
    });
  });

  // ── LEDGER → SESSION SCOPING ──────────────────────────────────────────────

  describe('Session scoped by ledgerId', () => {
    it('creates a session linked to a ledger', async () => {
      // Create a fresh ledger for this sub-test
      const ledgerRes = await request(app.getHttpServer())
        .post('/api/ledgers')
        .set('Cookie', seed.authCookie)
        .send({ name: 'Session Test Ledger', fiscalYear: 2025 })
        .expect(201);

      const scopedLedgerId: string = ledgerRes.body.id;

      const sessionRes = await request(app.getHttpServer())
        .post('/api/sessions/chat')
        .set('Cookie', seed.authCookie)
        .send({ title: 'Ledger Chat', ledgerId: scopedLedgerId })
        .expect(201);

      expect(sessionRes.body).toHaveProperty('id');
      expect(sessionRes.body.ledgerId).toBe(scopedLedgerId);
    });
  });
});
