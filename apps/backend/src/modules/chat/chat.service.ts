import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/chat.dto';
import { db, eq, and } from '@marcx/db';
import { chatMessage, session, document } from '@marcx/db/schema';
import { FileStorageService } from '../../services/file-storage.service';
import { AiProxyService } from '../ai-proxy/ai-proxy.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly fileStorageService: FileStorageService,
    private readonly aiProxyService: AiProxyService,
  ) {}

  async createMessage(
    sessionId: string,
    createMessageDto: CreateMessageDto,
    files: Express.Multer.File[],
    userId: string,
  ) {
    const sessionRecord = await db.query.session.findFirst({
      where: and(eq(session.id, sessionId), eq(session.creatorId, userId)),
    });

    if (!sessionRecord) {
      throw new NotFoundException('Session not found or access denied');
    }

    const [userMessage] = await db
      .insert(chatMessage)
      .values({
        sessionId,
        userId,
        role: 'USER',
        content: createMessageDto.content,
      })
      .returning();

    // Upload files and create Document records directly (File table removed)
    if (files && files.length > 0) {
      const uploadedFiles = await this.fileStorageService.uploadFiles(
        files,
        `session/${sessionId}/raw`,
      );

      await db.insert(document).values(
        uploadedFiles.map((uploadedFile) => ({
          companyId: sessionRecord.companyId,
          sessionId,
          chatId: userMessage.id,
          uploadedBy: userId,
          ...(sessionRecord.ledgerId && { ledgerId: sessionRecord.ledgerId }),
          name: uploadedFile.name,
          url: uploadedFile.url,
          size: uploadedFile.size,
          mimeType: uploadedFile.type,
          uploadSource: 'chat' as const,
          extractionStatus: 'PENDING' as const,
          documentStatus: 'DRAFT' as const,
        })),
      );

      this.logger.log(
        `Uploaded ${uploadedFiles.length} file(s) and created Document records for session ${sessionId}`,
      );
    }

    // Forward to AI-API and get real assistant response
    let aiContent = '';
    let aiMetadata: Record<string, unknown> | undefined;

    try {
      const aiResponse = await this.aiProxyService.sendChatMessage(
        sessionId,
        createMessageDto.content,
        userId,
      ) as Record<string, unknown>;

      aiContent = (aiResponse.content as string)
        || (aiResponse.message as string)
        || 'I received your message and am processing it.';

      // Preserve AI metadata (intent, citations, gl_result, waiting_for_job, etc.)
      const { content, message, ...rest } = aiResponse;
      if (Object.keys(rest).length > 0) {
        aiMetadata = rest;
      }
    } catch (error) {
      this.logger.warn(`AI-API unavailable for session ${sessionId}, using fallback response`, error);
      aiContent = 'I am currently unable to process your request. Please try again shortly.';
    }

    const [aiMessage] = await db
      .insert(chatMessage)
      .values({
        sessionId,
        userId,
        role: 'ASSISTANT',
        content: aiContent,
        metadata: aiMetadata,
      })
      .returning();

    return db.query.chatMessage.findFirst({
      where: eq(chatMessage.id, aiMessage.id),
      with: { documents: true, user: true },
    });
  }

  async getMessages(sessionId: string, userId: string) {
    const sessionRecord = await db.query.session.findFirst({
      where: and(eq(session.id, sessionId), eq(session.creatorId, userId)),
    });

    if (!sessionRecord) {
      throw new NotFoundException('Session not found or access denied');
    }

    return db.query.chatMessage.findMany({
      where: eq(chatMessage.sessionId, sessionId),
      with: { user: true, documents: true },
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
    const message = await db.query.chatMessage.findFirst({
      where: eq(chatMessage.id, chatId),
      with: { session: true },
    });

    if (!message || message.sessionId !== sessionId) {
      throw new NotFoundException('Message not found in this session');
    }

    if (message.session.creatorId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const uploadedFiles = await this.fileStorageService.uploadFiles(
      files,
      `session/${sessionId}/raw`,
    );

    const docRecords = await db
      .insert(document)
      .values(
        uploadedFiles.map((uploadedFile) => ({
          companyId: message.session.companyId,
          sessionId,
          chatId,
          uploadedBy: userId,
          ...(message.session.ledgerId && { ledgerId: message.session.ledgerId }),
          name: uploadedFile.name,
          url: uploadedFile.url,
          size: uploadedFile.size,
          mimeType: uploadedFile.type,
          uploadSource: 'chat' as const,
          extractionStatus: 'PENDING' as const,
          documentStatus: 'DRAFT' as const,
        })),
      )
      .returning();

    this.logger.log(
      `Added ${docRecords.length} attachment(s) and created Document records for session ${sessionId}`,
    );

    return docRecords;
  }
}


