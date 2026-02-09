import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

export const getCurrentUser = protectedProcedure.query(async ({ ctx }) => {
  // User session is validated by protectedProcedure middleware,
  // but we fetch fresh data from backend for latest user information
  const backend = createBackendClient();
  const response = await backend.user.getCurrentUser();
  
  return response.user;
});
