import { Backend } from './base';

export interface ActivityLog {
  id: string;
  companyId: string;
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ListActivityQuery {
  entityType?: string;
  entityId?: string;
  page?: number;
  limit?: number;
}

export class ActivityClient extends Backend {
  async list(companyId: string, query?: ListActivityQuery): Promise<ActivityLog[]> {
    const params = new URLSearchParams();
    if (query?.entityType) params.set('entityType', query.entityType);
    if (query?.entityId) params.set('entityId', query.entityId);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return this.get<ActivityLog[]>(`/companies/${companyId}/activity${qs ? `?${qs}` : ''}`);
  }
}
