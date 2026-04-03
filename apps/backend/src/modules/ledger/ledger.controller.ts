import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { CreateLedgerDto } from './dto/create-ledger.dto';
import { UpdateLedgerDto } from './dto/update-ledger.dto';
import { CreateLedgerWithGlDto } from './dto/create-ledger-with-gl.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

interface RequestWithUser extends Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('Ledgers')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('ledgers')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post('create-with-gl')
  @ApiOperation({ summary: 'Create a ledger and upload GL files to AI in one step' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Ledger created and GL files uploaded' })
  @ApiResponse({ status: 409, description: 'A ledger for this fiscal year already exists' })
  @UseInterceptors(FilesInterceptor('files', 20))
  createWithGL(
    @Request() req: RequestWithUser,
    @Body() dto: CreateLedgerWithGlDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.ledgerService.createWithGL(dto, files ?? [], req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new General Ledger for the current fiscal year' })
  @ApiResponse({ status: 201, description: 'Ledger created successfully' })
  @ApiResponse({ status: 409, description: 'A ledger for this fiscal year already exists' })
  create(@Request() req: RequestWithUser, @Body() dto: CreateLedgerDto) {
    return this.ledgerService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all ledgers for the current company' })
  @ApiResponse({ status: 200, description: 'Ledgers returned' })
  findAll(@Request() req: RequestWithUser) {
    return this.ledgerService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ledger by ID with its sessions and documents' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ledger returned' })
  @ApiResponse({ status: 404, description: 'Ledger not found' })
  findOne(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ledgerService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ledger name, description, or status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ledger updated' })
  @ApiResponse({ status: 404, description: 'Ledger not found' })
  update(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLedgerDto,
  ) {
    return this.ledgerService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a ledger' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ledger deleted' })
  @ApiResponse({ status: 404, description: 'Ledger not found' })
  remove(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ledgerService.softDelete(id, req.user.id);
  }
}
