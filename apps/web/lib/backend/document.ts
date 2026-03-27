import { Backend } from './base';

export interface Document {
  id: string;
  fileId: string;
  companyId: string;
  sessionId?: string | null;
  uploadedBy: string;
  extractionStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  documentStatus: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED';
  rawData?: Record<string, unknown> | null;
  draftData?: Record<string, unknown> | null;
  approvedData?: Record<string, unknown> | null;
  reviewNotes?: string | null;
  postedBy?: string | null;
  postedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  file?: {
    id: string;
    name: string;
    url: string;
    size: number;
    mimeType: string;
  };
}

export interface UpdateDocumentDraftDto {
  draftData: Record<string, unknown>;
  reviewNotes?: string;
}

export interface ListDocumentsQuery {
  sessionId?: string;
  extractionStatus?: string;
  documentStatus?: string;
  page?: number;
  limit?: number;
}

export class DocumentClient extends Backend {
  async upload(file: File, companyId: string, sessionId?: string): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyId', companyId);
    if (sessionId) formData.append('sessionId', sessionId);
    return this.postFormData<Document>('/documents', formData);
  }

  async findAll(query?: ListDocumentsQuery): Promise<{ data: Document[]; page: number; limit: number }> {
    const params = new URLSearchParams();
    if (query?.sessionId) params.set('sessionId', query.sessionId);
    if (query?.extractionStatus) params.set('extractionStatus', query.extractionStatus);
    if (query?.documentStatus) params.set('documentStatus', query.documentStatus);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return this.get<{ data: Document[]; page: number; limit: number }>(`/documents${qs ? `?${qs}` : ''}`);
  }

  async findOne(id: string): Promise<Document> {
    return this.get<Document>(`/documents/${id}`);
  }

  async updateDraft(id: string, data: UpdateDocumentDraftDto): Promise<Document> {
    return this.patch<Document>(`/documents/${id}`, data);
  }

  async approve(id: string): Promise<Document> {
    return this.post<Document>(`/documents/${id}/approve`);
  }

  async remove(id: string): Promise<{ message: string }> {
    return this.delete(`/documents/${id}`);
  }
}
