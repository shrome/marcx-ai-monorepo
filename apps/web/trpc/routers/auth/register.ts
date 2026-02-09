import { z } from 'zod';
import { publicProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const registerInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export const register = publicProcedure
  .input(registerInputSchema)
  .mutation(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.auth.register(input);
  });
