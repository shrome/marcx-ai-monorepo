import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AiProxyService } from './ai-proxy.service';
import { AuthGuard } from '../auth/guards/auth.guard';

interface RequestWithUser extends Request {
  user: { id: string };
}

@ApiTags('AI')
@ApiBearerAuth('access-token')
@Controller('ai')
@UseGuards(AuthGuard)
export class AiProxyController {
  constructor(private readonly aiProxyService: AiProxyService) {}

  // ── OCR Pipeline ─────────────────────────────────────────────────────────

  @Post('ocr/presign')
  @ApiOperation({ summary: 'Get a pre-signed S3 URL for direct document upload to OCR pipeline' })
  @ApiResponse({ status: 201, description: 'Pre-signed URL returned' })
  @ApiResponse({ status: 400, description: 'filename and contentType are required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  ocrPresign(
    @Body() body: { filename: string; contentType: string },
    @Request() req: RequestWithUser,
  ) {
    if (!body.filename || !body.contentType) {
      throw new BadRequestException('filename and contentType are required.');
    }
    return this.aiProxyService.ocrPresign(body, req.user.id);
  }

  @Get('ocr/jobs/:docId/status')
  @ApiOperation({ summary: 'Get OCR job status for a document' })
  @ApiParam({ name: 'docId', type: 'string' })
  @ApiResponse({ status: 200, description: 'OCR job status returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  ocrJobStatus(
    @Param('docId') docId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.ocrJobStatus(docId, req.user.id);
  }

  @Post('ocr/jobs/:docId/run')
  @ApiOperation({ summary: 'Trigger OCR processing for a document' })
  @ApiParam({ name: 'docId', type: 'string' })
  @ApiResponse({ status: 201, description: 'OCR job started' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  ocrJobRun(
    @Param('docId') docId: string,
    @Body() body: Record<string, unknown>,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.ocrJobRun(docId, body, req.user.id);
  }

  @Post('ocr/jobs/:docId/process')
  @ApiOperation({ summary: 'Process OCR results and map to journal entries' })
  @ApiParam({ name: 'docId', type: 'string' })
  @ApiQuery({ name: 'fiscal_year', required: false })
  @ApiResponse({ status: 201, description: 'Processing started' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  ocrJobProcess(
    @Param('docId') docId: string,
    @Body() body: Record<string, unknown>,
    @Query('fiscal_year') fiscalYear: string,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.ocrJobProcess(docId, body, fiscalYear, req.user.id);
  }

  // ── Document Enrichment ───────────────────────────────────────────────────

  @Post('documents/:docId/enrich')
  @ApiOperation({ summary: 'Enrich a document with AI-extracted accounting fields' })
  @ApiParam({ name: 'docId', type: 'string' })
  @ApiResponse({ status: 201, description: 'Enrichment started' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  enrichDocument(
    @Param('docId') docId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.enrichDocument(docId, req.user.id);
  }

  @Get('documents/:docId/candidates')
  @ApiOperation({ summary: 'Get AI-suggested journal entry candidates for a document' })
  @ApiParam({ name: 'docId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Candidates returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getDocumentCandidates(
    @Param('docId') docId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.getDocumentCandidates(docId, req.user.id);
  }

  @Post('documents/:docId/confirm')
  @ApiOperation({ summary: 'Confirm and post AI-suggested journal entries' })
  @ApiParam({ name: 'docId', type: 'string' })
  @ApiResponse({ status: 201, description: 'Entries confirmed and posted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  confirmDocument(
    @Param('docId') docId: string,
    @Body() body: Record<string, unknown>,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.confirmDocument(docId, body, req.user.id);
  }

  @Post('documents/:docId/gl-prepare')
  @ApiOperation({ summary: 'Prepare document for general ledger posting' })
  @ApiParam({ name: 'docId', type: 'string' })
  @ApiResponse({ status: 201, description: 'GL preparation started' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  glPrepareDocument(
    @Param('docId') docId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.glPrepareDocument(docId, req.user.id);
  }

  // ── General Ledger ────────────────────────────────────────────────────────

  @Post('general-ledger/upload')
  @ApiOperation({ summary: 'Upload a general ledger file for processing' })
  @ApiResponse({ status: 201, description: 'GL file uploaded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  glUpload(
    @Body() body: Record<string, unknown>,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.glUpload(body, req.user.id);
  }

  @Post('general-ledger/initialise')
  @ApiOperation({ summary: 'Initialise the general ledger for a fiscal year' })
  @ApiResponse({ status: 201, description: 'GL initialised' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  glInitialise(
    @Body() body: { gl_file_path: string; fiscal_year: number },
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.glInitialise(body, req.user.id);
  }

  @Get('general-ledger/status')
  @ApiOperation({ summary: 'Get general ledger processing status' })
  @ApiQuery({ name: 'fiscal_year', required: false })
  @ApiResponse({ status: 200, description: 'GL status returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  glStatus(
    @Query() query: Record<string, string>,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.glStatus(query, req.user.id);
  }

  @Get('general-ledger/transactions')
  @ApiOperation({ summary: 'List general ledger transactions' })
  @ApiQuery({ name: 'fiscal_year', required: false })
  @ApiQuery({ name: 'account_code', required: false })
  @ApiResponse({ status: 200, description: 'GL transactions returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  glTransactions(
    @Query() query: Record<string, string>,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.glTransactions(query, req.user.id);
  }

  @Get('general-ledger/export')
  @ApiOperation({ summary: 'Export general ledger as CSV or Excel' })
  @ApiQuery({ name: 'fiscal_year', required: false })
  @ApiQuery({ name: 'format', required: false })
  @ApiResponse({ status: 200, description: 'Export file returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  glExport(
    @Query() query: Record<string, string>,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.glExport(query, req.user.id);
  }

  // ── Chat ──────────────────────────────────────────────────────────────────

  @Post('chat/sessions')
  @ApiOperation({ summary: 'Create a new AI chat session' })
  @ApiResponse({ status: 201, description: 'AI chat session created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createAiChatSession(
    @Body() body: { title?: string; fiscal_year?: number },
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.createAiChatSession(body, req.user.id);
  }

  @Post('chat/sessions/:sessionId/upload')
  @ApiOperation({ summary: 'Get pre-signed URL to upload a file into an AI chat session' })
  @ApiParam({ name: 'sessionId', type: 'string' })
  @ApiResponse({ status: 201, description: 'Pre-signed URL returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  chatUploadPresign(
    @Param('sessionId') sessionId: string,
    @Body() body: { filename?: string; contentType?: string },
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.chatUploadPresign(sessionId, body, req.user.id);
  }

  @Get('chat/jobs/:docId')
  @ApiOperation({ summary: 'Get AI processing job status for a chat document' })
  @ApiParam({ name: 'docId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Job status returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  chatJobStatus(
    @Param('docId') docId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.chatJobStatus(docId, req.user.id);
  }

  @Get('chat/review/:docId')
  @ApiOperation({ summary: 'Get AI review results for a chat document' })
  @ApiParam({ name: 'docId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Review results returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  chatReview(
    @Param('docId') docId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.chatReview(docId, req.user.id);
  }

  // ── Chart of Accounts ─────────────────────────────────────────────────────

  @Get('chart-of-accounts')
  @ApiOperation({ summary: 'Get chart of accounts for current company' })
  @ApiResponse({ status: 200, description: 'Chart of accounts returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getChartOfAccounts(@Request() req: RequestWithUser) {
    return this.aiProxyService.getChartOfAccounts(req.user.id);
  }

  @Post('chart-of-accounts')
  @ApiOperation({ summary: 'Create or update chart of accounts entries' })
  @ApiResponse({ status: 201, description: 'Chart of accounts updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  upsertChartOfAccounts(
    @Body() body: { accounts: unknown[] },
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.upsertChartOfAccounts(body, req.user.id);
  }

  @Delete('chart-of-accounts')
  @ApiOperation({ summary: 'Delete all chart of accounts entries for current company' })
  @ApiResponse({ status: 200, description: 'Chart of accounts deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  deleteChartOfAccounts(@Request() req: RequestWithUser) {
    return this.aiProxyService.deleteChartOfAccounts(req.user.id);
  }

  // ── Categorisation Rules ──────────────────────────────────────────────────

  @Get('categorisation-rules')
  @ApiOperation({ summary: 'Get categorisation rules for current company' })
  @ApiResponse({ status: 200, description: 'Categorisation rules returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getCategorisationRules(@Request() req: RequestWithUser) {
    return this.aiProxyService.getCategorisationRules(req.user.id);
  }

  @Post('categorisation-rules')
  @ApiOperation({ summary: 'Create a new categorisation rule' })
  @ApiResponse({ status: 201, description: 'Rule created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createCategorisationRule(
    @Body() body: Record<string, unknown>,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.createCategorisationRule(body, req.user.id);
  }

  // ── LLM Usage ─────────────────────────────────────────────────────────────

  @Get('llm/usage')
  @ApiOperation({ summary: 'Get LLM token usage and cost for current company' })
  @ApiQuery({ name: 'period', required: false, description: 'e.g. 2024-01 for monthly, 2024 for yearly' })
  @ApiResponse({ status: 200, description: 'LLM usage stats returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getLlmUsage(
    @Query('period') period: string,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.getLlmUsage(period, req.user.id);
  }

  @Put('llm/usage')
  @ApiOperation({ summary: 'Set LLM token budget for current company' })
  @ApiResponse({ status: 200, description: 'LLM budget updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  setLlmBudget(
    @Body() body: Record<string, unknown>,
    @Request() req: RequestWithUser,
  ) {
    return this.aiProxyService.setLlmBudget(body, req.user.id);
  }
}
