'use client'

import { useMutation } from '@tanstack/react-query'
import { createBackendClient } from '@/lib/backend'

const backend = createBackendClient()

export function useCreateAiChatSession() {
  return useMutation({
    mutationFn: (data?: { title?: string; fiscal_year?: number }) =>
      backend.ai.createAiChatSession(data),
  })
}

export function useSendAiChatMessage() {
  return useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) =>
      backend.ai.sendAiChatMessage(sessionId, message),
  })
}

export function useAiChatUploadPresign() {
  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string
      data: { filename?: string; contentType?: string }
    }) => backend.ai.chatUploadPresign(sessionId, data),
  })
}
