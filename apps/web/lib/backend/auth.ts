import { Backend } from './base';
import {
  RegisterDto,
  LoginDto,
  SendOtpDto,
  VerifyOtpDto,
  AuthResponse,
  VerifyOtpResponse,
} from './types';

export class AuthClient extends Backend {
  /**
   * Register a new user (sends OTP for verification)
   */
  async register(data: RegisterDto): Promise<{ user: any; message: string }> {
    const response = await this.post<{ user: any; message: string }>('/auth/register', data);
    return response;
  }

  /**
   * Login with email (sends OTP for verification)
   */
  async login(data: LoginDto): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>('/auth/login', data);
    return response;
  }

  /**
   * Send OTP to email
   */
  async sendOtp(data: SendOtpDto): Promise<{ message: string }> {
    return this.post('/auth/otp/send', data);
  }

  /**
   * Verify registration OTP (logs user in, returns tokens and user data)
   */
  async verifyRegistrationOtp(data: VerifyOtpDto): Promise<VerifyOtpResponse> {
    const response = await this.post<VerifyOtpResponse>('/auth/register/verify', data);
    return response;
  }

  /**
   * Verify login OTP (logs in user, sets cookies)
   */
  async verifyLoginOtp(data: VerifyOtpDto): Promise<VerifyOtpResponse> {
    const response = await this.post<VerifyOtpResponse>('/auth/login/verify', data);
    return response;
  }

  /**
   * Refresh access token using the refresh token cookie
   */
  async refreshAccessToken(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/auth/refresh');
  }

  /**
   * Revoke the current refresh token
   * Cookies are cleared by the server
   */
  async revokeToken(): Promise<{ message: string }> {
    return this.post('/auth/revoke');
  }

  /**
   * Revoke all refresh tokens for the current user
   * Cookies are cleared by the server
   */
  async revokeAllTokens(): Promise<{ message: string }> {
    return this.post('/auth/revoke-all');
  }

  /**
   * Logout - revoke all tokens
   * Cookies are automatically cleared by the server
   */
  async logout(): Promise<void> {
    await this.revokeAllTokens();
  }
}
