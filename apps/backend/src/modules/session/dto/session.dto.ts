import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateSessionDto {
  @IsEnum(['CHAT', 'CASE'])
  @IsNotEmpty()
  type: 'CHAT' | 'CASE';

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  companyId?: string;
}

export class UpdateSessionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['open', 'in_progress', 'closed'])
  @IsOptional()
  status?: string;

  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  priority?: string;
}
