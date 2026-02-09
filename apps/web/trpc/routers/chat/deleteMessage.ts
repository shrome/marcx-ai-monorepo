import { z } from 'zod';
import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const deleteMessageInputSchema = z.object({
  messageId: z.string(),
});

export const deleteMessage = protectedProcedure
  .input(deleteMessageInputSchema)
  .mutation(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.chat.deleteMessage(input.messageId);
  });
