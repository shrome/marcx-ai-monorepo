import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

type MemberRole = 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';

export class CreateInvitationDto {
  @ApiProperty({ example: 'jane@acme.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ enum: ['OWNER', 'ADMIN', 'ACCOUNTANT', 'VIEWER'], default: 'VIEWER' })
  @IsEnum(['OWNER', 'ADMIN', 'ACCOUNTANT', 'VIEWER'])
  @IsOptional()
  role?: MemberRole;
}
