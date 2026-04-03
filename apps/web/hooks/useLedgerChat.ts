'use client'

import { useState, useCallback, useEffect } from 'react'
import { createBackendClient } from '@/lib/backend'

const backend = createBackendClient()

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

function sessionStorageKey(ledgerId: string) {
  return `ledger-chat-${ledgerId}`
}

function sessionIdKey(ledgerId: string) {
  return `ledger-chat-session-${ledgerId}`
}

function loadPersistedState(ledgerId: string): { sessionId: string | null; messages: ChatMessage[] } {
  if (typeof window === 'undefined') return { sessionId: null, messages: [] }
  try {
    const sessionId = sessionStorage.getItem(sessionIdKey(ledgerId))
    const raw = sessionStorage.getItem(sessionStorageKey(ledgerId))
    const messages: ChatMessage[] = raw ? JSON.parse(raw) : []
    return { sessionId, messages }
  } catch {
    return { sessionId: null, messages: [] }
  }
}

function persistState(ledgerId: string, sessionId: string | null, messages: ChatMessage[]) {
  if (typeof window === 'undefined') return
  try {
    if (sessionId) {
      sessionStorage.setItem(sessionIdKey(ledgerId), sessionId)
    } else {
      sessionStorage.removeItem(sessionIdKey(ledgerId))
    }
    sessionStorage.setItem(sessionStorageKey(ledgerId), JSON.stringify(messages))
  } catch {
    // sessionStorage might be unavailable (e.g. private browsing quota)
  }
}

export function useLedgerChat(ledgerId: string, fiscalYear?: number) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Load from sessionStorage when ledgerId changes
  useEffect(() => {
    if (!ledgerId) return
    const persisted = loadPersistedState(ledgerId)
    setSessionId(persisted.sessionId)
    setMessages(persisted.messages)
    setInitialized(true)
  }, [ledgerId])

  const sendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!content.trim() && (!files || files.length === 0)) return
      if (!ledgerId) return

      const userMessage: ChatMessage = { role: 'user', content, timestamp: Date.now() }
      const nextMessages = [...messages, userMessage]
      setMessages(nextMessages)
      setIsLoading(true)

      try {
        // Ensure we have an AI chat session
        let activeSessionId = sessionId
        if (!activeSessionId) {
          const session = await backend.ai.createAiChatSession({
            title: `Ledger ${ledgerId}`,
            fiscal_year: fiscalYear,
          })
          activeSessionId = session.id as string
          setSessionId(activeSessionId)
          persistState(ledgerId, activeSessionId, nextMessages)
        }

        // Upload files via presign if any
        if (files && files.length > 0) {
          for (const file of files) {
            try {
              const presign = await backend.ai.chatUploadPresign(activeSessionId, {
                filename: file.name,
                contentType: file.type,
              })
              await fetch(presign.url, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
              })
            } catch {
              // File upload failure is non-blocking — message will still be sent
            }
          }
        }

        // Send the text message
        const response = await backend.ai.sendAiChatMessage(activeSessionId, content)
        const aiMessage: ChatMessage = {
          role: 'assistant',
          content: (response.content as string) ?? JSON.stringify(response),
          timestamp: Date.now(),
        }

        const finalMessages = [...nextMessages, aiMessage]
        setMessages(finalMessages)
        persistState(ledgerId, activeSessionId, finalMessages)
      } catch (err) {
        // Append error placeholder so user sees something went wrong
        const errMessage: ChatMessage = {
          role: 'assistant',
          content: '⚠️ Failed to get a response. Please try again.',
          timestamp: Date.now(),
        }
        const withError = [...nextMessages, errMessage]
        setMessages(withError)
        persistState(ledgerId, sessionId, withError)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [ledgerId, sessionId, messages, fiscalYear],
  )

  const clearSession = useCallback(() => {
    if (!ledgerId) return
    setSessionId(null)
    setMessages([])
    persistState(ledgerId, null, [])
  }, [ledgerId])

  return { messages, sessionId, isLoading, initialized, sendMessage, clearSession }
}
