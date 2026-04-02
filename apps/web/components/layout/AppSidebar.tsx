"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MessageCircle,
  BookOpen,
  FolderOpen,
  Store,
  Settings,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/AuthContext"
import { useSessions } from "@/hooks/useBackendQueries"

const navItems = [
  { label: "Ask PIO", href: "/chat", icon: MessageCircle },
  { label: "Documents", href: "/documents", icon: FolderOpen },
  { label: "Ledger", href: "/ledger", icon: BookOpen },
]

const bottomItems = [
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { data: sessions } = useSessions()

  const userInitial = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  // Show up to 5 most recent GL sessions in the sidebar
  const ledgerSessions = (sessions ?? [])
    .filter((s) => s.fiscalYear)
    .slice(0, 5)

  return (
    <aside className="w-52 h-full bg-[#f0f0f0] flex flex-col py-3 px-2 overflow-y-auto">
      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const isLedger = item.href === "/ledger"

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all",
                  active
                    ? "bg-white shadow-sm text-gray-900 font-medium"
                    : "text-gray-700 hover:bg-white/60"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>

              {/* Dynamic ledger sessions under Ledger nav item */}
              {isLedger && ledgerSessions.length > 0 && (
                <div className="ml-3 pl-3 border-l border-gray-300 mt-0.5 mb-0.5 space-y-0.5">
                  {ledgerSessions.map((session) => {
                    const sessionActive = pathname === `/ledger/${session.id}`
                    return (
                      <Link
                        key={session.id}
                        href={`/ledger/${session.id}`}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all truncate",
                          sessionActive
                            ? "bg-white shadow-sm text-gray-900 font-medium"
                            : "text-gray-600 hover:bg-white/60 hover:text-gray-800"
                        )}
                      >
                        <ChevronRight className="h-3 w-3 shrink-0 text-gray-400" />
                        <span className="truncate">{session.title}</span>
                        {session.fiscalYear && (
                          <span className="ml-auto shrink-0 text-gray-400">
                            FY{session.fiscalYear}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="space-y-0.5 mt-2 border-t border-gray-200 pt-2">
        {bottomItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all text-[#1a5c3c] hover:bg-white/60"
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all",
            isActive("/profile") ? "bg-white shadow-sm text-gray-900 font-medium" : "text-gray-700 hover:bg-white/60"
          )}
        >
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {userInitial}
          </div>
          <span>Teams</span>
        </Link>
      </div>
    </aside>
  )
}
