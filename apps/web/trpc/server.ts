import "server-only"
import { createTRPCContext, createCallerFactory } from "./init"
import { appRouter } from "./routers/_app"

const createCaller = createCallerFactory(appRouter)

export const api = async () => {
  const context = await createTRPCContext()
  return createCaller(context)
}
