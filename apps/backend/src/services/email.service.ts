import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

interface SendOtpEmailParams {
  to: string;
  name: string;
  code: string;
  purpose: 'registration' | 'login' | 'verification';
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string = 'MarcX AI <onboarding@resend.dev>';

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not set in environment variables');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    this.resend = new Resend(apiKey);
    this.logger.log('Email service initialized with Resend');
  }

  /**
   * Send OTP verification email
   */
  async sendOtpEmail(params: SendOtpEmailParams): Promise<void> {
    const { to, name, code, purpose } = params;

    const subject = this.getEmailSubject(purpose);
    const html = this.getOtpEmailTemplate(name, code, purpose);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send OTP email to ${to}:`, error);
        throw error;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.log(`OTP email sent successfully to ${to}, ID: ${data?.id}`);
    } catch (error) {
      this.logger.error(`Error sending OTP email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Get email subject based on purpose
   */
  private getEmailSubject(purpose: string): string {
    switch (purpose) {
      case 'registration':
        return 'Verify Your Email - MarcX AI';
      case 'login':
        return 'Your Login Code - MarcX AI';
      case 'verification':
        return 'Your Verification Code - MarcX AI';
      default:
        return 'Your Verification Code - MarcX AI';
    }
  }

  /**
   * Generate OTP email HTML template
   */
  private getOtpEmailTemplate(
    name: string,
    code: string,
    purpose: string,
  ): string {
    const greeting = name || 'there';
    const purposeText = this.getPurposeText(purpose);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">
                MarcX AI
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                Hi ${greeting},
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                ${purposeText}
              </p>
            </td>
          </tr>
          
          <!-- OTP Code -->
          <tr>
            <td align="center" style="padding: 0 40px 30px 40px;">
              <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 30px; text-align: center;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 500; color: #6c757d; text-transform: uppercase; letter-spacing: 1px;">
                  Your Verification Code
                </p>
                <p style="margin: 0; font-size: 36px; font-weight: 700; color: #1a1a1a; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Expiry Notice -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <p style="margin: 0; font-size: 14px; line-height: 20px; color: #6c757d; text-align: center;">
                This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 20px; color: #6c757d; text-align: center;">
                Need help? Contact us at <a href="mailto:support@marcx.ai" style="color: #007bff; text-decoration: none;">support@marcx.ai</a>
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #adb5bd; text-align: center;">
                © ${new Date().getFullYear()} MarcX AI. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Get purpose-specific text for the email
   */
  private getPurposeText(purpose: string): string {
    switch (purpose) {
      case 'registration':
        return 'Thank you for registering with MarcX AI! Please use the verification code below to verify your email address and complete your registration.';
      case 'login':
        return 'Here is your one-time login code. Please use it to access your account.';
      case 'verification':
        return 'Please use the verification code below to continue.';
      default:
        return 'Please use the verification code below to continue.';
    }
  }
}
