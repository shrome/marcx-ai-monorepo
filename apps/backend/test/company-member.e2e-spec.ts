import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, seedTestUser, TestApp, SeedResult } from './helpers/test-app';

describe('CompanyMemberController (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let seed: SeedResult;
  let memberId: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    seed = await seedTestUser(testApp);
  });

  afterAll(() => app.close());

  describe('GET /api/companies/:companyId/members', () => {
    it('lists members for a company', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/companies/${seed.companyId}/members`)
        .set('Cookie', seed.authCookie)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get(`/api/companies/${seed.companyId}/members`)
        .expect(401);
    });
  });

  describe('POST /api/companies/:companyId/members', () => {
    it('invites a new member by email', async () => {
      const inviteEmail = `invite-${Date.now()}@example.com`;

      // Register so the user exists in the system
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: inviteEmail, name: 'Invited User' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(`/api/companies/${seed.companyId}/members`)
        .set('Cookie', seed.authCookie)
        .send({ email: inviteEmail, role: 'VIEWER' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      memberId = res.body.id;
    });

    it('rejects invalid role', async () => {
      await request(app.getHttpServer())
        .post(`/api/companies/${seed.companyId}/members`)
        .set('Cookie', seed.authCookie)
        .send({ email: 'x@x.com', role: 'INVALID' })
        .expect(400);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .post(`/api/companies/${seed.companyId}/members`)
        .send({ email: 'x@x.com', role: 'VIEWER' })
        .expect(401);
    });
  });

  describe('PATCH /api/companies/:companyId/members/:memberId', () => {
    it('updates member role', async () => {
      if (!memberId) return;

      const res = await request(app.getHttpServer())
        .patch(`/api/companies/${seed.companyId}/members/${memberId}`)
        .set('Cookie', seed.authCookie)
        .send({ role: 'ACCOUNTANT' })
        .expect(200);

      expect(res.body.role).toBe('ACCOUNTANT');
    });
  });

  describe('DELETE /api/companies/:companyId/members/:memberId', () => {
    it('removes a member', async () => {
      if (!memberId) return;

      await request(app.getHttpServer())
        .delete(`/api/companies/${seed.companyId}/members/${memberId}`)
        .set('Cookie', seed.authCookie)
        .expect(200);
    });

    it('cannot remove the last OWNER', async () => {
      const listRes = await request(app.getHttpServer())
        .get(`/api/companies/${seed.companyId}/members`)
        .set('Cookie', seed.authCookie)
        .expect(200);

      const ownerMember = listRes.body.find(
        (m: any) => m.userId === seed.userId && m.role === 'OWNER',
      );

      if (ownerMember) {
        await request(app.getHttpServer())
          .delete(`/api/companies/${seed.companyId}/members/${ownerMember.id}`)
          .set('Cookie', seed.authCookie)
          .expect(400);
      }
    });
  });
});
