import { Backend } from './base';
import { CreateSessionDto, UpdateSessionDto, Session } from './types';

export class SessionClient extends Backend {
  /**
   * Create a new chat session with the user's company
   */
  async createChatSession(data?: { title?: string }): Promise<Session> {
    return this.post<Session>('/sessions/chat', data || {});
  }

  /**
   * Create a new session
   */
  async create(data: CreateSessionDto): Promise<Session> {
    return this.post<Session>('/sessions', data);
  }

  /**
   * Get all sessions for the current user's company
   * @param fiscalYear Optional filter by fiscal year (for GL/ledger sessions)
   */
  async findAll(fiscalYear?: number): Promise<Session[]> {
    const params = new URLSearchParams();
    if (fiscalYear) params.set('fiscalYear', String(fiscalYear));
    const qs = params.toString();
    return this.get<Session[]>(qs ? `/sessions?${qs}` : '/sessions');
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
