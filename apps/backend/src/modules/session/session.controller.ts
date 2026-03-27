import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SessionService } from './session.service';
import {
  CreateSessionDto,
  UpdateSessionDto,
  CreateChatSessionDto,
} from './dto/session.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Sessions')
@ApiBearerAuth('access-token')
@Controller('sessions')
@UseGuards(AuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Create a new chat session for current user' })
  @ApiResponse({ status: 201, description: 'Chat session created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createChatSession(
    @Body() createChatSessionDto: CreateChatSessionDto,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionService.createChatSession(createChatSessionDto, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new session' })
  @ApiResponse({ status: 201, description: 'Session created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() createSessionDto: CreateSessionDto,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionService.create(createSessionDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all sessions for current user' })
  @ApiResponse({ status: 200, description: 'Sessions list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Request() req: RequestWithUser) {
    return this.sessionService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Session found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.sessionService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update session' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Session updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionService.update(id, updateSessionDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete session' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Session deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.sessionService.remove(id, req.user.id);
  }
}
