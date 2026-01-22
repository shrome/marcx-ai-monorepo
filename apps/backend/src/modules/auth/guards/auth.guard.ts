import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  // The JWT strategy will automatically handle token extraction,
  // validation, and attaching the user to the request
}
