import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db, eq, and, isNull } from '@marcx/db';
import { file, document } from '@marcx/db/schema';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  UpdateExtractionResultDto,
  ListDocumentsQueryDto,
} from './dto/document.dto';
import { FileStorageService, UploadedFileInfo } from '../../services/file-storage.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private readonly fileStorageService: FileStorageService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async create(
    uploadedFile: Express.Multer.File,
    dto: CreateDocumentDto,
    userId: string,
    companyId: string,
  ) {
    // Upload file to S3
    let fileInfo: UploadedFileInfo;
    try {
      fileInfo = await this.fileStorageService.uploadFile(
        uploadedFile,
        `documents/${companyId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to upload file for company ${companyId}`, error);
      throw new BadRequestException('File upload failed. Please try again.');
    }

    // Insert File record
    const [fileRecord] = await db
      .insert(file)
      .values({
        sessionId: dto.sessionId,
        name: fileInfo.name,
        url: fileInfo.url,
        size: fileInfo.size,
        mimeType: fileInfo.type,
      })
      .returning();

    // Insert Document record (PENDING extraction)
    const [docRecord] = await db
      .insert(document)
      .values({
        fileId: fileRecord.id,
        companyId,
        sessionId: dto.sessionId,
        uploadedBy: userId,
        documentType: dto.documentType ?? 'OTHER',
        extractionStatus: 'PENDING',
        documentStatus: 'DRAFT',
      })
      .returning();

    this.logger.log(`Document created: ${docRecord.id} for company ${companyId}`);

    await this.activityLogService.log({
      companyId,
      userId,
      sessionId: dto.sessionId,
      action: 'document.uploaded',
      entityType: 'Document',
      entityId: docRecord.id,
      metadata: { fileName: fileInfo.name, documentType: dto.documentType },
    });

    return this.findOne(docRecord.id, companyId);
  }

  async findAll(companyId: string, query: ListDocumentsQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [
      eq(document.companyId, companyId),
      isNull(document.deletedAt),
    ];

    if (query.sessionId) conditions.push(eq(document.sessionId, query.sessionId));
    if (query.documentType) conditions.push(eq(document.documentType, query.documentType));
    if (query.extractionStatus) conditions.push(eq(document.extractionStatus, query.extractionStatus));
    if (query.documentStatus) conditions.push(eq(document.documentStatus, query.documentStatus));

    const documents = await db.query.document.findMany({
      where: and(...conditions),
      with: { file: true },
      orderBy: (doc, { desc }) => [desc(doc.createdAt)],
      limit,
      offset,
    });

    return { data: documents, page, limit };
  }

  async findOne(id: string, companyId: string) {
    const doc = await db.query.document.findFirst({
      where: and(
        eq(document.id, id),
        eq(document.companyId, companyId),
        isNull(document.deletedAt),
      ),
      with: { file: true, session: true },
    });

    if (!doc) {
      throw new NotFoundException('Document not found.');
    }

    return doc;
  }

  async updateDraft(
    id: string,
    companyId: string,
    dto: UpdateDocumentDto,
  ) {
    await this.findOne(id, companyId);

    await db
      .update(document)
      .set({
        ...(dto.draftData !== undefined && { draftData: dto.draftData }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.documentType !== undefined && { documentType: dto.documentType }),
      })
      .where(and(eq(document.id, id), eq(document.companyId, companyId)));

    return this.findOne(id, companyId);
  }

  async approve(id: string, userId: string, companyId: string) {
    const doc = await this.findOne(id, companyId);

    const approvableStatuses = ['DRAFT', 'UNDER_REVIEW'];
    if (!approvableStatuses.includes(doc.documentStatus)) {
      throw new BadRequestException(
        `Document cannot be approved from status "${doc.documentStatus}". It must be DRAFT or UNDER_REVIEW.`,
      );
    }

    if (!doc.draftData) {
      throw new BadRequestException(
        'Document has no draft data to approve. Complete the extraction review first.',
      );
    }

    await db
      .update(document)
      .set({
        approvedData: doc.draftData,
        documentStatus: 'APPROVED',
        postedBy: userId,
        postedAt: new Date(),
      })
      .where(eq(document.id, id));

    this.logger.log(`Document ${id} approved by user ${userId}`);

    await this.activityLogService.log({
      companyId,
      userId,
      action: 'document.approved',
      entityType: 'Document',
      entityId: id,
    });

    return this.findOne(id, companyId);
  }

  async softDelete(id: string, companyId: string, userId: string) {
    await this.findOne(id, companyId);

    await db
      .update(document)
      .set({ deletedAt: new Date() })
      .where(and(eq(document.id, id), eq(document.companyId, companyId)));

    this.logger.log(`Document ${id} soft-deleted by user ${userId}`);

    await this.activityLogService.log({
      companyId,
      userId,
      action: 'document.deleted',
      entityType: 'Document',
      entityId: id,
    });

    return { message: 'Document deleted successfully.' };
  }

  async updateExtractionResult(
    id: string,
    companyId: string,
    dto: UpdateExtractionResultDto,
  ) {
    await this.findOne(id, companyId);

    await db
      .update(document)
      .set({
        rawData: dto.rawData,
        draftData: dto.rawData,
        extractionStatus: 'COMPLETED',
        extractedBy: dto.extractedBy,
        confidenceScore: dto.confidenceScore?.toFixed(3),
        extractedAt: new Date(),
        documentStatus: 'UNDER_REVIEW',
      })
      .where(eq(document.id, id));

    this.logger.log(`Extraction result saved for document ${id}`);

    return this.findOne(id, companyId);
  }

  async updateExtractionFailed(
    id: string,
    companyId: string,
    errorMessage: string,
  ) {
    await this.findOne(id, companyId);

    await db
      .update(document)
      .set({
        extractionStatus: 'FAILED',
        errorMessage,
      })
      .where(eq(document.id, id));

    this.logger.warn(`Extraction failed for document ${id}: ${errorMessage}`);
  }
}
