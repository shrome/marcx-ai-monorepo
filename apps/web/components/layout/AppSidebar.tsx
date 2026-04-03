"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MessageCircle,
  FolderOpen,
  FilePlus2,
  Store,
  Settings,
  Ellipsis,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/AuthContext"
import { useLedgers } from "@/hooks/useLedgerQueries"
import { CreateLedgerDialog } from "@/components/ledger/CreateLedgerDialog"

const bottomItems = [
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { data: ledgers } = useLedgers()
  const [dialogOpen, setDialogOpen] = useState(false)

  const userInitial = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")
  const recentLedgers = (ledgers ?? []).slice(0, 10)

  return (
    <>
      <CreateLedgerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <aside className="w-52.5 h-full bg-[#ededed] flex flex-col px-2.5 py-3 overflow-y-auto">
      <nav className="space-y-1">
        <Link
          href="/chat"
          className={cn(
            "flex items-center gap-3 rounded-2xl w-full px-3 py-2.5 text-[13px] text-[#161616] transition-colors",
            isActive("/chat") ? "bg-[#f8f8f8] font-medium" : "hover:bg-[#f8f8f8]"
          )}
        >
          <MessageCircle className="h-5 w-5 shrink-0 text-[#333]" />
          <p>New Chat</p>
        </Link>

        <Link
          href="/documents"
          className={cn(
            "flex items-center gap-3 rounded-2xl w-full px-3 py-2.5 text-[13px] text-[#161616] transition-colors",
            isActive("/documents") ? "bg-[#f8f8f8] font-medium" : "hover:bg-[#f8f8f8]"
          )}
        >
          <FolderOpen className="h-5 w-5 shrink-0 text-[#333]" />
          <p>Documents</p>
        </Link>

        <div className="pt-3">
          <div className="mb-1.5 flex items-center justify-between px-1.5">
            <p className="text-[11px] font-semibold text-[#9a9a9a]">Ledger</p>
            <div className="flex items-center gap-1.5 text-[#454545]">
              <button className="rounded p-1 hover:bg-[#f5f5f5]" aria-label="More ledger options">
                <Ellipsis className="h-4 w-4" />
              </button>
              <button
                className="rounded p-1 hover:bg-[#f5f5f5]"
                aria-label="Create ledger"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-0.5">
            {recentLedgers.map((ledger) => {
              const ledgerActive = pathname === `/ledger/${ledger.id}`
              return (
                <Link
                  key={ledger.id}
                  href={`/ledger/${ledger.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl w-full px-3 py-2.5 text-[13px] text-[#1c1c1c] transition-colors",
                    ledgerActive ? "bg-[#f8f8f8] font-medium" : "hover:bg-[#f8f8f8]"
                  )}
                >
                  <FilePlus2 className="h-[18px] w-[18px] shrink-0 text-[#4a4a4a]" />
                  <p className="truncate">{ledger.name}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <div className="mt-auto space-y-1 pt-4">
        {bottomItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] transition-colors hover:bg-[#f8f8f8]",
                item.label === "Marketplace" ? "text-[#1f5f35]" : "text-[#1f355f]"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[#161616]">{item.label}</span>
            </Link>
          )
        })}

        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] transition-colors",
            isActive("/profile") ? "bg-[#f8f8f8] font-medium text-[#161616]" : "text-[#161616] hover:bg-[#f8f8f8]"
          )}
        >
          <div className="h-7 w-7 rounded-full bg-[#0c2c59] flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {userInitial}
          </div>
          <span>Teams</span>
        </Link>
      </div>
    </aside>
    </>
  )
}
