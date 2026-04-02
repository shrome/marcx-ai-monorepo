import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSessionDto, UpdateSessionDto, CreateChatSessionDto } from './dto/session.dto';
import { db, eq, and } from '@marcx/db';
import { session, user, companyMember } from '@marcx/db/schema';

@Injectable()
export class SessionService {
  async createChatSession(data: CreateChatSessionDto, userId: string) {
    const foundUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
      with: { memberships: true },
    });

    if (!foundUser) throw new NotFoundException('User not found');

    const membership = foundUser.memberships?.[0];
    if (!membership) throw new NotFoundException('User does not have an associated company');

    const [newSession] = await db
      .insert(session)
      .values({
        companyId: membership.companyId,
        creatorId: userId,
        title: data.title?.trim() || 'New Chat',
        status: 'open',
        ...(data.ledgerId && { ledgerId: data.ledgerId }),
      })
      .returning();

    return newSession;
  }

  async create(createSessionDto: CreateSessionDto, userId: string) {
    let companyId = createSessionDto.companyId;

    if (!companyId) {
      const foundUser = await db.query.user.findFirst({
        where: eq(user.id, userId),
        with: { memberships: true },
      });

      const membership = foundUser?.memberships?.[0];
      if (!membership) throw new NotFoundException('User has no associated company');
      companyId = membership.companyId;
    }

    const [newSession] = await db
      .insert(session)
      .values({
        companyId,
        creatorId: userId,
        title: createSessionDto.title,
        description: createSessionDto.description,
        status: 'open',
        ...(createSessionDto.ledgerId && { ledgerId: createSessionDto.ledgerId }),
      })
      .returning();

    return newSession;
  }

  async findAll(userId: string, ledgerId?: string) {
    const membership = await db.query.companyMember.findFirst({
      where: eq(companyMember.userId, userId),
    });

    if (!membership) throw new NotFoundException('User does not have an associated company');

    const conditions = ledgerId
      ? and(eq(session.companyId, membership.companyId), eq(session.ledgerId, ledgerId))
      : eq(session.companyId, membership.companyId);

    return db.query.session.findMany({
      where: conditions,
      with: { creator: true, ledger: true },
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });
  }

  async findOne(id: string, userId: string) {
    const membership = await db.query.companyMember.findFirst({
      where: eq(companyMember.userId, userId),
    });

    if (!membership) throw new NotFoundException('User does not have an associated company');

    const sessionRecord = await db.query.session.findFirst({
      where: and(eq(session.id, id), eq(session.companyId, membership.companyId)),
      with: { creator: true, chatMessages: true, documents: true, ledger: true },
    });

    if (!sessionRecord) throw new NotFoundException('Session not found');

    return sessionRecord;
  }

  async update(id: string, updateSessionDto: UpdateSessionDto, userId: string) {
    await this.findOne(id, userId);
    await db.update(session).set(updateSessionDto).where(eq(session.id, id));
    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await db.delete(session).where(eq(session.id, id));
    return { message: 'Session deleted successfully' };
  }
}
