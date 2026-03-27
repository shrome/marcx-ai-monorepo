"use client"

import { useAuth } from "@/components/AuthContext"
import { useRouter } from "next/navigation"
import { LogOut, User, Building2, Mail, Shield, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useCreditBalance, useCreditTransactions } from "@/hooks/useBillingQueries"

export function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const companyId = user?.companyId ?? ""

  const { data: balance, isLoading: balanceLoading } = useCreditBalance(companyId)
  const { data: transactions = [], isLoading: txLoading } = useCreditTransactions(companyId, { limit: 5 })

  const handleLogout = async () => {
    await logout()
    router.push("/login")
    toast.success("Logged out successfully")
  }

  const initial = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?"

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account information</p>
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-5 p-6 rounded-2xl border border-gray-100 bg-gray-50 mb-6">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {initial}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{user?.name || "User"}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
            <Shield className="h-3 w-3" />
            {user?.role ?? "Member"}
          </span>
        </div>
      </div>

      {/* Info cards */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-4 px-5 py-4 rounded-xl border border-gray-100">
          <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Full Name</p>
            <p className="text-sm text-gray-800 font-medium mt-0.5">{user?.name || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-5 py-4 rounded-xl border border-gray-100">
          <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Mail className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Email Address</p>
            <p className="text-sm text-gray-800 font-medium mt-0.5">{user?.email || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-5 py-4 rounded-xl border border-gray-100">
          <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Company</p>
            <p className="text-sm text-gray-800 font-medium mt-0.5">
              {user?.companyId ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Credit balance */}
      {companyId && (
        <div className="mb-8">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Credit Balance</p>
          <div className="p-5 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-gray-500" />
              </div>
              {balanceLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {balance?.balance.toLocaleString("en-MY", { minimumFractionDigits: 2 }) ?? "0.00"}
                  </p>
                  <p className="text-xs text-gray-400">{balance?.currency ?? "MYR"}</p>
                </div>
              )}
            </div>

            {/* Recent transactions */}
            {txLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-400 mb-2">Recent transactions</p>
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-2 py-2 border-t border-gray-100 first:border-0">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === "TOP_UP" ? "bg-green-50" : "bg-red-50"}`}>
                      {tx.type === "TOP_UP" ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 truncate">{tx.note ?? (tx.type === "TOP_UP" ? "Top up" : "AI usage")}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className={`text-xs font-semibold flex-shrink-0 ${tx.type === "TOP_UP" ? "text-green-600" : "text-red-500"}`}>
                      {tx.type === "TOP_UP" ? "+" : "-"}{tx.amount.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 w-full px-5 py-3.5 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  )
}
