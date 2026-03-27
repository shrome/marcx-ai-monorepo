import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db, eq, and, gte, lte } from '@marcx/db';
import { companyCredit, creditTransaction } from '@marcx/db/schema';
import { TopUpCreditDto, ListTransactionsQueryDto } from './dto/billing.dto';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly activityLogService: ActivityLogService) {}

  async getBalance(companyId: string) {
    let credit = await db.query.companyCredit.findFirst({
      where: eq(companyCredit.companyId, companyId),
    });

    if (!credit) {
      // Auto-create wallet on first access
      const [created] = await db
        .insert(companyCredit)
        .values({ companyId, balance: '0', currency: 'USD' })
        .returning();
      credit = created;
      this.logger.log(`Created credit wallet for company ${companyId}`);
    }

    return credit;
  }

  async topUp(companyId: string, dto: TopUpCreditDto, userId: string) {
    const credit = await this.getBalance(companyId);

    const newBalance = (parseFloat(credit.balance) + dto.amount).toFixed(4);

    await db.transaction(async (tx) => {
      await tx.insert(creditTransaction).values({
        companyCreditId: credit.id,
        type: 'TOP_UP',
        amount: dto.amount.toFixed(4),
        balanceAfter: newBalance,
        description: 'Credit top-up',
        reference: dto.reference,
        metadata: dto.metadata,
        createdBy: userId,
      });

      await tx
        .update(companyCredit)
        .set({ balance: newBalance })
        .where(eq(companyCredit.id, credit.id));
    });

    this.logger.log(`Credit top-up for company ${companyId}: +${dto.amount}`);

    await this.activityLogService.log({
      companyId,
      userId,
      action: 'credit.topped_up',
      entityType: 'CompanyCredit',
      entityId: credit.id,
      metadata: { amount: dto.amount, reference: dto.reference },
    });

    return this.getBalance(companyId);
  }

  async recordUsage(
    companyId: string,
    amount: number,
    description: string,
    metadata?: Record<string, unknown>,
    userId?: string,
  ) {
    const credit = await this.getBalance(companyId);
    const currentBalance = parseFloat(credit.balance);

    if (currentBalance < amount) {
      throw new BadRequestException(
        `Insufficient credit balance. Available: ${currentBalance}, Required: ${amount}`,
      );
    }

    const newBalance = (currentBalance - amount).toFixed(4);

    await db.transaction(async (tx) => {
      await tx.insert(creditTransaction).values({
        companyCreditId: credit.id,
        type: 'USAGE',
        amount: (-amount).toFixed(4),
        balanceAfter: newBalance,
        description,
        metadata,
        createdBy: userId,
      });

      await tx
        .update(companyCredit)
        .set({ balance: newBalance })
        .where(eq(companyCredit.id, credit.id));
    });

    this.logger.log(`Credit usage for company ${companyId}: -${amount} (${description})`);

    await this.activityLogService.log({
      companyId,
      userId,
      action: 'credit.used',
      entityType: 'CompanyCredit',
      entityId: credit.id,
      metadata: { amount, description },
    });
  }

  async listTransactions(companyId: string, query: ListTransactionsQueryDto) {
    const credit = await this.getBalance(companyId);

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [eq(creditTransaction.companyCreditId, credit.id)];

    if (query.type) {
      conditions.push(eq(creditTransaction.type, query.type as 'TOP_UP' | 'USAGE' | 'REFUND' | 'ADJUSTMENT'));
    }
    if (query.fromDate) {
      conditions.push(gte(creditTransaction.createdAt, new Date(query.fromDate)));
    }
    if (query.toDate) {
      conditions.push(lte(creditTransaction.createdAt, new Date(query.toDate)));
    }

    const transactions = await db.query.creditTransaction.findMany({
      where: and(...conditions),
      orderBy: (tx, { desc }) => [desc(tx.createdAt)],
      limit,
      offset,
    });

    return { data: transactions, page, limit };
  }
}
