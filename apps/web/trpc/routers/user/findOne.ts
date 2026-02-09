import { z } from 'zod';
import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const findOneInputSchema = z.object({
  id: z.string(),
});

export const findOne = protectedProcedure
  .input(findOneInputSchema)
  .query(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.user.findOne(input.id);
  });
