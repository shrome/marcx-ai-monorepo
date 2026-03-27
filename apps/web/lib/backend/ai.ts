import { Backend } from './base';

export interface OcrPresignResponse {
  url: string;
  docId: string;
}

export interface OcrJobStatus {
  docId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: Record<string, unknown>;
  error?: string;
}

export interface GLStatus {
  initialized: boolean;
  fiscalYear?: number;
  transactionCount?: number;
  lastUpdated?: string;
}

export interface GLTransaction {
  id: string;
  date: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
}

export interface GLTransactionsResponse {
  items: GLTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface Account {
  code: string;
  name: string;
  type: string;
  description?: string;
}

export interface LlmUsage {
  period: string;
  totalTokens: number;
  totalCost: number;
  breakdown: Array<{ model: string; tokens: number; cost: number }>;
}

export class AiClient extends Backend {
  // ── OCR ────────────────────────────────────────────────────────────────────

  async presignUpload(filename: string, contentType: string): Promise<OcrPresignResponse> {
    return this.post<OcrPresignResponse>('/ai/ocr/presign', { filename, contentType });
  }

  async triggerOcr(docId: string): Promise<void> {
    await this.post(`/ai/ocr/jobs/${docId}/run`);
  }

  async getOcrStatus(docId: string): Promise<OcrJobStatus> {
    return this.get<OcrJobStatus>(`/ai/ocr/jobs/${docId}/status`);
  }

  async processToGL(docId: string, fiscalYear?: number): Promise<Record<string, unknown>> {
    return this.post(`/ai/ocr/jobs/${docId}/process`, fiscalYear ? { fiscal_year: fiscalYear } : undefined);
  }

  // ── Enrichment ────────────────────────────────────────────────────────────

  async enrichDocument(docId: string): Promise<Record<string, unknown>> {
    return this.post(`/ai/documents/${docId}/enrich`);
  }

  async getCandidates(docId: string): Promise<Record<string, unknown>[]> {
    return this.get(`/ai/documents/${docId}/candidates`);
  }

  async confirmDocument(docId: string, data: Record<string, unknown>): Promise<void> {
    await this.post(`/ai/documents/${docId}/confirm`, data);
  }

  // ── General Ledger ─────────────────────────────────────────────────────────

  async getGLStatus(query?: { fiscal_year?: number }): Promise<GLStatus> {
    const params = query?.fiscal_year ? `?fiscal_year=${query.fiscal_year}` : '';
    return this.get<GLStatus>(`/ai/general-ledger/status${params}`);
  }

  async getGLTransactions(query?: {
    fiscal_year?: number;
    page?: number;
    limit?: number;
    account?: string;
    type?: 'debit' | 'credit';
  }): Promise<GLTransactionsResponse> {
    const params = new URLSearchParams();
    if (query?.fiscal_year) params.set('fiscal_year', String(query.fiscal_year));
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.account) params.set('account', query.account);
    if (query?.type) params.set('type', query.type);
    const qs = params.toString();
    return this.get<GLTransactionsResponse>(`/ai/general-ledger/transactions${qs ? `?${qs}` : ''}`);
  }

  async exportGL(fiscalYear?: number): Promise<Blob> {
    const params = fiscalYear ? `?fiscal_year=${fiscalYear}` : '';
    const response = await this.client.get(`/ai/general-ledger/export${params}`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  }

  async uploadGL(file: File, fiscalYear: number): Promise<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fiscal_year', String(fiscalYear));
    return this.postFormData('/ai/general-ledger/upload', formData);
  }

  async initialiseGL(data: { gl_file_path: string; fiscal_year: number }): Promise<Record<string, unknown>> {
    return this.post('/ai/general-ledger/initialise', data);
  }

  // ── Chart of Accounts ─────────────────────────────────────────────────────

  async getChartOfAccounts(): Promise<Account[]> {
    return this.get<Account[]>('/ai/chart-of-accounts');
  }

  async upsertChartOfAccounts(accounts: Account[]): Promise<void> {
    await this.post('/ai/chart-of-accounts', { accounts });
  }

  async deleteChartOfAccounts(): Promise<void> {
    await this.delete('/ai/chart-of-accounts');
  }

  // ── Categorisation Rules ───────────────────────────────────────────────────

  async getCategorisationRules(): Promise<Record<string, unknown>[]> {
    return this.get('/ai/categorisation-rules');
  }

  async createCategorisationRule(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.post('/ai/categorisation-rules', data);
  }

  // ── LLM Usage ─────────────────────────────────────────────────────────────

  async getLlmUsage(period?: string): Promise<LlmUsage> {
    const params = period ? `?period=${period}` : '';
    return this.get<LlmUsage>(`/ai/llm/usage${params}`);
  }

  async setLlmBudget(data: Record<string, unknown>): Promise<void> {
    await this.patch('/ai/llm/usage', data);
  }
}
