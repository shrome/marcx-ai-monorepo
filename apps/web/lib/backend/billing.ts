import { Backend } from './base';

export interface CompanyCredit {
  balance: number;
  currency: string;
}

export interface CreditTransaction {
  id: string;
  companyId: string;
  type: 'TOP_UP' | 'USAGE';
  amount: number;
  currency: string;
  referenceId?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface TopUpCreditDto {
  amount: number;
  referenceId?: string;
  note?: string;
}

export interface ListTransactionsQuery {
  type?: 'TOP_UP' | 'USAGE';
  page?: number;
  limit?: number;
}

export class BillingClient extends Backend {
  async getBalance(companyId: string): Promise<CompanyCredit> {
    return this.get<CompanyCredit>(`/companies/${companyId}/credit`);
  }

  async topUp(companyId: string, data: TopUpCreditDto): Promise<CreditTransaction> {
    return this.post<CreditTransaction>(`/companies/${companyId}/credit/top-up`, data);
  }

  async listTransactions(companyId: string, query?: ListTransactionsQuery): Promise<CreditTransaction[]> {
    const params = new URLSearchParams();
    if (query?.type) params.set('type', query.type);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return this.get<CreditTransaction[]>(`/companies/${companyId}/credit/transactions${qs ? `?${qs}` : ''}`);
  }
}
