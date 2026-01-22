import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsEnum(['USER', 'ASSISTANT'])
  @IsNotEmpty()
  role: 'USER' | 'ASSISTANT';

  @IsString()
  @IsNotEmpty()
  content: string;
}
