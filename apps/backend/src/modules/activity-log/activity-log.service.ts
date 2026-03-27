import { Injectable, Logger } from '@nestjs/common';
import { db, eq, and, gte, lte } from '@marcx/db';
import { activityLog } from '@marcx/db/schema';
import { ListActivityQueryDto } from './dto/activity-log.dto';

interface LogParams {
  companyId: string;
  userId?: string;
  sessionId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  async log(params: LogParams): Promise<void> {
    try {
      await db.insert(activityLog).values({
        companyId: params.companyId,
        userId: params.userId,
        sessionId: params.sessionId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata,
      });
    } catch (error) {
      // Log but don't throw — activity logging should never break the main flow
      this.logger.error(
        `Failed to write activity log: ${params.action} on ${params.entityType}:${params.entityId}`,
        error,
      );
    }
  }

  async list(companyId: string, query: ListActivityQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [eq(activityLog.companyId, companyId)];

    if (query.action) {
      conditions.push(eq(activityLog.action, query.action));
    }
    if (query.entityType) {
      conditions.push(eq(activityLog.entityType, query.entityType));
    }
    if (query.userId) {
      conditions.push(eq(activityLog.userId, query.userId));
    }
    if (query.fromDate) {
      conditions.push(gte(activityLog.createdAt, new Date(query.fromDate)));
    }
    if (query.toDate) {
      conditions.push(lte(activityLog.createdAt, new Date(query.toDate)));
    }

    const entries = await db.query.activityLog.findMany({
      where: and(...conditions),
      orderBy: (log, { desc }) => [desc(log.createdAt)],
      limit,
      offset,
    });

    this.logger.log(`Listed activity log for company ${companyId}: ${entries.length} entries`);

    return { data: entries, page, limit };
  }
}
