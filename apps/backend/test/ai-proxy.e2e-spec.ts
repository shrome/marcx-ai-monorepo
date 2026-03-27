import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, seedTestUser, TestApp, SeedResult } from './helpers/test-app';
import { AiApiClient } from '../src/modules/ai-proxy/ai-api.client';

describe('AiProxyController (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let seed: SeedResult;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;

    // Mock all AiApiClient HTTP methods to avoid hitting real AI-API
    const aiClient = app.get(AiApiClient);
    jest.spyOn(aiClient, 'post').mockResolvedValue({ data: { presignedUrl: 'https://s3.test/url', status: 'ok' } });
    jest.spyOn(aiClient, 'get').mockResolvedValue({ data: { status: 'PENDING', accounts: [], rules: [], usage: {}, transactions: [] } });
    jest.spyOn(aiClient, 'put').mockResolvedValue({ data: { message: 'ok' } });
    jest.spyOn(aiClient, 'delete').mockResolvedValue({ data: { message: 'ok' } });

    seed = await seedTestUser(testApp);
  });

  afterAll(() => {
    jest.restoreAllMocks();
    return app.close();
  });

  describe('POST /api/ai/ocr/presign', () => {
    it('returns a presigned S3 URL', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ai/ocr/presign')
        .set('Cookie', seed.authCookie)
        .send({ filename: 'invoice.pdf', contentType: 'application/pdf' })
        .expect(201);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('presignedUrl');
    });

    it('rejects missing filename', async () => {
      await request(app.getHttpServer())
        .post('/api/ai/ocr/presign')
        .set('Cookie', seed.authCookie)
        .send({ contentType: 'application/pdf' })
        .expect(400);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/ai/ocr/presign')
        .send({ filename: 'f.pdf', contentType: 'application/pdf' })
        .expect(401);
    });
  });

  describe('GET /api/ai/general-ledger/status', () => {
    it('returns GL status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/ai/general-ledger/status')
        .set('Cookie', seed.authCookie)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  describe('GET /api/ai/chart-of-accounts', () => {
    it('returns chart of accounts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/ai/chart-of-accounts')
        .set('Cookie', seed.authCookie)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  describe('GET /api/ai/llm/usage', () => {
    it('returns LLM usage stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/ai/llm/usage?period=2024')
        .set('Cookie', seed.authCookie)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });
});
