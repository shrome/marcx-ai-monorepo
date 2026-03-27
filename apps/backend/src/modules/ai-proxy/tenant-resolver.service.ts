import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { db, eq } from '@marcx/db';
import { companyMember } from '@marcx/db/schema';

@Injectable()
export class TenantResolverService {
  private readonly logger = new Logger(TenantResolverService.name);

  async resolve(userId: string): Promise<{ tenantId: string; companyId: string }> {
    const membership = await db.query.companyMember.findFirst({
      where: eq(companyMember.userId, userId),
    });

    if (!membership) {
      this.logger.warn(`No company membership found for user ${userId}`);
      throw new NotFoundException(
        'You are not a member of any company. Please contact your administrator.',
      );
    }

    return {
      tenantId: membership.companyId,
      companyId: membership.companyId,
    };
  }
}
