"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, User, FileText, ImageIcon } from "lucide-react"
import type { Message } from "@/lib/backend/types"
import ReactMarkdown from "react-markdown"

interface ChatMessagesProps {
  messages: Message[]
  isLoading?: boolean
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">How can I help you today?</h2>
          <p className="text-muted-foreground">
            Send a message or upload a file to get started. I can help with questions, writing, analysis, and more.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.map((message) => (
        <div key={message.id} className={cn("flex gap-3", message.role === "USER" && "flex-row-reverse")}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className={cn(message.role === "USER" ? "bg-primary text-primary-foreground" : "bg-muted")}>
              {message.role === "USER" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className={cn("flex flex-col gap-2 max-w-[80%]", message.role === "USER" && "items-end")}>
            {/* Attachments */}
            {message.files && message.files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {message.files.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border bg-card p-2 text-sm hover:bg-accent transition-colors"
                  >
                    {file.type?.startsWith("image/") ? (
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="max-w-32 truncate">{file.name}</span>
                  </a>
                ))}
              </div>
            )}
            {/* Message content */}
            <div
              className={cn(
                "rounded-2xl px-4 py-2",
                message.role === "USER" ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {message.role === "ASSISTANT" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-muted">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="rounded-2xl bg-muted px-4 py-2">
            <div className="flex gap-1">
              <span
                className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
