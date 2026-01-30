import { Backend } from './base';
import { AuthResponse } from './types';

interface UpdateUserDto {
  name?: string;
  image?: string;
}

interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: string;
  emailVerified: boolean;
  companyId?: string | null;
  company?: {
    id: string;
    name: string;
    category: 'ACCOUNTING' | 'MARKETING';
    description?: string | null;
    website?: string | null;
    image?: string | null;
  };
  createdAt: string;
  updatedAt: string | null;
}

export class UserClient extends Backend {
  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<AuthResponse> {
    return this.get<AuthResponse>('/users/me');
  }

  /**
   * Get a specific user by ID
   */
  async findOne(id: string): Promise<User> {
    return this.get<User>(`/users/${id}`);
  }

  /**
   * Update user profile
   */
  async update(id: string, data: UpdateUserDto): Promise<User> {
    return this.patch<User>(`/users/${id}`, data);
  }
}
