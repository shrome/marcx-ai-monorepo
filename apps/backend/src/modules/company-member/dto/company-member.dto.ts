import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  VIEWER = 'VIEWER',
}

export class InviteMemberDto {
  @ApiProperty({ example: 'colleague@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: MemberRole, example: MemberRole.ACCOUNTANT })
  @IsEnum(MemberRole)
  role: MemberRole;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: MemberRole, example: MemberRole.ADMIN })
  @IsEnum(MemberRole)
  role: MemberRole;
}
