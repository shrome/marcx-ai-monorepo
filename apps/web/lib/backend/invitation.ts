import { Backend } from './base';

export interface Invitation {
  id: string;
  companyId: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';
  invitedBy: string;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
  company?: { id: string; name: string };
  invitedByUser?: { id: string; name: string; email: string };
}

export interface CreateInvitationDto {
  email: string;
  role?: 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';
}

export class InvitationClient extends Backend {
  async create(companyId: string, dto: CreateInvitationDto): Promise<Invitation> {
    return this.post<Invitation>(`/companies/${companyId}/invitations`, dto);
  }

  async list(companyId: string): Promise<Invitation[]> {
    return this.get<Invitation[]>(`/companies/${companyId}/invitations`);
  }

  async revoke(companyId: string, invitationId: string): Promise<Invitation> {
    return this.delete<Invitation>(`/companies/${companyId}/invitations/${invitationId}`);
  }

  async getByToken(token: string): Promise<Invitation> {
    return this.get<Invitation>(`/invitations/${token}`);
  }

  async accept(token: string): Promise<{ companyId: string; userId: string; role: string }> {
    return this.post(`/invitations/${token}/accept`, {});
  }
}
