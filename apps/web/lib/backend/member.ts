import { Backend } from './base';

export type MemberRole = 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  role: MemberRole;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
}

export interface InviteMemberDto {
  email: string;
  role: MemberRole;
}

export interface UpdateMemberRoleDto {
  role: MemberRole;
}

export class MemberClient extends Backend {
  async list(companyId: string): Promise<CompanyMember[]> {
    return this.get<CompanyMember[]>(`/companies/${companyId}/members`);
  }

  async invite(companyId: string, data: InviteMemberDto): Promise<CompanyMember> {
    return this.post<CompanyMember>(`/companies/${companyId}/members`, data);
  }

  async updateRole(companyId: string, memberId: string, data: UpdateMemberRoleDto): Promise<CompanyMember> {
    return this.patch<CompanyMember>(`/companies/${companyId}/members/${memberId}`, data);
  }

  async remove(companyId: string, memberId: string): Promise<{ message: string }> {
    return this.delete(`/companies/${companyId}/members/${memberId}`);
  }
}
