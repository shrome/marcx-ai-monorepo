import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
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

@Controller('sessions')
@UseGuards(AuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('chat')
  createChatSession(
    @Body() createChatSessionDto: CreateChatSessionDto,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionService.createChatSession(
      createChatSessionDto,
      req.user.id,
    );
  }

  @Post()
  create(
    @Body() createSessionDto: CreateSessionDto,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionService.create(createSessionDto, req.user.id);
  }

  @Get()
  findAll(
    @Request() req: RequestWithUser,
    @Query('type') type?: 'CHAT' | 'CASE',
  ) {
    return this.sessionService.findAll(req.user.id, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.sessionService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @Request() req: RequestWithUser,
  ) {
    return this.sessionService.update(id, updateSessionDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.sessionService.remove(id, req.user.id);
  }
}
