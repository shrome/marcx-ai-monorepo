import { IsString, IsOptional, IsEnum, IsUrl, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsEnum(['ACCOUNTING', 'MARKETING'])
  category: 'ACCOUNTING' | 'MARKETING';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  image?: string;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEnum(['ACCOUNTING', 'MARKETING'])
  category?: 'ACCOUNTING' | 'MARKETING';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  image?: string;
}
