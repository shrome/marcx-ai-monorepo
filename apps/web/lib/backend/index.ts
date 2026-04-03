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
export { UserClient } from './user';
export { CaseClient } from './case';
export { ChatClient } from './chat';
export { CompanyClient } from './company';
export { SessionClient } from './session';
export { DocumentClient } from './document';
export { BillingClient } from './billing';
export { ActivityClient } from './activity';
export { MemberClient } from './member';
export { AiClient } from './ai';
export { InvitationClient } from './invitation';
export { LedgerClient } from './ledger';
export * from './types';
export type { Document, UpdateDocumentDraftDto, ListDocumentsQuery } from './document';
export type { CompanyCredit, CreditTransaction, TopUpCreditDto, ListTransactionsQuery } from './billing';
export type { ActivityLog, ListActivityQuery } from './activity';
export type { CompanyMember, MemberRole, InviteMemberDto, UpdateMemberRoleDto } from './member';
export type { OcrPresignResponse, OcrJobStatus, GLStatus, GLTransaction, GLTransactionsResponse, Account, LlmUsage } from './ai';
export type { Invitation, CreateInvitationDto as CreateInvitationBody } from './invitation';
export type { Ledger, CreateLedgerDto, UpdateLedgerDto } from './types';

import { BackendConfig } from './types';
import { AuthClient } from './auth';
import { UserClient } from './user';
import { CaseClient } from './case';
import { ChatClient } from './chat';
import { CompanyClient } from './company';
import { SessionClient } from './session';
import { DocumentClient } from './document';
import { BillingClient } from './billing';
import { ActivityClient } from './activity';
import { MemberClient } from './member';
import { AiClient } from './ai';
import { InvitationClient } from './invitation';
import { LedgerClient } from './ledger';

/**
 * Unified Backend Client
 * Provides access to all API modules through a single interface
 */
export class BackendClient {
  public auth: AuthClient;
  public user: UserClient;
  public case: CaseClient;
  public chat: ChatClient;
  public company: CompanyClient;
  public session: SessionClient;
  public document: DocumentClient;
  public billing: BillingClient;
  public activity: ActivityClient;
  public member: MemberClient;
  public ai: AiClient;
  public invitation: InvitationClient;
  public ledger: LedgerClient;

  constructor(config: BackendConfig = {}) {
    this.auth = new AuthClient(config);
    this.user = new UserClient(config);
    this.case = new CaseClient(config);
    this.chat = new ChatClient(config);
    this.company = new CompanyClient(config);
    this.session = new SessionClient(config);
    this.document = new DocumentClient(config);
    this.billing = new BillingClient(config);
    this.activity = new ActivityClient(config);
    this.member = new MemberClient(config);
    this.ai = new AiClient(config);
    this.invitation = new InvitationClient(config);
    this.ledger = new LedgerClient(config);
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
