import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { db, eq, and } from '@marcx/db';
import { invitation, companyMember, company, user } from '@marcx/db/schema';

type MemberRole = 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';
import { randomBytes } from 'crypto';
import { EmailService } from '../../services/email.service';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);
  private readonly TOKEN_EXPIRY_DAYS = 7;

  constructor(private readonly emailService: EmailService) {}

  async create(
    companyId: string,
    email: string,
    role: MemberRole = 'VIEWER',
    invitedByUserId: string,
  ) {
    // Verify inviter has OWNER or ADMIN role
    const inviterMembership = await db.query.companyMember.findFirst({
      where: and(
        eq(companyMember.companyId, companyId),
        eq(companyMember.userId, invitedByUserId),
      ),
    });

    if (!inviterMembership || !['OWNER', 'ADMIN'].includes(inviterMembership.role)) {
      throw new ForbiddenException('Only company owners and admins can send invitations.');
    }

    // Check if user is already a member
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email.toLowerCase()),
      with: { memberships: true },
    });

    if (existingUser) {
      const isMember = existingUser.memberships.some((m) => m.companyId === companyId);
      if (isMember) {
        throw new ConflictException('This user is already a member of the company.');
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await db.query.invitation.findFirst({
      where: and(
        eq(invitation.companyId, companyId),
        eq(invitation.email, email.toLowerCase()),
        eq(invitation.status, 'PENDING'),
      ),
    });

    if (existingInvitation) {
      throw new ConflictException('A pending invitation already exists for this email address.');
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.TOKEN_EXPIRY_DAYS);

    const [newInvitation] = await db
      .insert(invitation)
      .values({
        companyId,
        email: email.toLowerCase(),
        role,
        invitedBy: invitedByUserId,
        token,
        status: 'PENDING',
        expiresAt,
      })
      .returning();

    // Fetch company for the email
    const companyRecord = await db.query.company.findFirst({
      where: eq(company.id, companyId),
    });

    // Send invitation email
    const acceptUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitations/${token}`;
    try {
      await this.emailService.sendEmail({
        to: email,
        subject: `You've been invited to join ${companyRecord?.name ?? 'a company'} on MarcX`,
        html: `
          <p>You've been invited to join <strong>${companyRecord?.name ?? 'a company'}</strong> on MarcX as a <strong>${role}</strong>.</p>
          <p><a href="${acceptUrl}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Accept Invitation</a></p>
          <p>This invitation expires in ${this.TOKEN_EXPIRY_DAYS} days.</p>
          <p>If you don't have an account yet, you'll be prompted to create one.</p>
        `,
      });
      this.logger.log(`Invitation email sent to ${email} for company ${companyId}`);
    } catch (error) {
      this.logger.warn(`Failed to send invitation email to ${email}: ${error}`);
      // Don't fail the request — invitation is created, email is best-effort
    }

    return newInvitation;
  }

  async list(companyId: string) {
    return db.query.invitation.findMany({
      where: and(
        eq(invitation.companyId, companyId),
        eq(invitation.status, 'PENDING'),
      ),
      with: { invitedByUser: true },
      orderBy: (i, { desc }) => [desc(i.createdAt)],
    });
  }

  async getByToken(token: string) {
    const inv = await db.query.invitation.findFirst({
      where: eq(invitation.token, token),
      with: { company: true, invitedByUser: true },
    });

    if (!inv) {
      throw new NotFoundException('Invitation not found.');
    }

    if (inv.status !== 'PENDING') {
      throw new BadRequestException(`This invitation has already been ${inv.status.toLowerCase()}.`);
    }

    if (inv.expiresAt < new Date()) {
      // Mark as expired
      await db.update(invitation).set({ status: 'EXPIRED' }).where(eq(invitation.id, inv.id));
      throw new BadRequestException('This invitation link has expired. Please ask for a new one.');
    }

    return inv;
  }

  async accept(token: string, userId: string) {
    const inv = await this.getByToken(token);

    // Check if this user is already a member
    const existingMembership = await db.query.companyMember.findFirst({
      where: and(
        eq(companyMember.companyId, inv.companyId),
        eq(companyMember.userId, userId),
      ),
    });

    if (existingMembership) {
      throw new ConflictException('You are already a member of this company.');
    }

    // Create membership and mark invitation as accepted
    const [membership] = await db
      .insert(companyMember)
      .values({
        companyId: inv.companyId,
        userId,
        role: inv.role,
      })
      .returning();

    await db
      .update(invitation)
      .set({ status: 'ACCEPTED', acceptedAt: new Date() })
      .where(eq(invitation.id, inv.id));

    this.logger.log(`Invitation accepted: user ${userId} joined company ${inv.companyId} as ${inv.role}`);

    return membership;
  }

  async revoke(invitationId: string, companyId: string, revokedByUserId: string) {
    // Verify revoker has OWNER or ADMIN role
    const revokerMembership = await db.query.companyMember.findFirst({
      where: and(
        eq(companyMember.companyId, companyId),
        eq(companyMember.userId, revokedByUserId),
      ),
    });

    if (!revokerMembership || !['OWNER', 'ADMIN'].includes(revokerMembership.role)) {
      throw new ForbiddenException('Only company owners and admins can revoke invitations.');
    }

    const inv = await db.query.invitation.findFirst({
      where: and(eq(invitation.id, invitationId), eq(invitation.companyId, companyId)),
    });

    if (!inv) {
      throw new NotFoundException('Invitation not found.');
    }

    if (inv.status !== 'PENDING') {
      throw new BadRequestException(`Cannot revoke an invitation with status: ${inv.status}.`);
    }

    const [updated] = await db
      .update(invitation)
      .set({ status: 'REVOKED' })
      .where(eq(invitation.id, invitationId))
      .returning();

    this.logger.log(`Invitation ${invitationId} revoked by user ${revokedByUserId}`);

    return updated;
  }
}
