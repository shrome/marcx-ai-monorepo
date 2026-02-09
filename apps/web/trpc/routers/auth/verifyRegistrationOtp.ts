import { z } from "zod";
import { publicProcedure } from "@/trpc/init";
import { createBackendClient } from "@/lib/backend";

const verifyOtpInputSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

export const verifyRegistrationOtp = publicProcedure
  .input(verifyOtpInputSchema)
  .mutation(async ({ input, ctx }) => {
    const backend = createBackendClient();
    const response = await backend.auth.verifyRegistrationOtp(input);

    // Set cookies in HTTP response
    ctx.responseHeaders.setCookie("accessToken", response.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
    });

    ctx.responseHeaders.setCookie("refreshToken", response.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  });
