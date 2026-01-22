import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';
import { db } from '../../db';
import { eq, and } from '@marcx/db';
import { session } from '@marcx/db/schema';

@Injectable()
export class SessionService {
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
