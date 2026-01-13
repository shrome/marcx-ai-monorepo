import { z } from "zod"
import { router, publicProcedure } from "../init"
import { mockStore, generateId } from "@/lib/db/mock-store"
import { TRPCError } from "@trpc/server"

export const authRouter = router({
  // Get current user
  getUser: publicProcedure.query(({ ctx }) => {
    return ctx.user
  }),

  // Register with email
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(2),
        password: z.string().min(6),
      }),
    )
    .mutation(async ({ input }) => {
      const existingUser = Array.from(mockStore.users.values()).find((u) => u.email === input.email)

      if (existingUser) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already exists" })
      }

      const userId = generateId()
      const user = {
        id: userId,
        email: input.email,
        name: input.name,
        image: null,
        passwordHash: input.password, // In real app, hash with bcrypt
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStore.users.set(userId, user)

      // Generate OTP for verification
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      mockStore.otpCodes.set(input.email, {
        email: input.email,
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      })

      console.log(`[Demo] OTP for ${input.email}: ${otp}`)

      return { success: true, message: "Check console for OTP code (demo mode)" }
    }),

  // Login with email/password
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const user = Array.from(mockStore.users.values()).find((u) => u.email === input.email)

      if (!user || user.passwordHash !== input.password) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" })
      }

      mockStore.currentUser = user
      return { success: true, user: { id: user.id, email: user.email, name: user.name } }
    }),

  // Send OTP for login
  sendOtp: publicProcedure.input(z.object({ email: z.string().email() })).mutation(async ({ input }) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    mockStore.otpCodes.set(input.email, {
      email: input.email,
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })

    console.log(`[Demo] OTP for ${input.email}: ${otp}`)

    return { success: true, message: "OTP sent (check console in demo mode)" }
  }),

  // Verify OTP
  verifyOtp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().length(6),
      }),
    )
    .mutation(async ({ input }) => {
      const stored = mockStore.otpCodes.get(input.email)

      if (!stored || stored.code !== input.code) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid OTP" })
      }

      if (new Date() > stored.expiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "OTP expired" })
      }

      // Find or create user
      let user = Array.from(mockStore.users.values()).find((u) => u.email === input.email)

      if (!user) {
        const userId = generateId()
        user = {
          id: userId,
          email: input.email,
          name: input.email.split("@")[0],
          image: null,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        mockStore.users.set(userId, user)
      } else {
        user.emailVerified = true
      }

      mockStore.currentUser = user
      mockStore.otpCodes.delete(input.email)

      return { success: true, user: { id: user.id, email: user.email, name: user.name } }
    }),

  // Logout
  logout: publicProcedure.mutation(async () => {
    mockStore.currentUser = null
    return { success: true }
  }),
})
