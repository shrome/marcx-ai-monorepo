import { z } from 'zod';
import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const getSessionsInputSchema = z.object({
  id: z.string(),
});

export const getSessions = protectedProcedure
  .input(getSessionsInputSchema)
  .query(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.company.getSessions(input.id);
  });
