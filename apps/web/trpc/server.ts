import "server-only"
import { createTRPCContext } from "./init"
import { appRouter } from "./routers/_app"
import { createCallerFactory } from "@trpc/server"

const createCaller = createCallerFactory()(appRouter)

export const api = async () => {
  const context = await createTRPCContext()
  return createCaller(context)
}
