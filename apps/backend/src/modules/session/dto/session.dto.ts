import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChatSessionDto {
  @ApiPropertyOptional({ example: 'Q1 2024 Review' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Ledger this session belongs to' })
  @IsOptional()
  @IsUUID()
  ledgerId?: string;
}

export class CreateSessionDto {
  @ApiProperty({ example: 'Invoice Processing — Jan 2024' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Monthly invoice batch' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Ledger this session belongs to' })
  @IsOptional()
  @IsUUID()
  ledgerId?: string;
}

export class UpdateSessionDto {
  @ApiPropertyOptional({ example: 'Updated title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'COMPLETED' })
  @IsOptional()
  status?: string;
}
