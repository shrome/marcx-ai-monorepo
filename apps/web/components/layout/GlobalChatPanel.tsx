"use client"

import { useState, useEffect, useRef } from "react"
import { X, Sparkles, Paperclip, ArrowUp, Loader2, Bot, User, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { useLedgerChat } from "@/hooks/useLedgerChat"
import { useLedger } from "@/hooks/useLedgerQueries"
import { cn } from "@/lib/utils"

const SUGGESTED_PROMPTS = [
  "Summarise my cashflow this month",
  "Are we still financially healthy?",
  "How much receivables are we having?",
  "Any payables pending?",
]

interface GlobalChatPanelProps {
  onClose: () => void
  ledgerId?: string
}

export function GlobalChatPanel({ onClose, ledgerId }: GlobalChatPanelProps) {
  const [input, setInput] = useState("")
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: ledger } = useLedger(ledgerId ?? "")
  const { messages, isLoading, initialized, sendMessage, clearSession } = useLedgerChat(
    ledgerId ?? "",
    ledger?.fiscalYear,
  )

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (content: string) => {
    const text = content.trim()
    if (!text && pendingFiles.length === 0) return
    if (!ledgerId) {
      toast.error("No ledger selected")
      return
    }

    const filesToSend = [...pendingFiles]
    setInput("")
    setPendingFiles([])

    try {
      await sendMessage(text, filesToSend.length > 0 ? filesToSend : undefined)
    } catch {
      toast.error("Failed to send message. Please try again.")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const valid = files.filter((f) => {
      if (f.size > 50 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 50MB limit`)
        return false
      }
      return true
    })
    setPendingFiles((prev) => [...prev, ...valid])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const noLedger = !ledgerId
  const empty = initialized && messages.length === 0

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-900">Ask PIO</span>
            {ledger && (
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                {ledger.name} · FY {ledger.fiscalYear}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearSession}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
              aria-label="Clear chat"
              title="Clear chat history"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Message history */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {noLedger ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400 text-center">
              Open a ledger to start chatting with PIO.
            </p>
          </div>
        ) : empty ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400 text-center">
              Ask PIO about your financial data.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                msg.role === "user" ? "bg-[#03234B]" : "bg-gradient-to-br from-blue-500 to-indigo-600",
              )}>
                {msg.role === "user"
                  ? <User className="h-3 w-3 text-white" />
                  : <Sparkles className="h-3 w-3 text-white" />
                }
              </div>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                msg.role === "user"
                  ? "bg-[#03234B] text-white rounded-tr-sm"
                  : "bg-gray-100 text-gray-800 rounded-tl-sm",
              )}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2">
              <div className="flex gap-1 items-center h-4">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested prompts — shown only when no messages */}
      {!noLedger && empty && (
        <div className="px-4 pb-2 space-y-1.5 flex-shrink-0">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="w-full text-left px-3 py-2 text-xs text-gray-600 border border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Pending files */}
      {pendingFiles.length > 0 && (
        <div className="px-4 pb-1 flex gap-1.5 flex-wrap flex-shrink-0">
          {pendingFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 text-xs text-gray-600">
              <span className="max-w-24 truncate">{f.name}</span>
              <button onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 flex-shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="application/pdf,image/*,.csv,.xlsx,.xls,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="relative border border-gray-200 rounded-xl">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={noLedger ? "Open a ledger to chat…" : "Ask about your financial data…"}
            disabled={noLedger || isLoading}
            className="w-full px-3 pt-3 pb-10 text-sm resize-none outline-none rounded-xl min-h-[80px] disabled:opacity-50"
            rows={3}
          />
          <div className="absolute bottom-2 left-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={noLedger || isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
            >
              <Paperclip className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-2 right-2">
            <button
              onClick={() => handleSend(input)}
              disabled={noLedger || isLoading || (!input.trim() && pendingFiles.length === 0)}
              className="h-6 w-6 rounded-md bg-gray-900 flex items-center justify-center text-white disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              {isLoading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <ArrowUp className="h-3.5 w-3.5" />
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
