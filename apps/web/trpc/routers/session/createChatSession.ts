import { z } from 'zod';
import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const createChatSessionInputSchema = z
  .object({
    title: z.string().optional(),
  })
  .optional();

export const createChatSession = protectedProcedure
  .input(createChatSessionInputSchema)
  .mutation(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.session.createChatSession(input);
  });
