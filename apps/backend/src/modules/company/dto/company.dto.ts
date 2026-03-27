import { IsString, IsOptional, IsEnum, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Acme Corp', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: ['ACCOUNTING', 'MARKETING'], example: 'ACCOUNTING' })
  @IsEnum(['ACCOUNTING', 'MARKETING'])
  category: 'ACCOUNTING' | 'MARKETING';

  @ApiPropertyOptional({ example: 'A leading accounting firm' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://acme.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  image?: string;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'Acme Corp', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: ['ACCOUNTING', 'MARKETING'] })
  @IsOptional()
  @IsEnum(['ACCOUNTING', 'MARKETING'])
  category?: 'ACCOUNTING' | 'MARKETING';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;
}
