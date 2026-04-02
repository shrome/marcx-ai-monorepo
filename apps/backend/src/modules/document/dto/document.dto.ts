import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentType {
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  BANK_STATEMENT = 'BANK_STATEMENT',
  CONTRACT = 'CONTRACT',
  OTHER = 'OTHER',
}

export enum ExtractionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  POSTED = 'POSTED',
  VOID = 'VOID',
}

export class CreateDocumentDto {
  @ApiProperty({ format: 'uuid', description: 'Session this document belongs to' })
  @IsUUID()
  sessionId: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Ledger this document belongs to' })
  @IsOptional()
  @IsUUID()
  ledgerId?: string;

  @ApiPropertyOptional({ enum: DocumentType, example: DocumentType.INVOICE })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional({ description: 'Structured draft data extracted from document' })
  @IsOptional()
  @IsObject()
  draftData?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'Missing GST field' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: DocumentType })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;
}

export class UpdateExtractionResultDto {
  @ApiProperty({ description: 'Raw AI extraction output' })
  @IsObject()
  rawData: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'gpt-4o' })
  @IsOptional()
  @IsString()
  extractedBy?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 1, example: 0.95 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore?: number;
}

export class ListDocumentsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by ledger' })
  @IsOptional()
  @IsUUID()
  ledgerId?: string;

  @ApiPropertyOptional({ enum: DocumentType })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @ApiPropertyOptional({ enum: ExtractionStatus })
  @IsOptional()
  @IsEnum(ExtractionStatus)
  extractionStatus?: ExtractionStatus;

  @ApiPropertyOptional({ enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  documentStatus?: DocumentStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
