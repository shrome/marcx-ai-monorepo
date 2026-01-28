import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { db, eq } from '@marcx/db';
import { user } from '@marcx/db/schema';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
}

interface RequestWithCookies {
  cookies?: {
    accessToken?: string;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from cookie
        (request: RequestWithCookies) => {
          return request?.cookies?.accessToken ?? null;
        },
        // Fallback to Authorization header for backward compatibility
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    // Verify the user still exists and hasn't been deleted
    const foundUser = await db.query.user.findFirst({
      where: eq(user.id, payload.sub),
    });

    if (!foundUser) {
      throw new UnauthorizedException('User not found');
    }

    // Return user object that will be attached to request.user
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
