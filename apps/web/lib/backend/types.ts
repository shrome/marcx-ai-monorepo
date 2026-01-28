// Auth Types
export interface RegisterDto {
  email: string;
  name: string;
}

export interface LoginDto {
  email: string;
}

export interface SendOtpDto {
  email: string;
}

export interface VerifyOtpDto {
  email: string;
  code: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface RevokeTokenDto {
  refreshToken: string;
}

export interface AuthResponse {
  user: {
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
  };
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    emailVerified: boolean;
    companyId?: string | null;
  };
  message: string;
  requiresCompanySetup: boolean;
}

// Case Types
export interface CreateCaseDto {
  title: string;
  description?: string;
  clientName: string;
  priority?: 'low' | 'medium' | 'high';
  companyId: string;
}

export interface UpdateCaseDto {
  title?: string;
  description?: string;
  clientName?: string;
  status?: 'open' | 'in_progress' | 'closed';
  priority?: 'low' | 'medium' | 'high';
}

export interface Case {
  id: string;
  title: string;
  description?: string;
  clientName: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  companyId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Chat Types
export interface CreateMessageDto {
  sessionId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Company Types
export interface CreateCompanyDto {
  name: string;
  category: 'ACCOUNTING' | 'MARKETING';
  description?: string;
  website?: string;
  image?: string;
}

export interface UpdateCompanyDto {
  name?: string;
  category?: 'ACCOUNTING' | 'MARKETING';
  description?: string;
  website?: string;
  image?: string;
}

export interface Company {
  id: string;
  name: string;
  category: 'ACCOUNTING' | 'MARKETING';
  description?: string;
  website?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

// Session Types
export interface CreateSessionDto {
  type: 'CHAT' | 'CASE';
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  companyId?: string;
}

export interface UpdateSessionDto {
  title?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'closed';
  priority?: 'low' | 'medium' | 'high';
}

export interface Session {
  id: string;
  type: 'CHAT' | 'CASE';
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  userId: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

// Common Types
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface BackendConfig {
  baseUrl?: string;
  onAuthError?: () => void;
}
