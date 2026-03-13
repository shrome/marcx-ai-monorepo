"use client"

import { useState, useEffect } from "react"
import { Sparkles, Paperclip, ArrowUp } from "lucide-react"
import { useAuth } from "@/components/AuthContext"
import { toast } from "sonner"
import {
  useSessions,
  useCreateChatSession,
  useCreateMessage,
} from "@/hooks/useBackendQueries"

const SUGGESTED_PROMPTS = [
  "Summarised my cashflow this month",
  "Are we still financially healthy?",
  "How much receivables are we having?",
  "Payable pending?",
]

const BAR_DATA = [
  { month: "Jan", revenue: 70, expenses: 45 },
  { month: "Feb", revenue: 85, expenses: 55 },
  { month: "Mar", revenue: 60, expenses: 40 },
  { month: "Apr", revenue: 90, expenses: 60 },
  { month: "May", revenue: 75, expenses: 50 },
  { month: "Jun", revenue: 95, expenses: 65 },
]

export function AskPioContainer() {
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

      await createMessage.mutateAsync({
        sessionId,
        data: { content },
      })

      setInput("")
      toast.success("Message sent")
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
    <div className="flex flex-col h-full">
      {/* Center area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-4">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Summary of the Insight of the day</h1>
        </div>

        {/* Insight box */}
        <div className="border-2 border-gray-900 rounded-xl max-w-2xl w-full p-5">
          {/* Bar chart section */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-3">Revenue &amp; Expenses Over Time</p>
            <div className="flex items-end gap-2 h-24">
              {BAR_DATA.map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex gap-0.5 items-end">
                    <div
                      className="flex-1 bg-blue-500 rounded-sm"
                      style={{ height: `${d.revenue}%` }}
                    />
                    <div
                      className="flex-1 bg-orange-400 rounded-sm"
                      style={{ height: `${d.expenses}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{d.month}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-sm bg-blue-500" />
                <span className="text-[10px] text-gray-500">Revenue</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-sm bg-orange-400" />
                <span className="text-[10px] text-gray-500">Expenses</span>
              </div>
            </div>
          </div>

          {/* Bottom grid */}
          <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
            {/* Cost Breakdown pie */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Cost Breakdown</p>
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 36 36" className="h-16 w-16">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3"
                    strokeDasharray="40 60" strokeDashoffset="25"
                  />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none" stroke="#f97316" strokeWidth="3"
                    strokeDasharray="30 70" strokeDashoffset="-15"
                  />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3"
                    strokeDasharray="20 80" strokeDashoffset="-45"
                  />
                </svg>
                <div className="space-y-1">
                  <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-sm bg-blue-500" /><span className="text-[10px] text-gray-600">Operations 40%</span></div>
                  <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-sm bg-orange-400" /><span className="text-[10px] text-gray-600">Marketing 30%</span></div>
                  <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-sm bg-green-500" /><span className="text-[10px] text-gray-600">Other 20%</span></div>
                </div>
              </div>
            </div>

            {/* Key Financial Metrics */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Key Financial Metrics</p>
              <div className="space-y-1.5">
                {[
                  { label: "Gross Revenue", value: "RM 95,000" },
                  { label: "Total Expenses", value: "RM 63,630" },
                  { label: "Net Profit", value: "RM 31,370" },
                  { label: "Profit Margin", value: "33%" },
                ].map((m) => (
                  <div key={m.label} className="flex justify-between">
                    <span className="text-[11px] text-gray-500">{m.label}</span>
                    <span className="text-[11px] font-medium text-gray-900">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom area */}
      <div className="px-8 pb-8 max-w-2xl mx-auto w-full">
        {/* Suggested prompts */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat input */}
        <div className="relative border border-gray-200 rounded-xl">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask PIO about your financial insights..."
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
