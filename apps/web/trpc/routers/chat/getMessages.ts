import { z } from 'zod';
import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const getMessagesInputSchema = z.object({
  sessionId: z.string(),
});

export const getMessages = protectedProcedure
  .input(getMessagesInputSchema)
  .query(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.chat.getMessages(input.sessionId);
  });
