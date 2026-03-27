import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"

export const createTRPCContext = async () => {
  return { user: null as null | { id: string; email: string } }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" })
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  })
})
