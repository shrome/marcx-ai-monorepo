import { Backend } from './base';
import { CreateCompanyDto, UpdateCompanyDto, Company, Session } from './types';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  companyId?: string;
}

export class CompanyClient extends Backend {
  /**
   * Create a new company
   */
  async create(data: CreateCompanyDto): Promise<Company> {
    return this.post<Company>('/company', data);
  }

  /**
   * Register a company for the current user (creates company and assigns to user)
   */
  async register(data: CreateCompanyDto): Promise<{
    company: Company;
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      emailVerified: boolean;
      companyId: string | null;
    };
  }> {
    return this.post('/company/register', data);
  }

  /**
   * Get all companies
   */
  async findAll(): Promise<Company[]> {
    return this.get<Company[]>('/company');
  }

  /**
   * Get a specific company by ID
   */
  async findOne(id: string): Promise<Company> {
    return this.get<Company>(`/company/${id}`);
  }

  /**
   * Update a company
   */
  async update(id: string, data: UpdateCompanyDto): Promise<Company> {
    return this.patch<Company>(`/company/${id}`, data);
  }

  /**
   * Delete a company
   */
  async remove(id: string): Promise<{ message: string }> {
    return this.delete(`/company/${id}`);
  }

  /**
   * Get all users in a company
   */
  async getUsers(id: string): Promise<User[]> {
    return this.get<User[]>(`/company/${id}/users`);
  }

  /**
   * Get all sessions for a company
   */
  async getSessions(id: string): Promise<Session[]> {
    return this.get<Session[]>(`/company/${id}/sessions`);
  }
}
