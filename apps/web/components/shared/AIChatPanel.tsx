"use client"

import { useState } from "react"
import { Paperclip, ArrowUp } from "lucide-react"

const SUGGESTED_PROMPTS = [
  "Summarised my cashflow this month",
  "Are we still financially healthy?",
  "How much receivables are we having?",
  "Payable pending?",
]

interface AIChatPanelProps {
  onSend?: (message: string) => void
}

export function AIChatPanel({ onSend }: AIChatPanelProps) {
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input.trim()) return
    onSend?.(input.trim())
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-1" />

      <div className="space-y-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => setInput(prompt)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 border border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
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
              onClick={handleSend}
              disabled={!input.trim()}
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
