import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';

import { db, eq, and } from '@marcx/db';
import { session, user } from '@marcx/db/schema';

@Injectable()
export class SessionService {
  async createChatSession(data: { title?: string } = {}, userId: string) {
    // Get user with company information
    const foundUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
      with: {
        company: true,
      },
    });

    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    if (!foundUser.companyId) {
      throw new NotFoundException('User does not have an associated company');
    }

    // Create chat session
    const sessionTitle = data.title?.trim() || 'New Chat';

    const [newSession] = await db
      .insert(session)
      .values({
        type: 'CHAT',
        companyId: foundUser.companyId,
        creatorId: userId,
        title: sessionTitle,
        status: 'open',
        priority: 'medium',
      })
      .returning();

    return newSession;
  }

  async create(createSessionDto: CreateSessionDto, userId: string) {
    const [newSession] = await db
      .insert(session)
      .values({
        type: createSessionDto.type,
        companyId: createSessionDto.companyId || crypto.randomUUID(),
        creatorId: userId,
        title: createSessionDto.title,
        description: createSessionDto.description,
        status: 'open',
        priority: createSessionDto.priority || 'medium',
      })
      .returning();

    return newSession;
  }

  async findAll(userId: string, type?: 'CHAT' | 'CASE') {
    const conditions = [eq(session.creatorId, userId)];

    if (type) {
      conditions.push(eq(session.type, type));
    }

    return db.query.session.findMany({
      where: and(...conditions),
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
