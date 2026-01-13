import { router } from "../init"
import { authRouter } from "./auth"
import { chatRouter } from "./chat"
import { filesRouter } from "./files"

export const appRouter = router({
  auth: authRouter,
  chat: chatRouter,
  files: filesRouter,
})

export type AppRouter = typeof appRouter
