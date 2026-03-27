import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ example: 'Can you summarise this invoice?' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
