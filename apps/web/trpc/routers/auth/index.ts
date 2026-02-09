import { router } from '@/trpc/init';
import { register } from './register';
import { login } from './login';
import { sendOtp } from './sendOtp';
import { verifyRegistrationOtp } from './verifyRegistrationOtp';
import { verifyLoginOtp } from './verifyLoginOtp';
import { logout } from './logout';
import { refreshAccessToken } from './refreshAccessToken';
import { revokeToken } from './revokeToken';
import { revokeAllTokens } from './revokeAllTokens';

export const authRouter = router({
  register,
  login,
  sendOtp,
  verifyRegistrationOtp,
  verifyLoginOtp,
  logout,
  refreshAccessToken,
  revokeToken,
  revokeAllTokens,
});
