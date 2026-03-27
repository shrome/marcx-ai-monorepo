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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user (sends verification OTP)' })
  @ApiResponse({ status: 201, description: 'OTP sent to email' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Start login flow (sends OTP to email)' })
  @ApiResponse({ status: 201, description: 'OTP sent to email' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('otp/send')
  @ApiOperation({ summary: 'Resend OTP to email' })
  @ApiResponse({ status: 201, description: 'OTP sent' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }

  @Post('register/verify')
  @ApiOperation({ summary: 'Verify registration OTP and get tokens' })
  @ApiResponse({ status: 201, description: 'Authenticated — tokens set in cookies' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyRegistrationOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Response({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.verifyRegistrationOtp(verifyOtpDto);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @Post('login/verify')
  @ApiOperation({ summary: 'Verify login OTP and get tokens' })
  @ApiResponse({ status: 201, description: 'Authenticated — tokens set in cookies' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyLoginOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Response({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.verifyLoginOtp(verifyOtpDto);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 201, description: 'New access token set in cookie' })
  @ApiResponse({ status: 401, description: 'Missing or invalid refresh token' })
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

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    console.log('New access token set in cookie');
    return { message: 'Token refreshed successfully' };
  }

  @Post('revoke')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Revoke current refresh token and clear cookies' })
  @ApiResponse({ status: 201, description: 'Token revoked, cookies cleared' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeToken(
    @Request() req: RequestWithUser,
    @Response({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken, req.user.id);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { message: 'Token revoked successfully' };
  }

  @Post('revoke-all')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Revoke all refresh tokens for current user' })
  @ApiResponse({ status: 201, description: 'All tokens revoked, cookies cleared' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeAllTokens(
    @Request() req: RequestWithUser,
    @Response({ passthrough: true }) res: express.Response,
  ) {
    await this.authService.revokeAllRefreshTokens(req.user.id);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { message: 'All tokens revoked successfully' };
  }
}

interface RequestWithCookies extends Request {
  cookies?: {
    accessToken?: string;
    refreshToken?: string;
  };
}
