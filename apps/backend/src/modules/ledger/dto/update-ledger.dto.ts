import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

enum LedgerStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export class UpdateLedgerDto {
  @ApiPropertyOptional({ example: 'FY 2024 General Ledger (Updated)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: LedgerStatus, example: LedgerStatus.CLOSED })
  @IsOptional()
  @IsEnum(LedgerStatus)
  status?: LedgerStatus;
}
