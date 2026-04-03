import { Backend } from './base';
import { Ledger, CreateLedgerDto, UpdateLedgerDto } from './types';

export interface CreateLedgerWithGLResult {
  ledger: Ledger;
  glUploads: Array<{ file: string; success: boolean; error?: string }>;
}

export class LedgerClient extends Backend {
  async createWithGL(
    data: { name: string; fiscalYear: number; description?: string },
    files: File[],
  ): Promise<CreateLedgerWithGLResult> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('fiscalYear', String(data.fiscalYear));
    if (data.description) formData.append('description', data.description);
    files.forEach((f) => formData.append('files', f));
    return this.postFormData<CreateLedgerWithGLResult>('/ledgers/create-with-gl', formData);
  }

  async create(data: CreateLedgerDto): Promise<Ledger> {
    return this.post<Ledger>('/ledgers', data);
  }

  async findAll(): Promise<Ledger[]> {
    return this.get<Ledger[]>('/ledgers');
  }

  async findOne(id: string): Promise<Ledger> {
    return this.get<Ledger>(`/ledgers/${id}`);
  }

  async update(id: string, data: UpdateLedgerDto): Promise<Ledger> {
    return this.patch<Ledger>(`/ledgers/${id}`, data);
  }

  async remove(id: string): Promise<{ message: string }> {
    return this.delete(`/ledgers/${id}`);
  }
}
