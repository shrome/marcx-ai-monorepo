import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, seedTestUser, TestApp } from './helpers/test-app';

describe('AuthController (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let testEmail: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    testEmail = `auth-test-${Date.now()}@example.com`;
  });

  afterAll(() => app.close());

  // ── Registration ─────────────────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('registers a new user and sends OTP', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: testEmail, name: 'Auth Test User' })
        .expect(201);

      expect(res.body).toHaveProperty('message');
    });

    it('rejects invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', name: 'Test' })
        .expect(400);
    });

    it('rejects missing name', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'valid@example.com' })
        .expect(400);
    });
  });

  // ── OTP Verification ─────────────────────────────────────────────────────

  describe('POST /api/auth/register/verify', () => {
    it('verifies OTP and returns tokens in cookies', async () => {
      const otp = testApp.emailService.getLastOtp(testEmail);
      expect(otp).toBeDefined();

      const res = await request(app.getHttpServer())
        .post('/api/auth/register/verify')
        .send({ email: testEmail, code: otp })
        .expect(201);

      const cookies = (res.headers['set-cookie'] as string[] | string | undefined) ?? [];
      const cookieArr = Array.isArray(cookies) ? cookies : [cookies];
      expect(cookieArr.some((c) => c.startsWith('accessToken='))).toBe(true);
      expect(cookieArr.some((c) => c.startsWith('refreshToken='))).toBe(true);
    });

    it('rejects invalid OTP code', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register/verify')
        .send({ email: testEmail, code: '000000' })
        .expect(401);
    });
  });

  // ── Login ────────────────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('sends OTP to registered email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail })
        .expect(201);

      expect(res.body).toHaveProperty('message');
    });

    it('rejects invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'bad' })
        .expect(400);
    });
  });

  describe('POST /api/auth/login/verify', () => {
    it('verifies login OTP and sets cookies', async () => {
      const otp = testApp.emailService.getLastOtp(testEmail);
      expect(otp).toBeDefined();

      const res = await request(app.getHttpServer())
        .post('/api/auth/login/verify')
        .send({ email: testEmail, code: otp })
        .expect(201);

      const cookies = (res.headers['set-cookie'] as string[] | string | undefined) ?? [];
      const cookieArr = Array.isArray(cookies) ? cookies : [cookies];
      expect(cookieArr.some((c) => c.startsWith('accessToken='))).toBe(true);
    });
  });

  // ── Revoke ───────────────────────────────────────────────────────────────

  describe('POST /api/auth/revoke', () => {
    it('revokes token and clears cookies when authenticated', async () => {
      const seed = await seedTestUser(testApp);

      const res = await request(app.getHttpServer())
        .post('/api/auth/revoke')
        .set('Cookie', seed.authCookie)
        .expect(201);

      expect(res.body.message).toContain('revoked');
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/revoke')
        .expect(401);
    });
  });

  describe('POST /api/auth/revoke-all', () => {
    it('revokes all tokens when authenticated', async () => {
      const seed = await seedTestUser(testApp);

      await request(app.getHttpServer())
        .post('/api/auth/revoke-all')
        .set('Cookie', seed.authCookie)
        .expect(201);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/revoke-all')
        .expect(401);
    });
  });
});
