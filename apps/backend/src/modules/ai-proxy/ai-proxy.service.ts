import { Injectable, Logger } from '@nestjs/common';
import { AiApiClient } from './ai-api.client';
import { TenantResolverService } from './tenant-resolver.service';

@Injectable()
export class AiProxyService {
  private readonly logger = new Logger(AiProxyService.name);

  constructor(
    private readonly aiApiClient: AiApiClient,
    private readonly tenantResolver: TenantResolverService,
  ) {}

  // ── OCR Pipeline ─────────────────────────────────────────────────────────

  async ocrPresign(body: { filename: string; contentType: string }, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    this.logger.log(`OCR presign for tenant ${tenantId}: ${body.filename}`);
    return this.aiApiClient.post('/api/ocr/presign', { tenantId, userId }, body);
  }

  async ocrJobStatus(docId: string, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    return this.aiApiClient.get(`/api/ocr/jobs/${tenantId}/${docId}`, { tenantId, userId });
  }

  async ocrJobRun(docId: string, body: Record<string, unknown>, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    this.logger.log(`OCR run for doc ${docId}, tenant ${tenantId}`);
    return this.aiApiClient.post(`/api/ocr/jobs/${tenantId}/${docId}/run`, { tenantId, userId }, body);
  }

  async ocrJobProcess(
    docId: string,
    body: Record<string, unknown>,
    fiscalYear: string | undefined,
    userId: string,
  ) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    this.logger.log(`OCR process (post to GL) for doc ${docId}, tenant ${tenantId}`);
    const params = fiscalYear ? { fiscal_year: fiscalYear } : undefined;
    return this.aiApiClient.post(
      `/api/ocr/jobs/${tenantId}/${docId}/process`,
      { tenantId, userId },
      { ...body, ...(params && { fiscal_year: fiscalYear }) },
    );
  }

  // ── Document Enrichment ───────────────────────────────────────────────────

  async enrichDocument(docId: string, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    this.logger.log(`Enriching document ${docId} for tenant ${tenantId}`);
    return this.aiApiClient.post('/api/documents/enrich', { tenantId, userId }, {
      tenant_id: tenantId,
      doc_id: docId,
    });
  }

  async getDocumentCandidates(docId: string, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    return this.aiApiClient.get(
      `/api/documents/${tenantId}/${docId}/candidates`,
      { tenantId, userId },
    );
  }

  async confirmDocument(docId: string, body: Record<string, unknown>, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    this.logger.log(`Confirming document ${docId} for tenant ${tenantId}`);
    return this.aiApiClient.post('/api/documents/confirm', { tenantId, userId }, {
      tenant_id: tenantId,
      doc_id: docId,
      user_id: userId,
      ...body,
    });
  }

  async glPrepareDocument(docId: string, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    return this.aiApiClient.post(
      `/api/documents/${tenantId}/${docId}/gl-prepare`,
      { tenantId, userId },
    );
  }

  // ── General Ledger ────────────────────────────────────────────────────────

  async glUpload(body: Record<string, unknown>, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    this.logger.log(`GL upload for tenant ${tenantId}`);
    return this.aiApiClient.post('/api/gl/upload', { tenantId, userId }, body);
  }

  async glInitialise(body: { gl_file_path: string; fiscal_year: number }, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    this.logger.log(`GL initialise for tenant ${tenantId}, fiscal year ${body.fiscal_year}`);
    return this.aiApiClient.post('/api/gl/initialise', { tenantId, userId }, body);
  }

  async glStatus(query: Record<string, string>, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    return this.aiApiClient.get(
      `/api/tenants/${tenantId}/gl/status`,
      { tenantId, userId },
      query,
    );
  }

  async glTransactions(query: Record<string, string>, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    return this.aiApiClient.get(
      `/api/tenants/${tenantId}/gl/transactions`,
      { tenantId, userId },
      query,
    );
  }

  async glExport(query: Record<string, string>, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    return this.aiApiClient.get(
      `/api/tenants/${tenantId}/gl/export`,
      { tenantId, userId },
      query,
    );
  }

  // ── Chat ──────────────────────────────────────────────────────────────────

  async createAiChatSession(body: { title?: string; fiscal_year?: number }, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    this.logger.log(`Creating AI chat session for tenant ${tenantId}`);
    return this.aiApiClient.post('/api/chat/sessions', { tenantId, userId }, body);
  }

  async sendChatMessage(sessionId: string, message: string, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    this.logger.log(`Sending chat message to AI for session ${sessionId}`);
    return this.aiApiClient.post(
      `/api/chat/sessions/${sessionId}/messages`,
      { tenantId, userId },
      { message },
    );
  }

  async chatUploadPresign(
    sessionId: string,
    body: { filename?: string; contentType?: string },
    userId: string,
  ) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    return this.aiApiClient.post(
      `/api/chat/sessions/${sessionId}/uploads/presign`,
      { tenantId, userId },
      body,
    );
  }

  async chatJobStatus(docId: string, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    return this.aiApiClient.get(
      `/api/chat/jobs/${tenantId}/${docId}`,
      { tenantId, userId },
    );
  }

  async chatReview(docId: string, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    return this.aiApiClient.get(
      `/api/chat/review/${tenantId}/${docId}`,
      { tenantId, userId },
    );
  }

  // ── Chart of Accounts ─────────────────────────────────────────────────────

  async getChartOfAccounts(userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    return this.aiApiClient.get(
      `/api/tenants/${tenantId}/chart-of-accounts`,
      { tenantId, userId },
    );
  }

  async upsertChartOfAccounts(body: { accounts: unknown[] }, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    this.logger.log(`Upserting ${body.accounts.length} chart of accounts for tenant ${tenantId}`);
    return this.aiApiClient.post(
      `/api/tenants/${tenantId}/chart-of-accounts`,
      { tenantId, userId },
      body,
    );
  }

  async deleteChartOfAccounts(userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    this.logger.log(`Deleting chart of accounts for tenant ${tenantId}`);
    return this.aiApiClient.delete(
      `/api/tenants/${tenantId}/chart-of-accounts`,
      { tenantId, userId },
    );
  }

  // ── Categorisation Rules ──────────────────────────────────────────────────

  async getCategorisationRules(userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    return this.aiApiClient.get(
      `/api/tenants/${tenantId}/categorisation-rules`,
      { tenantId, userId },
    );
  }

  async createCategorisationRule(body: Record<string, unknown>, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    return this.aiApiClient.post(
      `/api/tenants/${tenantId}/categorisation-rules`,
      { tenantId, userId },
      body,
    );
  }

  // ── LLM Usage ─────────────────────────────────────────────────────────────

  async getLlmUsage(period: string | undefined, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    return this.aiApiClient.get(
      `/api/tenants/${tenantId}/llm/usage`,
      { tenantId, userId },
      period ? { period } : undefined,
    );
  }

  async setLlmBudget(body: Record<string, unknown>, userId: string) {
    const { tenantId } = await this.tenantResolver.resolve(userId);
    return this.aiApiClient.put(
      `/api/tenants/${tenantId}/llm/usage`,
      { tenantId, userId },
      body,
    );
  }
}
