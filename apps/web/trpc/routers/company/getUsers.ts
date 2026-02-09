import { z } from 'zod';
import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const getUsersInputSchema = z.object({
  id: z.string(),
});

export const getUsers = protectedProcedure
  .input(getUsersInputSchema)
  .query(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.company.getUsers(input.id);
  });
