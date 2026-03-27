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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiConsumes } from '@nestjs/swagger';
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

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions/:sessionId/messages')
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  @ApiOperation({ summary: 'Send a message in a session (with optional file attachments)' })
  @ApiParam({ name: 'sessionId', type: 'string', format: 'uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Message created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
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
  @ApiOperation({ summary: 'List all messages in a session' })
  @ApiParam({ name: 'sessionId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Messages list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  getMessages(
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.chatService.getMessages(sessionId, req.user.id);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Delete a chat message' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  deleteMessage(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.chatService.deleteMessage(id, req.user.id);
  }

  @Post('sessions/:sessionId/messages/:chatId/attachments')
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  @ApiOperation({ summary: 'Add file attachments to an existing message' })
  @ApiParam({ name: 'sessionId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'chatId', type: 'string', format: 'uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Attachments added' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Message not found' })
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
