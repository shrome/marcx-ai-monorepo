"use client"
import { Bell, PanelLeft, Sparkles } from "lucide-react"
import { useAuth } from "@/components/AuthContext"

interface AppHeaderProps {
  onToggleSidebar?: () => void
  onToggleChatPanel?: () => void
}

export function AppHeader({ onToggleSidebar, onToggleChatPanel }: AppHeaderProps) {
  const { user } = useAuth()

  return (
    <header className="h-14 bg-primary flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="text-white/60 hover:text-white transition-colors">
          <PanelLeft className="h-5 w-5" />
        </button>
        <span className="text-white font-bold text-sm tracking-wider font-mono">PIO&#123;AI&#125;</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="text-white/60 hover:text-white transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        <div className="px-4 py-1.5 rounded-full border bg-[#03234B] border-white/20 text-white/80 text-sm">
          100 Credits left
        </div>
        {onToggleChatPanel && (
          <button
            onClick={onToggleChatPanel}
            className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 hover:opacity-90 transition-opacity"
            aria-label="Toggle AI chat"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </header>
  )
}
