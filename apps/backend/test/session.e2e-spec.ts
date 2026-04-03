import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, seedTestUser, TestApp, SeedResult } from './helpers/test-app';

describe('SessionController (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let seed: SeedResult;
  let sessionId: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    seed = await seedTestUser(testApp);
  });

  afterAll(() => app.close());

  describe('POST /api/sessions', () => {
    it('creates a new session', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/sessions')
        .set('Cookie', seed.authCookie)
        .send({ title: 'Test Session' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Test Session');
      sessionId = res.body.id;
    });

    it('rejects missing title', async () => {
      await request(app.getHttpServer())
        .post('/api/sessions')
        .set('Cookie', seed.authCookie)
        .send({})
        .expect(400);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/sessions')
        .send({ title: 'x' })
        .expect(401);
    });
  });

  describe('GET /api/sessions', () => {
    it('lists sessions for current user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/sessions')
        .set('Cookie', seed.authCookie)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer()).get('/api/sessions').expect(401);
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('returns session by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/sessions/${sessionId}`)
        .set('Cookie', seed.authCookie)
        .expect(200);

      expect(res.body.id).toBe(sessionId);
    });

    it('returns 404 for unknown session', async () => {
      await request(app.getHttpServer())
        .get('/api/sessions/00000000-0000-0000-0000-000000000000')
        .set('Cookie', seed.authCookie)
        .expect(404);
    });
  });

  describe('PATCH /api/sessions/:id', () => {
    it('updates session title', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/sessions/${sessionId}`)
        .set('Cookie', seed.authCookie)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(res.body.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/sessions/:id', () => {
    it('deletes session', async () => {
      await request(app.getHttpServer())
        .delete(`/api/sessions/${sessionId}`)
        .set('Cookie', seed.authCookie)
        .expect(200);
    });

    it('returns 404 after deletion', async () => {
      await request(app.getHttpServer())
        .get(`/api/sessions/${sessionId}`)
        .set('Cookie', seed.authCookie)
        .expect(404);
    });
  });
});
