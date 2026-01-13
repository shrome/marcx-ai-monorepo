import { z } from "zod"
import { router, protectedProcedure } from "../init"
import { mockStore, generateId } from "@/lib/db/mock-store"
import type { ChatSession, ChatMessage } from "@marcx/db"

export const chatRouter = router({
  // Get all sessions for user
  getSessions: protectedProcedure.query(({ ctx }) => {
    const userSessions: ChatSession[] = []
    mockStore.sessions.forEach((session) => {
      if (session.userId === ctx.user.id) {
        userSessions.push(session)
      }
    })
    return userSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }),

  // Create new session
  createSession: protectedProcedure.input(z.object({ title: z.string().optional() })).mutation(({ ctx, input }) => {
    const sessionId = generateId()
    const session: ChatSession = {
      id: sessionId,
      userId: ctx.user.id,
      title: input.title || "New Chat",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockStore.sessions.set(sessionId, session)
    mockStore.messages.set(sessionId, [])
    return session
  }),

  // Get messages for session
  getMessages: protectedProcedure.input(z.object({ sessionId: z.string() })).query(({ input }) => {
    return mockStore.messages.get(input.sessionId) || []
  }),

  // Add message to session
  addMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        attachments: z
          .array(
            z.object({
              name: z.string(),
              url: z.string(),
              type: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(({ input }) => {
      const messageId = generateId()
      const message: ChatMessage = {
        id: messageId,
        sessionId: input.sessionId,
        role: input.role,
        content: input.content,
        attachments: input.attachments || null,
        createdAt: new Date(),
      }

      const messages = mockStore.messages.get(input.sessionId) || []
      messages.push(message)
      mockStore.messages.set(input.sessionId, messages)

      // Update session title if first user message
      if (input.role === "user" && messages.length === 1) {
        const session = mockStore.sessions.get(input.sessionId)
        if (session) {
          session.title = input.content.slice(0, 50) + (input.content.length > 50 ? "..." : "")
          session.updatedAt = new Date()
        }
      }

      return message
    }),

  // Delete session
  deleteSession: protectedProcedure.input(z.object({ sessionId: z.string() })).mutation(({ input }) => {
    mockStore.sessions.delete(input.sessionId)
    mockStore.messages.delete(input.sessionId)
    return { success: true }
  }),

  // Update session title
  updateSessionTitle: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        title: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const session = mockStore.sessions.get(input.sessionId)
      if (session) {
        session.title = input.title
        session.updatedAt = new Date()
      }
      return session
    }),
})
