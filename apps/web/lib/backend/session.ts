import { Backend } from './base';
import { CreateSessionDto, UpdateSessionDto, Session } from './types';

export class SessionClient extends Backend {
  /**
   * Create a new session
   */
  async create(data: CreateSessionDto): Promise<Session> {
    return this.post<Session>('/sessions', data);
  }

  /**
   * Get all sessions for the current user
   * @param type Optional filter by session type (CHAT or CASE)
   */
  async findAll(type?: 'CHAT' | 'CASE'): Promise<Session[]> {
    const endpoint = type ? `/sessions?type=${type}` : '/sessions';
    return this.get<Session[]>(endpoint);
  }

  /**
   * Get a specific session by ID
   */
  async findOne(id: string): Promise<Session> {
    return this.get<Session>(`/sessions/${id}`);
  }

  /**
   * Update a session
   */
  async update(id: string, data: UpdateSessionDto): Promise<Session> {
    return this.patch<Session>(`/sessions/${id}`, data);
  }

  /**
   * Delete a session
   */
  async remove(id: string): Promise<{ message: string }> {
    return this.delete(`/sessions/${id}`);
  }
}
