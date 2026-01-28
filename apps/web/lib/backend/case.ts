import { Backend } from './base';
import { CreateCaseDto, UpdateCaseDto, Case } from './types';

export class CaseClient extends Backend {
  /**
   * Create a new case with optional file attachments
   */
  async create(data: CreateCaseDto, files?: File[]): Promise<Case> {
    const formData = new FormData();
    
    // Append case data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value);
      }
    });
    
    // Append files if provided
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }
    
    return this.postFormData<Case>('/cases', formData);
  }

  /**
   * Get all cases for the current user
   */
  async findAll(): Promise<Case[]> {
    return this.get<Case[]>('/cases');
  }

  /**
   * Get a specific case by ID
   */
  async findOne(id: string): Promise<Case> {
    return this.get<Case>(`/cases/${id}`);
  }

  /**
   * Update a case
   */
  async update(id: string, data: UpdateCaseDto): Promise<Case> {
    return this.patch<Case>(`/cases/${id}`, data);
  }

  /**
   * Delete a case
   */
  async remove(id: string): Promise<{ message: string }> {
    return this.delete(`/cases/${id}`);
  }

  /**
   * Add attachments to a case session
   */
  async addAttachments(sessionId: string, files: File[]): Promise<any> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    return this.postFormData(`/cases/${sessionId}/attachments`, formData);
  }
}
