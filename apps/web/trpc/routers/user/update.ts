import { z } from 'zod';
import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const updateInputSchema = z.object({
  id: z.string(),
  data: z.object({
    name: z.string().optional(),
    image: z.string().optional(),
  }),
});

export const update = protectedProcedure
  .input(updateInputSchema)
  .mutation(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.user.update(input.id, input.data);
  });
