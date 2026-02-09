import { z } from 'zod';
import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const findAllInputSchema = z
  .object({
    type: z.enum(['CHAT', 'CASE']).optional(),
  })
  .optional();

export const findAll = protectedProcedure
  .input(findAllInputSchema)
  .query(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.session.findAll(input?.type);
  });
