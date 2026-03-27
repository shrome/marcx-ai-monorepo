import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { DocumentService } from './document.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  ListDocumentsQueryDto,
} from './dto/document.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

interface RequestWithUser extends Request {
  user: { id: string; companyId: string };
}

@ApiTags('Documents')
@ApiBearerAuth('access-token')
@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document file (invoice, receipt, etc.)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Document uploaded and queued for processing' })
  @ApiResponse({ status: 400, description: 'No file provided or invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @UploadedFile() uploadedFile: Express.Multer.File,
    @Body() dto: CreateDocumentDto,
    @Request() req: RequestWithUser,
  ) {
    if (!uploadedFile) {
      throw new BadRequestException('A file must be attached to create a document.');
    }
    return this.documentService.create(
      uploadedFile,
      dto,
      req.user.id,
      req.user.companyId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List documents for the current company' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: 'Documents list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query() query: ListDocumentsQueryDto,
    @Request() req: RequestWithUser,
  ) {
    return this.documentService.findAll(req.user.companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Document found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.documentService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document draft fields' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Document updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.documentService.updateDraft(id, req.user.companyId, dto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a document (marks it as ready for GL posting)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Document approved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  approve(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.documentService.approve(id, req.user.id, req.user.companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a document' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.documentService.softDelete(id, req.user.companyId, req.user.id);
  }
}
