import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/chat.dto';
import { db, eq, and } from '@marcx/db';
import { chatMessage, session, file } from '@marcx/db/schema';
import { FileStorageService } from '../../services/file-storage.service';

@Injectable()
export class ChatService {
  constructor(private readonly fileStorageService: FileStorageService) {}

  async createMessage(
    createMessageDto: CreateMessageDto,
    files: Express.Multer.File[],
    userId: string,
  ) {
    // Verify session exists and user has access
    const sessionRecord = await db.query.session.findFirst({
      where: and(
        eq(session.id, createMessageDto.sessionId),
        eq(session.creatorId, userId),
      ),
    });

    if (!sessionRecord) {
      throw new NotFoundException('Session not found or access denied');
    }

    // Create message
    const [newMessage] = await db
      .insert(chatMessage)
      .values({
        sessionId: createMessageDto.sessionId,
        userId,
        role: createMessageDto.role,
        content: createMessageDto.content,
      })
      .returning();

    // Upload and save file attachments if provided
    if (files && files.length > 0) {
      const uploadedFiles = await this.fileStorageService.uploadFiles(files);

      await db.insert(file).values(
        uploadedFiles.map((uploadedFile) => ({
          sessionId: createMessageDto.sessionId,
          chatId: newMessage.id,
          name: uploadedFile.name,
          url: uploadedFile.url,
          size: uploadedFile.size,
          type: uploadedFile.type,
        })),
      );
    }

    // Return message with files
    return db.query.chatMessage.findFirst({
      where: eq(chatMessage.id, newMessage.id),
      with: { files: true, user: true },
    });
  }

  async getMessages(sessionId: string, userId: string) {
    // Verify session access
    const sessionRecord = await db.query.session.findFirst({
      where: and(eq(session.id, sessionId), eq(session.creatorId, userId)),
    });

    if (!sessionRecord) {
      throw new NotFoundException('Session not found or access denied');
    }

    return db.query.chatMessage.findMany({
      where: eq(chatMessage.sessionId, sessionId),
      with: { user: true, files: true },
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });
  }

  async deleteMessage(id: string, userId: string) {
    const message = await db.query.chatMessage.findFirst({
      where: eq(chatMessage.id, id),
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await db.delete(chatMessage).where(eq(chatMessage.id, id));
    return { message: 'Message deleted successfully' };
  }

  async addAttachments(
    sessionId: string,
    chatId: string,
    files: Express.Multer.File[],
    userId: string,
  ) {
    // Verify session and message access
    const message = await db.query.chatMessage.findFirst({
      where: eq(chatMessage.id, chatId),
      with: {
        session: true,
      },
    });

    if (!message || message.sessionId !== sessionId) {
      throw new NotFoundException('Message not found in this session');
    }

    if (message.session.creatorId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Upload files to storage
    const uploadedFiles = await this.fileStorageService.uploadFiles(files);

    // Save file records to database
    const newFiles = await db
      .insert(file)
      .values(
        uploadedFiles.map((uploadedFile) => ({
          sessionId,
          chatId,
          name: uploadedFile.name,
          url: uploadedFile.url,
          size: uploadedFile.size,
          type: uploadedFile.type,
        })),
      )
      .returning();

    return newFiles;
  }
}
