import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { EmailService } from '../../src/services/email.service';
import { FileStorageService } from '../../src/services/file-storage.service';
import { MockEmailService } from './mock-email.service';
import { MockFileStorageService } from './mock-file-storage.service';

export interface TestApp {
  app: INestApplication;
  emailService: MockEmailService;
}

export interface SeedResult {
  userId: string;
  companyId: string;
  authCookie: string[];
}

/**
 * Creates a NestJS test app with EmailService mocked.
 * Call once in beforeAll — reuse the same instance across tests in a suite.
 */
export async function createTestApp(): Promise<TestApp> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(EmailService)
    .useClass(MockEmailService)
    .overrideProvider(FileStorageService)
    .useClass(MockFileStorageService)
    .compile();

  const app = module.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  // Provider is registered under the EmailService token, not MockEmailService
  const emailService = module.get<MockEmailService>(EmailService);

  return { app, emailService };
}

/**
 * Registers a user, verifies OTP, creates a company, then re-logs in
 * to obtain a JWT that includes the companyId. Returns auth cookies and IDs.
 */
export async function seedTestUser(testApp: TestApp): Promise<SeedResult> {
  const { app, emailService } = testApp;
  const email = `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  // Register
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, name: 'Test User' })
    .expect(201);

  const registerOtp = emailService.getLastOtp(email);
  if (!registerOtp) throw new Error(`No OTP captured for ${email}`);

  // Verify OTP → get initial JWT (no companyId yet)
  const verifyRes = await request(app.getHttpServer())
    .post('/api/auth/register/verify')
    .send({ email, code: registerOtp })
    .expect(201);

  const initialCookie = (() => {
    const raw = (verifyRes.headers['set-cookie'] as string[] | string | undefined) ?? [];
    return Array.isArray(raw) ? raw : [raw];
  })();

  const userId: string = verifyRes.body?.user?.id ?? '';

  // Create company using initial JWT
  const companyRes = await request(app.getHttpServer())
    .post('/api/company/register')
    .set('Cookie', initialCookie)
    .send({ name: 'Test Company', category: 'ACCOUNTING' })
    .expect(201);

  const companyId: string = companyRes.body?.company?.id ?? '';

  // Re-login to get a JWT that includes the companyId
  await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email })
    .expect(201);

  const loginOtp = emailService.getLastOtp(email);
  if (!loginOtp) throw new Error(`No login OTP captured for ${email}`);

  const loginRes = await request(app.getHttpServer())
    .post('/api/auth/login/verify')
    .send({ email, code: loginOtp })
    .expect(201);

  const rawLoginCookies = (loginRes.headers['set-cookie'] as string[] | string | undefined) ?? [];
  const authCookie: string[] = Array.isArray(rawLoginCookies) ? rawLoginCookies : [rawLoginCookies];

  return { userId, companyId, authCookie };
}
