import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto, RefreshTokenDto, RevokeTokenDto } from './dto/auth.dto';
import { AuthGuard } from './guards/auth.guard';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Post('otp/verify')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @Post('revoke')
  @UseGuards(AuthGuard)
  async revokeToken(
    @Body() revokeTokenDto: RevokeTokenDto,
    @Request() req: RequestWithUser,
  ) {
    return this.authService.revokeRefreshToken(
      revokeTokenDto.refreshToken,
      req.user.id,
    );
  }

  @Post('revoke-all')
  @UseGuards(AuthGuard)
  async revokeAllTokens(@Request() req: RequestWithUser) {
    return this.authService.revokeAllRefreshTokens(req.user.id);
  }
}


