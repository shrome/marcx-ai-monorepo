"use client"

import { useState } from "react"
import { Building2, Users, BarChart2, BookOpen, Plus, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/AuthContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  useCompanyMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
} from "@/hooks/useMemberQueries"
import { useChartOfAccounts, useLlmUsage } from "@/hooks/useAiQueries"
import type { MemberRole } from "@/lib/backend"

const TABS = ["Company", "Members", "Usage", "Chart of Accounts"] as const
type Tab = (typeof TABS)[number]

const ROLE_LABELS: Record<MemberRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  ACCOUNTANT: "Accountant",
  VIEWER: "Viewer",
}

// ─── Company tab ──────────────────────────────────────────────────────────

function CompanyTab() {
  const { user } = useAuth()

  if (!user?.companyId) return (
    <div className="text-sm text-gray-500 py-8 text-center">No company information available.</div>
  )

  return (
    <div className="max-w-lg space-y-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">Company ID</label>
          <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 font-mono">
            {user.companyId}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">Role</label>
          <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900">
            {user.role ?? "Member"}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Contact your account administrator to update company details.
      </p>
    </div>
  )
}

// ─── Members tab ──────────────────────────────────────────────────────────

function MembersTab({ companyId }: { companyId: string }) {
  const { data: members = [], isLoading } = useCompanyMembers(companyId)
  const inviteMember = useInviteMember()
  const updateRole = useUpdateMemberRole()
  const removeMember = useRemoveMember()

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<MemberRole>("ACCOUNTANT")
  const [removeId, setRemoveId] = useState<string | null>(null)

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    try {
      await inviteMember.mutateAsync({ companyId, data: { email: inviteEmail.trim(), role: inviteRole } })
      setInviteEmail("")
      toast.success(`Invite sent to ${inviteEmail}`)
    } catch {
      toast.error("Failed to invite member. Check the email and try again.")
    }
  }

  const handleRoleChange = async (memberId: string, role: MemberRole) => {
    try {
      await updateRole.mutateAsync({ companyId, memberId, data: { role } })
      toast.success("Role updated")
    } catch {
      toast.error("Failed to update role. Cannot remove the only owner.")
    }
  }

  const handleRemove = async () => {
    if (!removeId) return
    try {
      await removeMember.mutateAsync({ companyId, memberId: removeId })
      toast.success("Member removed")
      setRemoveId(null)
    } catch {
      toast.error("Failed to remove member. Cannot remove the only owner.")
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Invite form */}
      <div className="p-4 rounded-xl border border-gray-200 space-y-3">
        <p className="text-sm font-medium text-gray-800">Invite a team member</p>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="name@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            className="flex-1"
          />
          <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as MemberRole)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["ADMIN", "ACCOUNTANT", "VIEWER"] as MemberRole[]).map((r) => (
                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleInvite} disabled={inviteMember.isPending || !inviteEmail.trim()}>
            {inviteMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Members list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No members yet.</div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {(member.user?.name ?? member.user?.email ?? "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {member.user?.name ?? member.user?.email ?? "Unknown"}
                </p>
                <p className="text-xs text-gray-400 truncate">{member.user?.email}</p>
              </div>
              <Select
                value={member.role}
                onValueChange={(v) => handleRoleChange(member.id, v as MemberRole)}
              >
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as MemberRole[]).map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-destructive flex-shrink-0"
                onClick={() => setRemoveId(member.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!removeId} onOpenChange={() => setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke their access immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Usage tab ────────────────────────────────────────────────────────────

function UsageTab() {
  const { data: usage, isLoading } = useLlmUsage()

  if (isLoading) return (
    <div className="space-y-3 max-w-lg">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
    </div>
  )

  if (!usage) return (
    <div className="text-sm text-gray-500 py-8 text-center">No usage data available.</div>
  )

  return (
    <div className="max-w-lg space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
          <p className="text-xs font-medium text-gray-400 mb-1">Total Tokens</p>
          <p className="text-2xl font-bold text-gray-900">{usage.totalTokens.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
          <p className="text-xs font-medium text-gray-400 mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-gray-900">${usage.totalCost.toFixed(4)}</p>
        </div>
      </div>

      {usage.breakdown.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Breakdown by Model</p>
          {usage.breakdown.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{item.model}</p>
                <p className="text-xs text-gray-400">{item.tokens.toLocaleString()} tokens</p>
              </div>
              <p className="text-sm font-semibold text-gray-700">${item.cost.toFixed(4)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Chart of Accounts tab ────────────────────────────────────────────────

function ChartOfAccountsTab() {
  const { data: accounts = [], isLoading } = useChartOfAccounts()

  if (isLoading) return (
    <div className="space-y-3 max-w-2xl">
      {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
    </div>
  )

  if (accounts.length === 0) return (
    <div className="text-sm text-gray-500 py-8 text-center max-w-md">
      No chart of accounts configured yet. Upload a general ledger or ask the AI to set up accounts.
    </div>
  )

  return (
    <div className="max-w-2xl">
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="py-2.5 px-4 text-xs font-medium text-gray-400 text-left">Code</th>
              <th className="py-2.5 px-4 text-xs font-medium text-gray-400 text-left">Name</th>
              <th className="py-2.5 px-4 text-xs font-medium text-gray-400 text-left">Type</th>
              <th className="py-2.5 px-4 text-xs font-medium text-gray-400 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.code} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="py-2.5 px-4 font-mono text-xs text-gray-500">{account.code}</td>
                <td className="py-2.5 px-4 font-medium text-gray-800">{account.name}</td>
                <td className="py-2.5 px-4">
                  <Badge variant="secondary" className="text-xs">{account.type}</Badge>
                </td>
                <td className="py-2.5 px-4 text-xs text-gray-400">{account.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main SettingsPage ────────────────────────────────────────────────────

export function SettingsPage() {
  const { user } = useAuth()
  const companyId = user?.companyId ?? ""
  const [activeTab, setActiveTab] = useState<Tab>("Company")

  const tabIcons: Record<Tab, React.ReactNode> = {
    Company: <Building2 className="h-4 w-4" />,
    Members: <Users className="h-4 w-4" />,
    Usage: <BarChart2 className="h-4 w-4" />,
    "Chart of Accounts": <BookOpen className="h-4 w-4" />,
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your workspace, team and integrations</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-gray-200 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors",
              activeTab === tab
                ? "border-gray-900 text-gray-900 font-medium"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tabIcons[tab]}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Company" && <CompanyTab />}
      {activeTab === "Members" && <MembersTab companyId={companyId} />}
      {activeTab === "Usage" && <UsageTab />}
      {activeTab === "Chart of Accounts" && <ChartOfAccountsTab />}
    </div>
  )
}
