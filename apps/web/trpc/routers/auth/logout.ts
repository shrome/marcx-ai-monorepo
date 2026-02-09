import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

export const logout = protectedProcedure.mutation(async ({ ctx }) => {
  const backend = createBackendClient();
  await backend.auth.logout();
  
  // Clear cookies in HTTP response
  ctx.responseHeaders.deleteCookie('accessToken');
  ctx.responseHeaders.deleteCookie('refreshToken');
  
  return { message: 'Logged out successfully' };
});
