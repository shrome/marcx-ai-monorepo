/**
 * Backend API Client Library
 * 
 * This library provides a structured way to interact with the NestJS backend API.
 * 
 * @example
 * ```typescript
 * import { createBackendClient } from '@/lib/backend';
 * 
 * // Create a client instance
 * const backend = createBackendClient({
 *   baseUrl: 'http://localhost:3001',
 *   onTokenRefresh: (accessToken, refreshToken) => {
 *     // Save tokens to localStorage or cookies
 *     localStorage.setItem('accessToken', accessToken);
 *     localStorage.setItem('refreshToken', refreshToken);
 *   },
 *   onAuthError: () => {
 *     // Redirect to login or show error
 *     window.location.href = '/login';
 *   }
 * });
 * 
 * // Use individual clients
 * await backend.auth.login({ email: 'user@example.com', password: 'password' });
 * const cases = await backend.case.findAll();
 * const messages = await backend.chat.getMessages('session-id');
 * ```
 */

export { Backend, ApiClientError } from './base';
export { AuthClient } from './auth';
export { CaseClient } from './case';
export { ChatClient } from './chat';
export { CompanyClient } from './company';
export { SessionClient } from './session';
export * from './types';

import { BackendConfig } from './types';
import { AuthClient } from './auth';
import { CaseClient } from './case';
import { ChatClient } from './chat';
import { CompanyClient } from './company';
import { SessionClient } from './session';

/**
 * Unified Backend Client
 * Provides access to all API modules through a single interface
 */
export class BackendClient {
  public auth: AuthClient;
  public case: CaseClient;
  public chat: ChatClient;
  public company: CompanyClient;
  public session: SessionClient;

  constructor(config: BackendConfig = {}) {
    // All clients share the same configuration
    this.auth = new AuthClient(config);
    this.case = new CaseClient(config);
    this.chat = new ChatClient(config);
    this.company = new CompanyClient(config);
    this.session = new SessionClient(config);
  }
}

/**
 * Factory function to create a new backend client instance
 */
export function createBackendClient(config?: BackendConfig): BackendClient {
  return new BackendClient(config);
}

/**
 * Singleton instance (optional, for simple use cases)
 */
let backendInstance: BackendClient | null = null;

export function getBackendClient(config?: BackendConfig): BackendClient {
  if (!backendInstance) {
    backendInstance = new BackendClient(config);
  }
  return backendInstance;
}
