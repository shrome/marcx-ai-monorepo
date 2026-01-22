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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CaseService } from './case.service';
import { CreateCaseDto, UpdateCaseDto } from './dto/case.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { multerConfig } from '../../config/multer.config';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('cases')
@UseGuards(AuthGuard)
export class CaseController {
  constructor(private readonly caseService: CaseService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 20, multerConfig))
  create(
    @Body() createCaseDto: CreateCaseDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: RequestWithUser,
  ) {
    return this.caseService.create(createCaseDto, files, req.user.id);
  }

  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.caseService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.caseService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCaseDto: UpdateCaseDto,
    @Request() req: RequestWithUser,
  ) {
    return this.caseService.update(id, updateCaseDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.caseService.remove(id, req.user.id);
  }

  @Post(':sessionId/attachments')
  @UseInterceptors(FilesInterceptor('files', 20, multerConfig))
  addAttachments(
    @Param('sessionId') sessionId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: RequestWithUser,
  ) {
    return this.caseService.addAttachments(sessionId, files, req.user.id);
  }
}
