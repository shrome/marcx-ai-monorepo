import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/chat.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { multerConfig } from '../../config/multer.config';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions/:sessionId/messages')
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  createMessage(
    @Param('sessionId') sessionId: string,
    @Body() createMessageDto: CreateMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: RequestWithUser,
  ) {
    return this.chatService.createMessage(
      sessionId,
      createMessageDto,
      files,
      req.user.id,
    );
  }

  @Get('sessions/:sessionId/messages')
  getMessages(
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.chatService.getMessages(sessionId, req.user.id);
  }

  @Delete('messages/:id')
  deleteMessage(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.chatService.deleteMessage(id, req.user.id);
  }

  @Post('sessions/:sessionId/messages/:chatId/attachments')
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  addAttachments(
    @Param('sessionId') sessionId: string,
    @Param('chatId') chatId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: RequestWithUser,
  ) {
    return this.chatService.addAttachments(
      sessionId,
      chatId,
      files,
      req.user.id,
    );
  }
}
