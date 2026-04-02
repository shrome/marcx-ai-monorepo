import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLedgerDto {
  @ApiProperty({ example: 'FY 2024 General Ledger' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 2024, description: 'The fiscal year this ledger covers' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  fiscalYear: number;

  @ApiPropertyOptional({ example: 'Main accounting ledger for fiscal year 2024' })
  @IsOptional()
  @IsString()
  description?: string;
}
