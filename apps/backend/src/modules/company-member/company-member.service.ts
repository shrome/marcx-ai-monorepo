import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { db, eq, and } from '@marcx/db';
import { companyMember, user } from '@marcx/db/schema';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/company-member.dto';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class CompanyMemberService {
  private readonly logger = new Logger(CompanyMemberService.name);

  constructor(private readonly activityLogService: ActivityLogService) {}

  async listMembers(companyId: string) {
    return db.query.companyMember.findMany({
      where: eq(companyMember.companyId, companyId),
      with: { user: true },
    });
  }

  async inviteMember(
    companyId: string,
    dto: InviteMemberDto,
    invitedByUserId: string,
  ) {
    const invitedUser = await db.query.user.findFirst({
      where: eq(user.email, dto.email),
    });

    if (!invitedUser) {
      throw new NotFoundException(
        `No account found with email ${dto.email}. The user must register before being invited.`,
      );
    }

    const existing = await db.query.companyMember.findFirst({
      where: and(
        eq(companyMember.userId, invitedUser.id),
        eq(companyMember.companyId, companyId),
      ),
    });

    if (existing) {
      throw new ConflictException(
        `${dto.email} is already a member of this company.`,
      );
    }

    const [newMember] = await db
      .insert(companyMember)
      .values({
        userId: invitedUser.id,
        companyId,
        role: dto.role,
      })
      .returning();

    this.logger.log(`Invited ${dto.email} to company ${companyId} as ${dto.role}`);

    await this.activityLogService.log({
      companyId,
      userId: invitedByUserId,
      action: 'member.invited',
      entityType: 'CompanyMember',
      entityId: newMember.id,
      metadata: { email: dto.email, role: dto.role },
    });

    return db.query.companyMember.findFirst({
      where: eq(companyMember.id, newMember.id),
      with: { user: true },
    });
  }

  async updateRole(
    companyId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
    updatedByUserId: string,
  ) {
    const member = await db.query.companyMember.findFirst({
      where: and(
        eq(companyMember.id, memberId),
        eq(companyMember.companyId, companyId),
      ),
    });

    if (!member) {
      throw new NotFoundException('Member not found in this company.');
    }

    if (member.userId === updatedByUserId) {
      throw new BadRequestException('You cannot change your own role.');
    }

    // Guard: cannot remove the last OWNER
    if (member.role === 'OWNER' && dto.role !== 'OWNER') {
      const ownerCount = await db.query.companyMember.findMany({
        where: and(
          eq(companyMember.companyId, companyId),
          eq(companyMember.role, 'OWNER'),
        ),
      });
      if (ownerCount.length <= 1) {
        throw new BadRequestException(
          'Cannot change the role of the last owner. Assign another owner first.',
        );
      }
    }

    await db
      .update(companyMember)
      .set({ role: dto.role })
      .where(eq(companyMember.id, memberId));

    this.logger.log(`Updated member ${memberId} role to ${dto.role} in company ${companyId}`);

    return db.query.companyMember.findFirst({
      where: eq(companyMember.id, memberId),
      with: { user: true },
    });
  }

  async removeMember(
    companyId: string,
    memberId: string,
    removedByUserId: string,
  ) {
    const member = await db.query.companyMember.findFirst({
      where: and(
        eq(companyMember.id, memberId),
        eq(companyMember.companyId, companyId),
      ),
    });

    if (!member) {
      throw new NotFoundException('Member not found in this company.');
    }

    if (member.userId === removedByUserId) {
      throw new BadRequestException('You cannot remove yourself from the company.');
    }

    if (member.role === 'OWNER') {
      const ownerCount = await db.query.companyMember.findMany({
        where: and(
          eq(companyMember.companyId, companyId),
          eq(companyMember.role, 'OWNER'),
        ),
      });
      if (ownerCount.length <= 1) {
        throw new BadRequestException(
          'Cannot remove the last owner of the company.',
        );
      }
    }

    await db.delete(companyMember).where(eq(companyMember.id, memberId));

    this.logger.log(`Removed member ${memberId} from company ${companyId}`);

    await this.activityLogService.log({
      companyId,
      userId: removedByUserId,
      action: 'member.removed',
      entityType: 'CompanyMember',
      entityId: memberId,
      metadata: { removedUserId: member.userId },
    });

    return { message: 'Member removed successfully.' };
  }
}
