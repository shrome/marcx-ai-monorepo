import { z } from 'zod';
import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const removeInputSchema = z.object({
  id: z.string(),
});

export const remove = protectedProcedure
  .input(removeInputSchema)
  .mutation(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.session.remove(input.id);
  });
