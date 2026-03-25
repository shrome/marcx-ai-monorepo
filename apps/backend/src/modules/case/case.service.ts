import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCaseDto, UpdateCaseDto } from './dto/case.dto';
import { db, eq, and } from '@marcx/db';
import { session, file } from '@marcx/db/schema';
import { FileStorageService } from '../../services/file-storage.service';

@Injectable()
export class CaseService {
  constructor(private readonly fileStorageService: FileStorageService) {}

  async create(
    createCaseDto: CreateCaseDto,
    files: Express.Multer.File[],
    userId: string,
  ) {
    // Create session for the case
    const [newSession] = await db
      .insert(session)
      .values({
        companyId: createCaseDto.companyId,
        creatorId: userId,
        title: createCaseDto.title,
        description: createCaseDto.description,
        status: 'open',
      })
      .returning();

    // Upload and save file attachments if provided
    if (files && files.length > 0) {
      const uploadedFiles = await this.fileStorageService.uploadFiles(
        files,
        `session/${newSession.id}/raw`,
      );

      await db.insert(file).values(
        uploadedFiles.map((uploadedFile) => ({
          sessionId: newSession.id,
          chatId: null,
          name: uploadedFile.name,
          url: uploadedFile.url,
          size: uploadedFile.size,
          mimeType: uploadedFile.type,
        })),
      );
    }

    return db.query.session.findFirst({
      where: eq(session.id, newSession.id),
      with: { creator: true, files: true },
    });
  }

  async findAll(userId: string) {
    return db.query.session.findMany({
      where: eq(session.creatorId, userId),
      with: { creator: true },
    });
  }

  async findOne(id: string, userId: string) {
    const caseRecord = await db.query.session.findFirst({
      where: and(
        eq(session.id, id),
        eq(session.creatorId, userId),
      ),
      with: { creator: true, files: true },
    });

    if (!caseRecord) {
      throw new NotFoundException('Case not found');
    }

    return caseRecord;
  }

  async update(id: string, updateCaseDto: UpdateCaseDto, userId: string) {
    // Verify access
    const caseRecord = await this.findOne(id, userId);

    // Update session fields
    if (
      updateCaseDto.title ||
      updateCaseDto.description ||
      updateCaseDto.status
    ) {
      await db
        .update(session)
        .set({
          ...(updateCaseDto.title && { title: updateCaseDto.title }),
          ...(updateCaseDto.description && {
            description: updateCaseDto.description,
          }),
          ...(updateCaseDto.status && { status: updateCaseDto.status }),
          updatedAt: new Date(),
        })
        .where(eq(session.id, id));
    }

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    // Verify access
    await this.findOne(id, userId);

    // Delete session
    await db.delete(session).where(eq(session.id, id));

    return { message: 'Case deleted successfully' };
  }

  async addAttachments(
    sessionId: string,
    files: Express.Multer.File[],
    userId: string,
  ) {
    // Verify session exists and user has access
    const caseRecord = await this.findOne(sessionId, userId);

    if (!caseRecord) {
      throw new NotFoundException('Case not found or access denied');
    }

    // Upload files to storage
    const uploadedFiles = await this.fileStorageService.uploadFiles(
      files,
      `session/${sessionId}/raw`,
    );

    // Save file records to database
    const newFiles = await db
      .insert(file)
      .values(
        uploadedFiles.map((uploadedFile) => ({
          sessionId,
          chatId: null,
          name: uploadedFile.name,
          url: uploadedFile.url,
          size: uploadedFile.size,
          mimeType: uploadedFile.type,
        })),
      )
      .returning();

    return newFiles;
  }
}
