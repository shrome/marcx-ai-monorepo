import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateChatSessionDto {
  @IsString()
  @IsOptional()
  title?: string;
}

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

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

  @IsOptional()
  status?: string;
}
