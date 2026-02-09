import { z } from 'zod';
import { publicProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const loginInputSchema = z.object({
  email: z.string().email(),
});

export const login = publicProcedure
  .input(loginInputSchema)
  .mutation(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.auth.login(input);
  });
