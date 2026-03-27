import { Injectable } from '@nestjs/common';

interface SendOtpEmailParams {
  to: string;
  name: string;
  code: string;
  purpose: 'registration' | 'login' | 'verification';
}

/**
 * Test stub that captures OTP codes instead of sending emails.
 * Tests retrieve the OTP via getLastOtp() instead of checking an inbox.
 */
@Injectable()
export class MockEmailService {
  private readonly otpMap = new Map<string, string>();

  async sendOtpEmail(params: SendOtpEmailParams): Promise<void> {
    this.otpMap.set(params.to, params.code);
  }

  getLastOtp(email: string): string | undefined {
    return this.otpMap.get(email);
  }

  clearOtps(): void {
    this.otpMap.clear();
  }
}
