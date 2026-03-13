"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { AppHeader } from "./AppHeader"
import { AppSidebar } from "./AppSidebar"
import { GlobalChatPanel } from "./GlobalChatPanel"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLedgerPage = pathname?.startsWith("/ledger") ?? false

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatPanelOpen, setChatPanelOpen] = useState(false)

  // Close the chat panel when navigating away from ledger pages
  useEffect(() => {
    if (!isLedgerPage) setChatPanelOpen(false)
  }, [isLedgerPage])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onToggleChatPanel={isLedgerPage ? () => setChatPanelOpen((v) => !v) : undefined}
      />
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`transition-all duration-200 overflow-hidden flex-shrink-0 ${
            sidebarOpen ? "w-52" : "w-0"
          }`}
        >
          <AppSidebar />
        </div>
        <main className="flex-1 overflow-auto bg-white">{children}</main>
      </div>

      {/* Global sliding AI chat panel — only available on ledger pages */}
      {isLedgerPage && (
        <div
          className={`fixed top-14 right-0 bottom-0 w-80 z-40 transform transition-transform duration-300 ease-in-out border-l border-gray-200 shadow-xl ${
            chatPanelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <GlobalChatPanel onClose={() => setChatPanelOpen(false)} />
        </div>
      )}
    </div>
  )
}
