import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';

export interface SeedResult {
  userId: string;
  companyId: string;
  accessToken: string;
  authCookie: string[];
}

/**
 * Bootstraps the app with the same middleware as main.ts.
 * Call this in beforeAll, not beforeEach (too slow).
 */
export async function bootstrapApp(app: INestApplication): Promise<void> {
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
}

/**
 * Seeds a test user + company and returns JWT tokens.
 * OTP is mocked to '000000' in test env via the email service stub.
 */
export async function seedTestUser(app: INestApplication): Promise<SeedResult> {
  const email = `test-${Date.now()}@example.com`;
  const name = 'Test User';

  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, name })
    .expect(201);

  const verifyRes = await request(app.getHttpServer())
    .post('/api/auth/register/verify')
    .send({ email, code: '000000' })
    .expect(201);

  const rawCookies = (verifyRes.headers['set-cookie'] as string[] | string | undefined) ?? [];
  const authCookie: string[] = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
  const accessToken = verifyRes.body?.accessToken ?? '';

  const companyRes = await request(app.getHttpServer())
    .post('/api/company/register')
    .set('Cookie', authCookie)
    .send({ name: 'Test Company', category: 'ACCOUNTING' })
    .expect(201);

  return {
    userId: verifyRes.body?.user?.id ?? '',
    companyId: companyRes.body?.id ?? '',
    accessToken,
    authCookie,
  };
}
