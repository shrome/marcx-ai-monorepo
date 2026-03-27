import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, seedTestUser, TestApp, SeedResult } from './helpers/test-app';

describe('ChatController (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let seed: SeedResult;
  let sessionId: string;
  let messageId: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    seed = await seedTestUser(testApp);

    const sessionRes = await request(app.getHttpServer())
      .post('/api/sessions')
      .set('Cookie', seed.authCookie)
      .send({ title: 'Chat Session', fiscalYear: 2024 })
      .expect(201);

    sessionId = sessionRes.body.id;
  });

  afterAll(() => app.close());

  describe('POST /api/chat/sessions/:sessionId/messages', () => {
    it('creates a text message', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .set('Cookie', seed.authCookie)
        .field('content', 'Summarise my invoices')
        .expect(201);

      expect(res.body).toHaveProperty('id');
      messageId = res.body.id;
    });

    it('rejects empty content', async () => {
      await request(app.getHttpServer())
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .set('Cookie', seed.authCookie)
        .field('content', '')
        .expect(400);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .field('content', 'test')
        .expect(401);
    });
  });

  describe('GET /api/chat/sessions/:sessionId/messages', () => {
    it('returns messages in session', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/chat/sessions/${sessionId}/messages`)
        .set('Cookie', seed.authCookie)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get(`/api/chat/sessions/${sessionId}/messages`)
        .expect(401);
    });
  });

  describe('DELETE /api/chat/messages/:id', () => {
    it('deletes a message', async () => {
      await request(app.getHttpServer())
        .delete(`/api/chat/messages/${messageId}`)
        .set('Cookie', seed.authCookie)
        .expect(200);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .delete(`/api/chat/messages/${messageId}`)
        .expect(401);
    });
  });
});
