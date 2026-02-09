"use client"

import { useState, useEffect } from "react"
import { MessageSquare } from "lucide-react"
import { ChatSidebar } from "./ChatSidebar"
import { ChatMessages } from "./ChatMessages"
import { ChatInput } from "./ChatInput"
import { useAuth } from "@/components/AuthContext"
import { toast } from "sonner"
import { trpc } from "@/trpc/client"
import { createBackendClient } from "@/lib/backend"
import type { Session, Message } from "@/lib/backend/types"

interface Attachment {
  name: string
  url: string
  type: string
}

export function ChatContainer() {
  const { user } = useAuth()
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const utils = trpc.useUtils()

  // Fetch sessions
  const { data: sessions = [], isLoading: sessionsLoading } = trpc.session.findAll.useQuery()
  const chatSessions = sessions.filter((s) => s.type === "CHAT")

  // Fetch messages for current session
  const { data: messages = [], isLoading: messagesLoading } = trpc.chat.getMessages.useQuery(
    { sessionId: currentSessionId || "" },
    { enabled: !!currentSessionId }
  )

  // Mutations
  const createChatSession = trpc.session.createChatSession.useMutation()
  const deleteSession = trpc.session.remove.useMutation()
  const updateSession = trpc.session.update.useMutation()
  const createMessage = trpc.chat.createMessage.useMutation()

  // Create initial session on mount if none exist
  useEffect(() => {
    if (user && chatSessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(chatSessions[0].id)
    }
  }, [user, chatSessions.length, currentSessionId])

  const handleNewSession = async (title?: string) => {
    try {
      const session = await createChatSession.mutateAsync(title ? { title } : {})
      setCurrentSessionId(session.id)
    } catch (error) {
      toast.error("Failed to create new chat")
    }
  }

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id)
  }

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession.mutateAsync({ id })
      if (currentSessionId === id) {
        const remaining = chatSessions.filter((s) => s.id !== id)
        if (remaining.length > 0) {
          setCurrentSessionId(remaining[0].id)
        } else {
          await handleNewSession()
        }
      }
      toast.success("Conversation deleted")
    } catch (error) {
      toast.error("Failed to delete conversation")
    }
  }

  const handleRenameSession = async (id: string, title: string) => {
    try {
      await updateSession.mutateAsync({ id, data: { title } })
      toast.success("Conversation renamed")
    } catch (error) {
      toast.error("Failed to rename conversation")
    }
  }

  const handleSend = async (content: string, attachments: Attachment[]) => {
    if (!currentSessionId) {
      toast.error("No active session")
      return
    }

    try {
      // If there are file attachments, use backend client directly
      // (tRPC doesn't support File uploads over the wire)
      if (attachments.length > 0) {
        const backend = createBackendClient()
        const files = await Promise.all(
          attachments.map(async (a) => {
            const response = await fetch(a.url)
            const blob = await response.blob()
            return new File([blob], a.name, { type: a.type })
          })
        )

        await backend.chat.createMessage(currentSessionId, { content }, files)
        // Invalidate messages query to refetch
        await utils.chat.getMessages.invalidate({ sessionId: currentSessionId })
      } else {
        // No files, use tRPC mutation
        await createMessage.mutateAsync({
          sessionId: currentSessionId,
          data: { content },
        })
      }

      toast.success("Message sent")
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Failed to send message")
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        sessions={chatSessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
      />
      <main className="flex-1 flex flex-col min-w-0">
        {currentSessionId ? (
          <>
            <ChatMessages messages={messages} isLoading={createMessage.isPending || messagesLoading} />
            <ChatInput onSend={handleSend} isLoading={createMessage.isPending} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No chat selected</h2>
              <p className="text-muted-foreground mb-4">
                Create a new chat to get started or select an existing one from the sidebar.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
