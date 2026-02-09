import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

export const revokeToken = protectedProcedure.mutation(async ({ ctx }) => {
  const backend = createBackendClient();
  const response = await backend.auth.revokeToken();
  
  // Clear cookies in HTTP response
  ctx.responseHeaders.deleteCookie('accessToken');
  ctx.responseHeaders.deleteCookie('refreshToken');
  
  return response;
});
