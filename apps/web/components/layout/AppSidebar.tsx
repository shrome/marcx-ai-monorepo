"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MessageCircle,
  BookOpen,
  FolderOpen,
  Store,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/AuthContext"

const navItems = [
  { label: "Ask PIO", href: "/chat", icon: MessageCircle },
  { label: "Documents", href: "/documents", icon: FolderOpen },
  {
    label: "Ledger",
    href: "/ledger",
    icon: BookOpen,
    children: [
      { label: "Ledger 1", href: "/ledger/book-1" },
      { label: "General Ledger 2025", href: "/ledger/my-ledger-2025" },
    ],
  },
]

const bottomItems = [
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const userInitial = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <aside className="w-52 h-full bg-[#f0f0f0] flex flex-col py-3 px-2 overflow-y-auto">
      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <div key={item.href}>
              <Link
                href={item.children ? item.children[0].href : item.href}
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
              {item.children && active && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="flex items-center px-3 py-1.5 rounded-xl text-sm text-gray-600 hover:bg-white/60 transition-all"
                    >
                      {child.label}
                    </Link>
                  ))}
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
