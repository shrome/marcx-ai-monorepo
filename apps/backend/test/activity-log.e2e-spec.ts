import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, seedTestUser, TestApp, SeedResult } from './helpers/test-app';

describe('ActivityLogController (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let seed: SeedResult;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    seed = await seedTestUser(testApp);

    // Trigger some activity
    await request(app.getHttpServer())
      .post('/api/sessions')
      .set('Cookie', seed.authCookie)
      .send({ title: 'Activity Trigger' });
  });

  afterAll(() => app.close());

  describe('GET /api/companies/:companyId/activity', () => {
    it('lists activity logs for company', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/companies/${seed.companyId}/activity`)
        .set('Cookie', seed.authCookie)
        .expect(200);

      // Returns paginated { data, page, limit }
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('supports action filter', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/companies/${seed.companyId}/activity?action=SESSION_CREATED`)
        .set('Cookie', seed.authCookie)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get(`/api/companies/${seed.companyId}/activity`)
        .expect(401);
    });
  });
});
