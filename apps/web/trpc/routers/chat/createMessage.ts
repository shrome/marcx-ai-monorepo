import { z } from 'zod';
import { protectedProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const createMessageInputSchema = z.object({
  sessionId: z.string(),
  data: z.object({
    content: z.string(),
  }),
  // Note: File uploads should be handled directly via the backend client
  // as tRPC doesn't natively support File objects over the wire
});

export const createMessage = protectedProcedure
  .input(createMessageInputSchema)
  .mutation(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.chat.createMessage(input.sessionId, input.data);
  });
