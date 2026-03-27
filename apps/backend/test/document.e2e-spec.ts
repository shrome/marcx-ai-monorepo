import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, seedTestUser, TestApp, SeedResult } from './helpers/test-app';

describe('DocumentController (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let seed: SeedResult;
  let sessionId: string;
  let documentId: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    seed = await seedTestUser(testApp);

    const sessionRes = await request(app.getHttpServer())
      .post('/api/sessions')
      .set('Cookie', seed.authCookie)
      .send({ title: 'Doc Session', fiscalYear: 2024 })
      .expect(201);

    sessionId = sessionRes.body.id;
  });

  afterAll(() => app.close());

  describe('POST /api/documents', () => {
    it('uploads a document file', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/documents')
        .set('Cookie', seed.authCookie)
        .field('sessionId', sessionId)
        .field('documentType', 'INVOICE')
        .attach('file', Buffer.from('%PDF-1.4 test'), 'invoice.pdf')
        .expect(201);

      expect(res.body).toHaveProperty('id');
      documentId = res.body.id;
    });

    it('rejects upload without a file', async () => {
      await request(app.getHttpServer())
        .post('/api/documents')
        .set('Cookie', seed.authCookie)
        .send({ sessionId })
        .expect(400);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/documents')
        .attach('file', Buffer.from('x'), 'test.pdf')
        .expect(401);
    });
  });

  describe('GET /api/documents', () => {
    it('lists documents for current company', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/documents')
        .set('Cookie', seed.authCookie)
        .expect(200);

      // Returns paginated { data, page, limit }
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/documents/:id', () => {
    it('returns document by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/documents/${documentId}`)
        .set('Cookie', seed.authCookie)
        .expect(200);

      expect(res.body.id).toBe(documentId);
    });

    it('returns 404 for unknown document', async () => {
      await request(app.getHttpServer())
        .get('/api/documents/00000000-0000-0000-0000-000000000000')
        .set('Cookie', seed.authCookie)
        .expect(404);
    });
  });

  describe('PATCH /api/documents/:id', () => {
    it('updates document draft data', async () => {
      await request(app.getHttpServer())
        .patch(`/api/documents/${documentId}`)
        .set('Cookie', seed.authCookie)
        .send({ notes: 'Needs review' })
        .expect(200);
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('soft-deletes a document', async () => {
      await request(app.getHttpServer())
        .delete(`/api/documents/${documentId}`)
        .set('Cookie', seed.authCookie)
        .expect(200);
    });
  });
});
