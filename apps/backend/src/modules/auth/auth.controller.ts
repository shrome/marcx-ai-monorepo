import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Response,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import * as express from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  SendOtpDto,
  VerifyOtpDto,
  RefreshTokenDto,
  RevokeTokenDto,
} from './dto/auth.dto';
import { AuthGuard } from './guards/auth.guard';

interface RequestWithCookies extends Request {
  cookies?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
  cookies?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Extract refresh token from multiple sources (priority order):
   * 1. Request body
   * 2. Authorization header (Bearer token)
   * 3. Cookie
   */
  private extractRefreshToken(
    req: RequestWithCookies,
    body?: RefreshTokenDto | RevokeTokenDto,
    authHeader?: string,
  ): string {
    // Priority 1: Request body
    if (body?.refreshToken) {
      return body.refreshToken;
    }

    // Priority 2: Authorization header (Bearer token)
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Priority 3: Cookie
    if (req.cookies?.refreshToken) {
      return req.cookies.refreshToken;
    }

    throw new UnauthorizedException(
      'No refresh token found in body, header, or cookie',
    );
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('otp/send')
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }

  @Post('register/verify')
  async verifyRegistrationOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Response({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.verifyRegistrationOtp(verifyOtpDto);

    // Set httpOnly cookies with tokens
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result;
  }

  @Post('login/verify')
  async verifyLoginOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Response({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.verifyLoginOtp(verifyOtpDto);

    // Set httpOnly cookies with tokens
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result;
  }

  @Post('refresh')
  async refreshToken(
    @Request() req: RequestWithCookies,
    @Body() body: RefreshTokenDto,
    @Headers('authorization') authHeader: string,
    @Response({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = this.extractRefreshToken(req, body, authHeader);

    console.log('Refresh token received from:', {
      fromBody: !!body?.refreshToken,
      fromHeader: !!authHeader,
      fromCookie: !!req.cookies?.refreshToken,
    });

    const result = await this.authService.refreshAccessToken(refreshToken);

    // Set new access token cookie (for cookie-based clients)
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    console.log('New access token set in cookie and response body');
    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      message: 'Token refreshed successfully',
    };
  }

  @Post('revoke')
  @UseGuards(AuthGuard)
  async revokeToken(
    @Request() req: RequestWithUser,
    @Body() body: RevokeTokenDto,
    @Headers('authorization') authHeader: string,
    @Response({ passthrough: true }) res: express.Response,
  ) {
    try {
      const refreshToken = this.extractRefreshToken(req, body, authHeader);
      await this.authService.revokeRefreshToken(refreshToken, req.user.id);
    } catch (error) {
      // If no refresh token found, that's okay - just clear cookies
      console.log(
        'No refresh token to revoke:',
        error instanceof Error ? error.message : String(error),
      );
    }

    // Clear cookies (for cookie-based clients)
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { message: 'Token revoked successfully' };
  }

  @Post('revoke-all')
  @UseGuards(AuthGuard)
  async revokeAllTokens(
    @Request() req: RequestWithUser,
    @Response({ passthrough: true }) res: express.Response,
  ) {
    await this.authService.revokeAllRefreshTokens(req.user.id);

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { message: 'All tokens revoked successfully' };
  }
}
