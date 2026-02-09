import { publicProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

export const refreshAccessToken = publicProcedure.mutation(async ({ ctx }) => {
  const backend = createBackendClient();
  const response = await backend.auth.refreshToken();

  // Set the new access token in HTTP response cookie
  ctx.responseHeaders.setCookie('accessToken', response.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
  });

  return response;
});
