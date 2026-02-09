import { z } from 'zod';
import { publicProcedure } from '@/trpc/init';
import { createBackendClient } from '@/lib/backend';

const sendOtpInputSchema = z.object({
  email: z.string().email(),
});

export const sendOtp = publicProcedure
  .input(sendOtpInputSchema)
  .mutation(async ({ input }) => {
    const backend = createBackendClient();
    return await backend.auth.sendOtp(input);
  });
