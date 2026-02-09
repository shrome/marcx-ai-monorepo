import { z } from 'zod';
import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const createInputSchema = z.object({
  type: z.enum(['CHAT', 'CASE']),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  companyId: z.string().optional(),
});

export const create = protectedProcedure
  .input(createInputSchema)
  .mutation(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.session.create(input);
  });
