import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCaseDto, UpdateCaseDto } from './dto/case.dto';
import { db } from '../../db';
import { eq, and } from '@marcx/db';
import { session, caseInfo, file } from '@marcx/db/schema';
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
        type: 'CASE',
        companyId: createCaseDto.companyId,
        creatorId: userId,
        title: createCaseDto.title,
        description: createCaseDto.description,
        status: 'open',
        priority: createCaseDto.priority || 'medium',
      })
      .returning();

    // Create case info
    await db.insert(caseInfo).values({
      sessionId: newSession.id,
      clientName: createCaseDto.clientName,
    });

    // Upload and save file attachments if provided
    if (files && files.length > 0) {
      const uploadedFiles = await this.fileStorageService.uploadFiles(files);

      await db.insert(file).values(
        uploadedFiles.map((uploadedFile) => ({
          sessionId: newSession.id,
          chatId: null,
          name: uploadedFile.name,
          url: uploadedFile.url,
          size: uploadedFile.size,
          type: uploadedFile.type,
        })),
      );
    }

    // Return with case info and files
    return db.query.session.findFirst({
      where: eq(session.id, newSession.id),
      with: { caseInfo: true, creator: true, files: true },
    });
  }

  async findAll(userId: string) {
    return db.query.session.findMany({
      where: and(eq(session.type, 'CASE'), eq(session.creatorId, userId)),
      with: { caseInfo: true, creator: true },
    });
  }

  async findOne(id: string, userId: string) {
    const caseRecord = await db.query.session.findFirst({
      where: and(
        eq(session.id, id),
        eq(session.type, 'CASE'),
        eq(session.creatorId, userId),
      ),
      with: { caseInfo: true, creator: true, files: true },
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
      updateCaseDto.status ||
      updateCaseDto.priority
    ) {
      await db
        .update(session)
        .set({
          ...(updateCaseDto.title && { title: updateCaseDto.title }),
          ...(updateCaseDto.description && {
            description: updateCaseDto.description,
          }),
          ...(updateCaseDto.status && { status: updateCaseDto.status }),
          ...(updateCaseDto.priority && { priority: updateCaseDto.priority }),
          updatedAt: new Date(),
        })
        .where(eq(session.id, id));
    }

    // Update case info if clientName is provided
    if (updateCaseDto.clientName && caseRecord.caseInfo) {
      await db
        .update(caseInfo)
        .set({
          clientName: updateCaseDto.clientName,
          updatedAt: new Date(),
        })
        .where(eq(caseInfo.sessionId, id));
    }

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    // Verify access
    await this.findOne(id, userId);

    // Delete case info first (foreign key constraint)
    await db.delete(caseInfo).where(eq(caseInfo.sessionId, id));

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
    const uploadedFiles = await this.fileStorageService.uploadFiles(files);

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
          type: uploadedFile.type,
        })),
      )
      .returning();

    return newFiles;
  }
}
