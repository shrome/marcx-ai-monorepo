import { z } from 'zod';
import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const createInputSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['ACCOUNTING', 'MARKETING']),
  description: z.string().optional(),
  website: z.string().optional(),
});

export const create = protectedProcedure
  .input(createInputSchema)
  .mutation(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.company.create(input);
  });
