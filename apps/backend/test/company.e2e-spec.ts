import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, seedTestUser, TestApp, SeedResult } from './helpers/test-app';

describe('CompanyController (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let seed: SeedResult;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    seed = await seedTestUser(testApp);
  });

  afterAll(() => app.close());

  describe('GET /api/company/:id', () => {
    it('returns company details for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/company/${seed.companyId}`)
        .set('Cookie', seed.authCookie)
        .expect(200);

      expect(res.body).toHaveProperty('id', seed.companyId);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get(`/api/company/${seed.companyId}`)
        .expect(401);
    });

    it('returns 404 for non-existent company', async () => {
      await request(app.getHttpServer())
        .get('/api/company/00000000-0000-0000-0000-000000000000')
        .set('Cookie', seed.authCookie)
        .expect(404);
    });
  });

  describe('PATCH /api/company/:id', () => {
    it('updates company name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/company/${seed.companyId}`)
        .set('Cookie', seed.authCookie)
        .send({ name: 'Updated Company Name' })
        .expect(200);

      expect(res.body).toHaveProperty('name', 'Updated Company Name');
    });

    it('rejects invalid category', async () => {
      await request(app.getHttpServer())
        .patch(`/api/company/${seed.companyId}`)
        .set('Cookie', seed.authCookie)
        .send({ category: 'INVALID' })
        .expect(400);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch(`/api/company/${seed.companyId}`)
        .send({ name: 'x' })
        .expect(401);
    });
  });

  describe('GET /api/company/:id/users', () => {
    it('returns company members', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/company/${seed.companyId}/users`)
        .set('Cookie', seed.authCookie)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
