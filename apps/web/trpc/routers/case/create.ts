import { z } from 'zod';
import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const createInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  clientName: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  companyId: z.string(),
  // Note: File uploads should be handled directly via the backend client
  // as tRPC doesn't natively support File objects over the wire
});

export const create = protectedProcedure
  .input(createInputSchema)
  .mutation(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.case.create(input);
  });
