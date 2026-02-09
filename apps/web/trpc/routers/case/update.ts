import { z } from 'zod';
import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const updateInputSchema = z.object({
  id: z.string(),
  data: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    clientName: z.string().optional(),
    status: z.enum(['open', 'in_progress', 'closed']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),
});

export const update = protectedProcedure
  .input(updateInputSchema)
  .mutation(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.case.update(input.id, input.data);
  });
