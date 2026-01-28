import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  RegisterDto,
  LoginDto,
  SendOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { db, eq, and } from '@marcx/db';
import { user, credential, verificationToken } from '@marcx/db/schema';
import type { JwtPayload } from './strategies/jwt.strategy';
import { CACHE_MANAGER, type Cache } from '@nestjs/cache-manager';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async generateTokenPair(userId: string, email: string, role: string) {
    // Generate short-lived access token (15 minutes)
    const accessPayload: JwtPayload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: '15m',
    });

    // Generate long-lived refresh token (7 days)
    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const tokenHash = await bcrypt.hash(refreshTokenValue, 10);

    const tokenData = { userId, email, role, tokenHash };
    const ttl = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    // Store with two keys for easy lookup:
    // 1. By userId (for revoke all)
    const userKey = `refresh_token:${userId}:${refreshTokenValue}`;
    await this.cacheManager.set(userKey, tokenData, ttl);

    // 2. By token value (for refresh)
    const lookupKey = `refresh_token_lookup:${refreshTokenValue}`;
    await this.cacheManager.set(lookupKey, tokenData, ttl);

    // 3. Maintain list of user's tokens for bulk revocation
    const userTokenListKey = `user_tokens:${userId}`;
    const existingTokens =
      (await this.cacheManager.get<string[]>(userTokenListKey)) || [];
    existingTokens.push(refreshTokenValue);
    await this.cacheManager.set(userTokenListKey, existingTokens, ttl);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, name } = registerDto;

    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Create user
    const [newUser] = await db
      .insert(user)
      .values({
        email,
        name,
        emailVerified: false,
        role: 'COMPANY_OWNER',
      })
      .returning();

    // Create credential (no password/secret needed for OTP-only flow)
    const [newCredential] = await db
      .insert(credential)
      .values({
        userId: newUser.id,
        type: 'EMAIL',
        identifier: email,
        secret: null, // No password stored
        provider: null,
      })
      .returning();

    // Generate 6-digit OTP for email verification
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const tokenHash = await bcrypt.hash(code, 10);

    // Store verification token in database
    await db.insert(verificationToken).values({
      credentialId: newCredential.id,
      purpose: 'EMAIL_VERIFICATION',
      tokenHash,
      expiresAt,
      used: false,
      attempts: 0,
    });

    // TODO: Send email with OTP code
    console.log(`Registration OTP for ${email}: ${code}`);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        emailVerified: false,
      },
      message: 'Registration successful. Please verify your email with the OTP sent.',
    };
  }

  async login(loginDto: LoginDto) {
    const { email } = loginDto;

    // Find credential by email with user relation
    const userCredential = await db.query.credential.findFirst({
      where: and(
        eq(credential.identifier, email),
        eq(credential.type, 'EMAIL'),
      ),
      with: {
        user: true,
      },
    });

    if (!userCredential) {
      throw new UnauthorizedException('User not found');
    }

    // Check if email is verified
    if (!userCredential.user.emailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    // Generate 6-digit OTP for login
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const tokenHash = await bcrypt.hash(code, 10);

    // Store verification token in database
    await db.insert(verificationToken).values({
      credentialId: userCredential.id,
      purpose: 'LOGIN',
      tokenHash,
      expiresAt,
      used: false,
      attempts: 0,
    });

    // TODO: Send email with OTP code
    console.log(`Login OTP for ${email}: ${code}`);

    return {
      message: 'OTP sent to your email. Please verify to complete login.',
    };
  }

  async sendOtp(sendOtpDto: SendOtpDto) {
    const { email } = sendOtpDto;

    // Find credential by email
    const userCredential = await db.query.credential.findFirst({
      where: and(
        eq(credential.identifier, email),
        eq(credential.type, 'EMAIL'),
      ),
    });

    if (!userCredential) {
      throw new UnauthorizedException('User not found');
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const tokenHash = await bcrypt.hash(code, 10);

    // Store verification token in database
    await db.insert(verificationToken).values({
      credentialId: userCredential.id,
      purpose: 'LOGIN',
      tokenHash,
      expiresAt,
      used: false,
      attempts: 0,
    });

    // TODO: Send email with OTP code
    console.log(`OTP for ${email}: ${code}`);

    return { message: 'OTP sent successfully' };
  }

  async verifyRegistrationOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, code } = verifyOtpDto;

    // Find credential by email
    const userCredential = await db.query.credential.findFirst({
      where: and(
        eq(credential.identifier, email),
        eq(credential.type, 'EMAIL'),
      ),
      with: {
        user: true,
        verificationTokens: {
          where: and(
            eq(verificationToken.purpose, 'EMAIL_VERIFICATION'),
            eq(verificationToken.used, false),
          ),
          orderBy: (verificationToken, { desc }) => [
            desc(verificationToken.createdAt),
          ],
          limit: 1,
        },
      },
    });

    if (!userCredential || !userCredential.verificationTokens[0]) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const token = userCredential.verificationTokens[0];

    if (token.used) {
      throw new UnauthorizedException('OTP already used');
    }

    if (new Date() > token.expiresAt) {
      throw new UnauthorizedException('OTP expired');
    }

    // Verify OTP code
    const isCodeValid = await bcrypt.compare(code, token.tokenHash);
    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark OTP as used
    await db
      .update(verificationToken)
      .set({ used: true })
      .where(eq(verificationToken.id, token.id));

    // Update user email verification
    const [updatedUser] = await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.id, userCredential.user.id))
      .returning();

    // Generate access and refresh tokens to log user in
    const tokens = await this.generateTokenPair(
      userCredential.user.id,
      userCredential.user.email,
      userCredential.user.role,
    );

    return {
      ...tokens,
      user: updatedUser
        ? {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            emailVerified: updatedUser.emailVerified,
            companyId: updatedUser.companyId,
          }
        : null,
      message: 'Email verified successfully. You are now logged in.',
      requiresCompanySetup: !updatedUser?.companyId,
    };
  }

  async verifyLoginOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, code } = verifyOtpDto;

    // Find credential by email
    const userCredential = await db.query.credential.findFirst({
      where: and(
        eq(credential.identifier, email),
        eq(credential.type, 'EMAIL'),
      ),
      with: {
        user: true,
        verificationTokens: {
          where: and(
            eq(verificationToken.purpose, 'LOGIN'),
            eq(verificationToken.used, false),
          ),
          orderBy: (verificationToken, { desc }) => [
            desc(verificationToken.createdAt),
          ],
          limit: 1,
        },
      },
    });

    if (!userCredential || !userCredential.verificationTokens[0]) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const token = userCredential.verificationTokens[0];

    if (token.used) {
      throw new UnauthorizedException('OTP already used');
    }

    if (new Date() > token.expiresAt) {
      throw new UnauthorizedException('OTP expired');
    }

    // Verify OTP code
    const isCodeValid = await bcrypt.compare(code, token.tokenHash);
    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark OTP as used
    await db
      .update(verificationToken)
      .set({ used: true })
      .where(eq(verificationToken.id, token.id));

    // Generate access and refresh tokens
    const tokens = await this.generateTokenPair(
      userCredential.user.id,
      userCredential.user.email,
      userCredential.user.role,
    );

    return {
      ...tokens,
      user: {
        id: userCredential.user.id,
        email: userCredential.user.email,
        name: userCredential.user.name,
        role: userCredential.user.role,
        emailVerified: userCredential.user.emailVerified,
        companyId: userCredential.user.companyId,
      },
      message: 'Login successful',
      requiresCompanySetup: !userCredential.user.companyId,
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      // Verify the user still exists
      const foundUser = await db.query.user.findFirst({
        where: eq(user.id, payload.sub),
      });

      if (!foundUser) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async refreshAccessToken(refreshTokenValue: string) {
    // Try to get token directly by constructing potential keys
    // Since we don't know the exact userId, we need to try a workaround
    // In production with Redis, we'd use SCAN or KEYS command

    // For now, we'll use a simpler approach: store tokens with a reverse lookup
    // Get token data directly if it exists
    const reverseKey = `refresh_token_lookup:${refreshTokenValue}`;
    const lookupData = await this.cacheManager.get<{
      userId: string;
      email: string;
      role: string;
      tokenHash: string;
    }>(reverseKey);

    if (!lookupData) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Verify token hash
    const isValid = await bcrypt.compare(
      refreshTokenValue,
      lookupData.tokenHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Verify user still exists
    const foundUser = await db.query.user.findFirst({
      where: eq(user.id, lookupData.userId),
    });

    if (!foundUser) {
      // Clean up invalid token
      await this.cacheManager.del(reverseKey);
      throw new UnauthorizedException('User not found');
    }

    // Generate new access token
    const accessPayload: JwtPayload = {
      sub: lookupData.userId,
      email: lookupData.email,
      role: lookupData.role,
    };
    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: '15m',
    });

    return {
      accessToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  async revokeRefreshToken(refreshTokenValue: string, userId: string) {
    // Delete both keys
    const userKey = `refresh_token:${userId}:${refreshTokenValue}`;
    const lookupKey = `refresh_token_lookup:${refreshTokenValue}`;

    const tokenData = await this.cacheManager.get(lookupKey);

    if (!tokenData) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await Promise.all([
      this.cacheManager.del(userKey),
      this.cacheManager.del(lookupKey),
    ]);

    // Remove from user's token list
    const userTokenListKey = `user_tokens:${userId}`;
    const tokenList =
      (await this.cacheManager.get<string[]>(userTokenListKey)) || [];
    const updatedList = tokenList.filter(
      (token) => token !== refreshTokenValue,
    );

    if (updatedList.length > 0) {
      await this.cacheManager.set(
        userTokenListKey,
        updatedList,
        7 * 24 * 60 * 60 * 1000,
      );
    } else {
      await this.cacheManager.del(userTokenListKey);
    }

    return { message: 'Refresh token revoked successfully' };
  }

  async revokeAllRefreshTokens(userId: string) {
    // Get list of all user's refresh tokens
    const userTokenListKey = `user_tokens:${userId}`;
    const tokenList =
      (await this.cacheManager.get<string[]>(userTokenListKey)) || [];

    if (tokenList.length > 0) {
      // Delete all tokens
      const deletePromises = tokenList.flatMap((tokenValue) => [
        this.cacheManager.del(`refresh_token:${userId}:${tokenValue}`),
        this.cacheManager.del(`refresh_token_lookup:${tokenValue}`),
      ]);

      await Promise.all(deletePromises);
      // Clear the token list
      await this.cacheManager.del(userTokenListKey);
    }

    return { message: 'All refresh tokens revoked successfully' };
  }
}
