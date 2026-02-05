import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Response,
  Get,
} from '@nestjs/common';
import * as express from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import {
  RegisterDto,
  LoginDto,
  SendOtpDto,
  VerifyOtpDto,
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
  constructor(
    private readonly authService: AuthService,
  ) {}

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
    @Response({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    console.log('Refresh token received:', refreshToken);
    const result = await this.authService.refreshAccessToken(refreshToken);

    // Set new access token cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    console.log('New access token set in cookie');
    return { message: 'Token refreshed successfully' };
  }

  @Post('revoke')
  @UseGuards(AuthGuard)
  async revokeToken(
    @Request() req: RequestWithUser,
    @Response({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken, req.user.id);
    }

    // Clear cookies
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
