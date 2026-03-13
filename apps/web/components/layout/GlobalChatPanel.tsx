"use client"

import { useState, useEffect } from "react"
import { X, Sparkles, Paperclip, ArrowUp } from "lucide-react"
import { useAuth } from "@/components/AuthContext"
import { useSessions, useCreateChatSession, useCreateMessage } from "@/hooks/useBackendQueries"
import { toast } from "sonner"

const SUGGESTED_PROMPTS = [
  "Summarised my cashflow this month",
  "Are we still financially healthy?",
  "How much receivables are we having?",
  "Payable pending?",
]

interface GlobalChatPanelProps {
  onClose: () => void
}

export function GlobalChatPanel({ onClose }: GlobalChatPanelProps) {
  const { user } = useAuth()
  const [input, setInput] = useState("")
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const { data: sessions = [] } = useSessions()
  const chatSessions = sessions.filter((s) => s.type === "CHAT")
  const createChatSession = useCreateChatSession()
  const createMessage = useCreateMessage()

  useEffect(() => {
    if (user && chatSessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(chatSessions[0].id)
    }
  }, [user, chatSessions.length, currentSessionId])

  const handleSend = async (content: string) => {
    if (!content.trim()) return
    try {
      let sessionId = currentSessionId
      if (!sessionId) {
        const session = await createChatSession.mutateAsync(undefined)
        sessionId = session.id
        setCurrentSessionId(session.id)
      }
      await createMessage.mutateAsync({ sessionId, data: { content } })
      setInput("")
    } catch {
      toast.error("Failed to send message")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Ask PIO</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Empty flex space */}
      <div className="flex-1" />

      {/* Suggested prompts + input */}
      <div className="p-4 space-y-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => setInput(prompt)}
            className="w-full text-left px-3 py-2.5 text-sm text-gray-700 border border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {prompt}
          </button>
        ))}

        <div className="relative border border-gray-200 rounded-xl mt-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your company financial highlights"
            className="w-full px-3 pt-3 pb-10 text-sm resize-none outline-none rounded-xl min-h-[80px]"
            rows={3}
          />
          <div className="absolute bottom-2 left-2">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <Paperclip className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-2 right-2">
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || createMessage.isPending}
              className="h-6 w-6 rounded-md bg-gray-900 flex items-center justify-center text-white disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
