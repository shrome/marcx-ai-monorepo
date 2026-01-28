"use client"

import { useState, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { ChatSidebar } from "./ChatSidebar"
import { ChatMessages } from "./ChatMessages"
import { ChatInput } from "./ChatInput"
import { useAuth } from "@/components/AuthContext"
import { trpc } from "@/trpc/client"
import { toast } from "sonner"
import type { ChatSession } from "@marcx/db"

interface Attachment {
  name: string
  url: string
  type: string
}

export function ChatContainer() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const createSession = trpc.chat.createSession.useMutation()
  const deleteSession = trpc.chat.deleteSession.useMutation()
  const updateTitle = trpc.chat.updateSessionTitle.useMutation()

  const { messages, status, setMessages } = useChat({
    api: "/api/chat",
    onError: (error) => {
      toast.error("Failed to get response from AI");
    },
  });

  const isLoading = status === "streaming";

  // Create initial session on mount
  useEffect(() => {
    if (user && sessions.length === 0) {
      handleNewSession()
    }
  }, [user])

  const handleNewSession = async () => {
    try {
      const session = await createSession.mutateAsync({})
      setSessions((prev) => [session, ...prev])
      setCurrentSessionId(session.id)
      setMessages([])
    } catch (error) {
      toast.error("Failed to create new chat")
    }
  }

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id)
    // In a real app, you'd fetch messages for this session
    setMessages([])
  }

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession.mutateAsync({ sessionId: id })
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (currentSessionId === id) {
        const remaining = sessions.filter((s) => s.id !== id)
        if (remaining.length > 0) {
          setCurrentSessionId(remaining[0].id)
        } else {
          handleNewSession()
        }
      }
    } catch (error) {
      toast.error("Failed to delete conversation")
    }
  }

  const handleRenameSession = async (id: string, title: string) => {
    try {
      await updateTitle.mutateAsync({ sessionId: id, title })
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)))
    } catch (error) {
      toast.error("Failed to rename conversation")
    }
  }

  const handleSend = async (content: string, attachments: Attachment[]) => {
    // Update session title if it's the first message
    if (messages.length === 0 && currentSessionId) {
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "")
      setSessions((prev) => prev.map((s) => (s.id === currentSessionId ? { ...s, title } : s)))
    }

    toast.success("Message sent (mock)")
    // await sendMessage({
    //   role: "user",
    //   content,
    //   experimental_attachments:
    //     attachments.length > 0
    //       ? attachments.map((a) => ({
    //           name: a.name,
    //           url: a.url,
    //           contentType: a.type,
    //         }))
    //       : undefined,
    // })
  }

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatMessages messages={messages} isLoading={isLoading} />
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </main>
    </div>
  )
}
