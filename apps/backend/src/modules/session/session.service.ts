import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSessionDto, UpdateSessionDto, CreateChatSessionDto } from './dto/session.dto';

import { db, eq, and } from '@marcx/db';
import { session, user } from '@marcx/db/schema';

@Injectable()
export class SessionService {
  async createChatSession(data: CreateChatSessionDto, userId: string) {
    // Get user with membership information
    const foundUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
      with: {
        memberships: true,
      },
    });

    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    const membership = foundUser.memberships?.[0];
    if (!membership) {
      throw new NotFoundException('User does not have an associated company');
    }

    // Create chat session
    const sessionTitle = data.title?.trim() || 'New Chat';

    const [newSession] = await db
      .insert(session)
      .values({
        companyId: membership.companyId,
        creatorId: userId,
        title: sessionTitle,
        status: 'open',
        fiscalYear: data.fiscalYear,
      })
      .returning();

    return newSession;
  }

  async create(createSessionDto: CreateSessionDto, userId: string) {
    // Resolve companyId from user membership if not provided
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
        fiscalYear: createSessionDto.fiscalYear,
        status: 'open',
      })
      .returning();

    return newSession;
  }

  async findAll(userId: string) {
    return db.query.session.findMany({
      where: eq(session.creatorId, userId),
      with: { creator: true },
    });
  }

  async findOne(id: string, userId: string) {
    const sessionRecord = await db.query.session.findFirst({
      where: and(eq(session.id, id), eq(session.creatorId, userId)),
      with: { creator: true, chatMessages: true, files: true },
    });

    if (!sessionRecord) {
      throw new NotFoundException('Session not found');
    }

    return sessionRecord;
  }

  async update(id: string, updateSessionDto: UpdateSessionDto, userId: string) {
    // Verify access
    await this.findOne(id, userId);

    // Update session
    await db.update(session).set(updateSessionDto).where(eq(session.id, id));

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    // Verify access
    await this.findOne(id, userId);

    // Delete session (cascading deletes will handle related records)
    await db.delete(session).where(eq(session.id, id));

    return { message: 'Session deleted successfully' };
  }
}
