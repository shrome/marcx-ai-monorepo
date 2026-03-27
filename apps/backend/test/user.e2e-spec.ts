import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, seedTestUser, TestApp, SeedResult } from './helpers/test-app';

describe('UserController (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let seed: SeedResult;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    seed = await seedTestUser(testApp);
  });

  afterAll(() => app.close());

  describe('GET /api/users/me', () => {
    it('returns current user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Cookie', seed.authCookie)
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id', seed.userId);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer()).get('/api/users/me').expect(401);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('updates current user name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${seed.userId}`)
        .set('Cookie', seed.authCookie)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.name).toBe('Updated Name');
    });

    it('strips unknown fields (whitelist)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${seed.userId}`)
        .set('Cookie', seed.authCookie)
        .send({ name: 'Valid', unknownField: 'stripped' })
        .expect(200);

      expect(res.body).not.toHaveProperty('unknownField');
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch(`/api/users/${seed.userId}`)
        .send({ name: 'x' })
        .expect(401);
    });
  });
});
