import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, seedTestUser, TestApp, SeedResult } from './helpers/test-app';

describe('BillingController (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let seed: SeedResult;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    seed = await seedTestUser(testApp);
  });

  afterAll(() => app.close());

  describe('GET /api/companies/:companyId/credit', () => {
    it('returns credit balance', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/companies/${seed.companyId}/credit`)
        .set('Cookie', seed.authCookie)
        .expect(200);

      expect(res.body).toHaveProperty('balance');
      // Drizzle returns decimal as string
      expect(typeof res.body.balance).toBe('string');
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get(`/api/companies/${seed.companyId}/credit`)
        .expect(401);
    });
  });

  describe('POST /api/companies/:companyId/credit/top-up', () => {
    it('adds credits to company balance', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/companies/${seed.companyId}/credit/top-up`)
        .set('Cookie', seed.authCookie)
        .send({ amount: 100, reference: 'TEST-001' })
        .expect(201);

      expect(res.body).toBeDefined();
    });

    it('rejects amount below minimum', async () => {
      await request(app.getHttpServer())
        .post(`/api/companies/${seed.companyId}/credit/top-up`)
        .set('Cookie', seed.authCookie)
        .send({ amount: 0 })
        .expect(400);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .post(`/api/companies/${seed.companyId}/credit/top-up`)
        .send({ amount: 50 })
        .expect(401);
    });
  });

  describe('GET /api/companies/:companyId/credit/transactions', () => {
    it('lists credit transactions', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/companies/${seed.companyId}/credit/transactions`)
        .set('Cookie', seed.authCookie)
        .expect(200);

      // Returns paginated { data, page, limit }
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
