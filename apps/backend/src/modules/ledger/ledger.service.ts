import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { db, eq, and, isNull } from '@marcx/db';
import { ledger, companyMember } from '@marcx/db/schema';
import { CreateLedgerDto } from './dto/create-ledger.dto';
import { UpdateLedgerDto } from './dto/update-ledger.dto';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  private async resolveCompanyId(userId: string): Promise<string> {
    const membership = await db.query.companyMember.findFirst({
      where: eq(companyMember.userId, userId),
    });
    if (!membership) {
      throw new NotFoundException('User does not have an associated company.');
    }
    return membership.companyId;
  }

  async create(dto: CreateLedgerDto, userId: string) {
    const companyId = await this.resolveCompanyId(userId);

    const existing = await db.query.ledger.findFirst({
      where: and(
        eq(ledger.companyId, companyId),
        eq(ledger.fiscalYear, dto.fiscalYear),
        isNull(ledger.deletedAt),
      ),
    });

    if (existing) {
      throw new ConflictException(
        `A ledger for fiscal year ${dto.fiscalYear} already exists for this company.`,
      );
    }

    const [newLedger] = await db
      .insert(ledger)
      .values({
        companyId,
        creatorId: userId,
        name: dto.name,
        fiscalYear: dto.fiscalYear,
        description: dto.description,
        status: 'ACTIVE',
      })
      .returning();

    this.logger.log(`Ledger created: ${newLedger.id} (FY ${dto.fiscalYear}) for company ${companyId}`);

    return newLedger;
  }

  async findAll(userId: string) {
    const companyId = await this.resolveCompanyId(userId);

    return db.query.ledger.findMany({
      where: and(eq(ledger.companyId, companyId), isNull(ledger.deletedAt)),
      with: { sessions: true, documents: true },
      orderBy: (l, { desc }) => [desc(l.fiscalYear)],
    });
  }

  async findOne(id: string, userId: string) {
    const companyId = await this.resolveCompanyId(userId);

    const result = await db.query.ledger.findFirst({
      where: and(
        eq(ledger.id, id),
        eq(ledger.companyId, companyId),
        isNull(ledger.deletedAt),
      ),
      with: { sessions: true, documents: true, creator: true },
    });

    if (!result) {
      throw new NotFoundException('Ledger not found.');
    }

    return result;
  }

  async update(id: string, dto: UpdateLedgerDto, userId: string) {
    await this.findOne(id, userId);

    await db
      .update(ledger)
      .set({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        updatedAt: new Date(),
      })
      .where(eq(ledger.id, id));

    this.logger.log(`Ledger ${id} updated by user ${userId}`);

    return this.findOne(id, userId);
  }

  async softDelete(id: string, userId: string) {
    await this.findOne(id, userId);

    await db
      .update(ledger)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(ledger.id, id));

    this.logger.log(`Ledger ${id} soft-deleted by user ${userId}`);

    return { message: 'Ledger deleted successfully.' };
  }
}
