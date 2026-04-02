import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCaseDto, UpdateCaseDto } from './dto/case.dto';
import { db, eq, and } from '@marcx/db';
import { session, document } from '@marcx/db/schema';
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

      await db.insert(document).values(
        uploadedFiles.map((uploadedFile) => ({
          companyId: newSession.companyId,
          sessionId: newSession.id,
          uploadedBy: userId,
          name: uploadedFile.name,
          url: uploadedFile.url,
          size: uploadedFile.size,
          mimeType: uploadedFile.type,
          uploadSource: 'upload' as const,
          extractionStatus: 'PENDING' as const,
          documentStatus: 'DRAFT' as const,
        })),
      );
    }

    return db.query.session.findFirst({
      where: eq(session.id, newSession.id),
      with: { creator: true },
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
      with: { creator: true },
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

    // Save as Document records (File table removed)
    const newDocs = await db
      .insert(document)
      .values(
        uploadedFiles.map((uploadedFile) => ({
          companyId: caseRecord.companyId,
          sessionId,
          uploadedBy: userId,
          name: uploadedFile.name,
          url: uploadedFile.url,
          size: uploadedFile.size,
          mimeType: uploadedFile.type,
          uploadSource: 'upload' as const,
          extractionStatus: 'PENDING' as const,
          documentStatus: 'DRAFT' as const,
        })),
      )
      .returning();

    return newDocs;
  }
}
