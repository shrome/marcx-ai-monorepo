"use client"

import { useState } from "react"
import {
  Pencil,
  Calendar,
  Hash,
  FileText,
  Tag,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  Plus,
  Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskDetailView, type TaskData, type TaskDraft } from "./TaskDetailView"
import { Sheet, SheetContent } from "@/components/ui/sheet"

// ─── Types ────────────────────────────────────────────────────────────────────

const MAIN_TABS = ["Overview", "Tasks"] as const
type MainTab = (typeof MAIN_TABS)[number]

const ENTRY_TABS = [
  { label: "All Entries", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { label: "Debit", icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { label: "Credit", icon: <TrendingDown className="h-3.5 w-3.5" /> },
  { label: "By Cash Account", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
] as const
type EntryTab = (typeof ENTRY_TABS)[number]["label"]

const TASK_TABS = [
  { label: "Activity", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { label: "Debit", icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { label: "Credit", icon: <TrendingDown className="h-3.5 w-3.5" /> },
] as const
type TaskTab = (typeof TASK_TABS)[number]["label"]

interface LedgerRow {
  date: string
  account: string
  description: string
  debit: string
  credit: string
  balance: string
}

interface LedgerGroup {
  name: string
  rows: LedgerRow[]
}

interface LedgerBook {
  name: string
  groups: LedgerGroup[]
}

// ─── Data ────────────────────────────────────────────────────────────────────

const BOOKS_DATA: Record<string, LedgerBook> = {
  "book-1": {
    name: "Ledger 1",
    groups: [
      {
        name: "Cash account",
        rows: [
          { date: "01-02-2026", account: "Cash", description: "Opening Balance", debit: "50,000.00", credit: "-", balance: "50,000.00" },
          { date: "05-02-2026", account: "Accounts Receivable", description: "Client Payment Received", debit: "-", credit: "8,500.00", balance: "56,000.00" },
          { date: "12-02-2026", account: "Accounts Receivable", description: "Client Invoice #1042", debit: "-", credit: "12,000.00", balance: "67,620.00" },
        ],
      },
      {
        name: "Expenses account",
        rows: [
          { date: "01-02-2026", account: "Rent Expense", description: "Office Rent Payment", debit: "2,500.00", credit: "-", balance: "47,500.00" },
          { date: "07-02-2026", account: "Utilities Expense", description: "Electricity & Water", debit: "380.00", credit: "-", balance: "55,620.00" },
          { date: "14-02-2026", account: "Salary Expense", description: "Staff Salaries", debit: "8,000.00", credit: "-", balance: "59,620.00" },
        ],
      },
    ],
  },
  "my-ledger-2025": {
    name: "General Ledger 2025",
    groups: [
      {
        name: "Cash account",
        rows: [
          { date: "01-01-2025", account: "Cash", description: "Opening Balance 2025", debit: "30,000.00", credit: "-", balance: "30,000.00" },
          { date: "10-01-2025", account: "Accounts Receivable", description: "Client A Payment", debit: "-", credit: "15,000.00", balance: "42,500.00" },
          { date: "20-01-2025", account: "Accounts Receivable", description: "Client B Invoice", debit: "-", credit: "9,800.00", balance: "49,100.00" },
        ],
      },
      {
        name: "Expenses account",
        rows: [
          { date: "05-01-2025", account: "Rent Expense", description: "January Office Rent", debit: "2,500.00", credit: "-", balance: "27,500.00" },
          { date: "15-01-2025", account: "Marketing Expense", description: "Digital Campaign Q1", debit: "3,200.00", credit: "-", balance: "39,300.00" },
          { date: "31-01-2025", account: "Salary Expense", description: "January Payroll", debit: "12,000.00", credit: "-", balance: "37,100.00" },
        ],
      },
    ],
  },
}

const TASK_MOCK_ROWS = [
  { date: "01 Feb 2026", description: "Opening Balance", account: "Cash", debit: "50,000.00", credit: "-" },
  { date: "03 Feb 2026", description: "Office Rent", account: "Rent Expense", debit: "2,500.00", credit: "-" },
  { date: "05 Feb 2026", description: "Client Payment", account: "Accounts Receivable", debit: "-", credit: "8,500.00" },
  { date: "07 Feb 2026", description: "Utilities", account: "Utilities Expense", debit: "380.00", credit: "-" },
  { date: "10 Feb 2026", description: "Software Subscription", account: "Software Expense", debit: "250.00", credit: "-" },
  { date: "12 Feb 2026", description: "Client Invoice #1042", account: "Accounts Receivable", debit: "-", credit: "12,000.00" },
  { date: "14 Feb 2026", description: "Staff Salaries", account: "Salary Expense", debit: "8,000.00", credit: "-" },
  { date: "17 Feb 2026", description: "Marketing Campaign", account: "Marketing Expense", debit: "1,500.00", credit: "-" },
  { date: "19 Feb 2026", description: "Client Payment", account: "Accounts Receivable", debit: "-", credit: "6,500.00" },
  { date: "20 Feb 2026", description: "Equipment Purchase", account: "Equipment Expense", debit: "500.00", credit: "-" },
  { date: "22 Feb 2026", description: "Office Supplies", account: "Office Expense", debit: "500.00", credit: "-" },
]

// ─── Document-level task mock data ─────────────────────────────────────────

const MOCK_TASKS: TaskData[] = [
  {
    id: "task-1",
    title: "Dyson Maintenance Invoice",
    type: "Assets",
    docType: "Invoices",
    date: "01-02-2026",
    fileUrl: "Dyson Maintenance Invoice.pdf",
    quantity: "1",
    amount: "RM 8,500",
    itemisedItems: [
      {
        id: "item-1",
        item: "Y1FXC-RKA0890A",
        description: "Code: HDY/HC/426.",
        quantity: "1",
        unitPrice: "RM 8,500",
        amount: "RM 8,500",
      },
    ],
    correctedItemisedRows: [
      {
        id: "corrected-1",
        item: "Y1FXC-RKA0890A",
        description: "Code: HDY/HC/426.",
        quantity: "1",
        unitPrice: "RM 8,500",
        amount: "RM 8,500",
      },
    ],
    correctedValues: {},
    feedbackValues: {},
  },
  {
    id: "task-2",
    title: "Office Rent — February 2026",
    type: "Expenses",
    docType: "Receipts",
    date: "03-02-2026",
    fileUrl: "Office Rent Feb 2026.pdf",
    quantity: "1",
    amount: "RM 2,500",
    itemisedItems: [
      {
        id: "item-2",
        item: "RENT-FEB26",
        description: "Monthly office rental — Wisma ABC, Level 12",
        quantity: "1",
        unitPrice: "RM 2,500",
        amount: "RM 2,500",
      },
    ],
    correctedItemisedRows: [],
    correctedValues: {},
    feedbackValues: {},
  },
  {
    id: "task-3",
    title: "Utilities Bill — Electricity & Water",
    type: "Expenses",
    docType: "Invoices",
    date: "07-02-2026",
    fileUrl: "Utilities Feb 2026.pdf",
    quantity: "2",
    amount: "RM 380",
    itemisedItems: [
      {
        id: "item-3a",
        item: "ELEC-FEB26",
        description: "Electricity — TNB Feb 2026",
        quantity: "1",
        unitPrice: "RM 280",
        amount: "RM 280",
      },
      {
        id: "item-3b",
        item: "WATER-FEB26",
        description: "Water — SYABAS Feb 2026",
        quantity: "1",
        unitPrice: "RM 100",
        amount: "RM 100",
      },
    ],
    correctedItemisedRows: [],
    correctedValues: {},
    feedbackValues: {},
  },
  {
    id: "task-4",
    title: "Staff Salaries — February 2026",
    type: "Expenses",
    docType: "Payroll",
    date: "14-02-2026",
    fileUrl: "Payroll Feb 2026.pdf",
    quantity: "4",
    amount: "RM 8,000",
    itemisedItems: [
      {
        id: "item-4",
        item: "PAYROLL-FEB26",
        description: "February 2026 payroll — 4 employees",
        quantity: "4",
        unitPrice: "RM 2,000",
        amount: "RM 8,000",
      },
    ],
    correctedItemisedRows: [],
    correctedValues: {},
    feedbackValues: {},
  },
  {
    id: "task-5",
    title: "Marketing Campaign — Q1 2026",
    type: "Expenses",
    docType: "Invoices",
    date: "17-02-2026",
    fileUrl: "Marketing Q1 2026.pdf",
    quantity: "1",
    amount: "RM 1,500",
    itemisedItems: [
      {
        id: "item-5",
        item: "MKT-Q1-26",
        description: "Digital marketing campaign — Google & Meta Ads",
        quantity: "1",
        unitPrice: "RM 1,500",
        amount: "RM 1,500",
      },
    ],
    correctedItemisedRows: [],
    correctedValues: {},
    feedbackValues: {},
  },
]

// ─── Shared sub-components ─────────────────────────────────────────────────

function ColHeader({
  icon,
  label,
  align = "left",
}: {
  icon: React.ReactNode
  label: string
  align?: "left" | "right"
}) {
  return (
    <th
      className={cn(
        "py-2.5 px-3 text-xs font-medium text-gray-400 whitespace-nowrap",
        align === "right" && "text-right"
      )}
    >
      <div className={cn("flex items-center gap-1.5", align === "right" && "justify-end")}>
        {icon}
        <span>{label}</span>
      </div>
    </th>
  )
}

// ─── Overview ledger table ─────────────────────────────────────────────────

function LedgerTable({ rows }: { rows: LedgerRow[] }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <ColHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Date" />
            <ColHeader icon={<Tag className="h-3.5 w-3.5" />} label="Account" />
            <ColHeader icon={<FileText className="h-3.5 w-3.5" />} label="Description" />
            <ColHeader icon={<TrendingUp className="h-3.5 w-3.5" />} label="Debit" align="right" />
            <ColHeader icon={<TrendingDown className="h-3.5 w-3.5" />} label="Credit" align="right" />
            <ColHeader icon={<Hash className="h-3.5 w-3.5" />} label="Balance" align="right" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
              <td className="py-2.5 px-3 text-xs text-gray-500 tabular-nums">{row.date}</td>
              <td className="py-2.5 px-3">
                <span className="bg-gray-100 text-gray-700 rounded px-2 py-0.5 text-xs">
                  {row.account}
                </span>
              </td>
              <td className="py-2.5 px-3 text-gray-800 text-sm">{row.description}</td>
              <td className="py-2.5 px-3 text-right text-xs tabular-nums text-gray-700">{row.debit}</td>
              <td className="py-2.5 px-3 text-right text-xs tabular-nums text-gray-700">{row.credit}</td>
              <td className="py-2.5 px-3 text-right text-xs tabular-nums font-medium text-gray-900">{row.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Tasks table (no Balance column) ──────────────────────────────────────

function TaskTable({ rows }: { rows: typeof TASK_MOCK_ROWS }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <ColHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Date" />
            <ColHeader icon={<FileText className="h-3.5 w-3.5" />} label="Description" />
            <ColHeader icon={<Tag className="h-3.5 w-3.5" />} label="Account" />
            <ColHeader icon={<TrendingUp className="h-3.5 w-3.5" />} label="Debit" align="right" />
            <ColHeader icon={<TrendingDown className="h-3.5 w-3.5" />} label="Credit" align="right" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
              <td className="py-2.5 px-3 text-xs text-gray-500 tabular-nums">{row.date}</td>
              <td className="py-2.5 px-3 text-gray-800 text-sm">{row.description}</td>
              <td className="py-2.5 px-3">
                <span className="bg-gray-100 text-gray-700 rounded px-2 py-0.5 text-xs">
                  {row.account}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right text-xs tabular-nums text-gray-700">{row.debit}</td>
              <td className="py-2.5 px-3 text-right text-xs tabular-nums text-gray-700">{row.credit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Overview tab ──────────────────────────────────────────────────────────

function OverviewTab({ book }: { book: LedgerBook }) {
  const [entryTab, setEntryTab] = useState<EntryTab>("All Entries")

  const filterRows = (rows: LedgerRow[]) => {
    if (entryTab === "Debit") return rows.filter((r) => r.debit !== "-")
    if (entryTab === "Credit") return rows.filter((r) => r.credit !== "-")
    if (entryTab === "By Cash Account") return rows.filter((r) => r.account === "Cash")
    return rows
  }

  return (
    <div className="p-6 overflow-y-auto h-full pb-24">
      {/* Warning banner */}
      <div className="border-l-4 border-orange-400 bg-orange-50 px-4 py-3 mb-6">
        <p className="text-sm font-semibold text-gray-800">Ledger Summary</p>
        <p className="text-xs text-gray-600 mt-0.5">
          Missing Bank statement from June 2025, July 2025 to fully verify the entries
        </p>
      </div>

      {/* Entry filter tabs */}
      <div className="flex items-center gap-1 mb-6 flex-wrap">
        {ENTRY_TABS.map(({ label, icon }) => (
          <button
            key={label}
            onClick={() => setEntryTab(label)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors",
              entryTab === label
                ? "bg-gray-100 text-gray-700 font-medium"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            {icon}
            {label}
          </button>
        ))}
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <Plus className="h-3.5 w-3.5" />
          Add New Account View
        </button>
      </div>

      {/* Account groups */}
      <div className="space-y-8">
        {book.groups.map((group) => (
          <div key={group.name}>
            <div className="flex items-center gap-2 mb-3">
              <LayoutGrid className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">{group.name}</span>
            </div>
            <LedgerTable rows={filterRows(group.rows)} />
            <button className="text-sm text-gray-500 hover:text-gray-700 mt-2 ml-1 transition-colors">
              + New Entry
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tasks tab (document list) ─────────────────────────────────────────────

function TasksTab({ onSelectTask }: { onSelectTask: (index: number) => void }) {
  const [taskTab, setTaskTab] = useState<TaskTab>("Activity")

  const filteredTasks =
    taskTab === "Debit"
      ? MOCK_TASKS.filter((t) => t.type === "Expenses")
      : taskTab === "Credit"
      ? MOCK_TASKS.filter((t) => t.type === "Assets")
      : MOCK_TASKS

  return (
    <div className="p-6 overflow-y-auto h-full pb-24">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Document scanned 20 Feb 2026</h3>

      {/* Task sub-tabs */}
      <div className="flex gap-1 mb-5">
        {TASK_TABS.map(({ label, icon }) => (
          <button
            key={label}
            onClick={() => setTaskTab(label)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors",
              taskTab === label
                ? "bg-gray-100 text-gray-700 font-medium"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      <p className="text-xs font-medium text-gray-500 mb-3">
        {filteredTasks.length} document{filteredTasks.length !== 1 ? "s" : ""} processed
      </p>

      {/* Document task list */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/60">
              <ColHeader icon={<Receipt className="h-3.5 w-3.5" />} label="Document" />
              <ColHeader icon={<Tag className="h-3.5 w-3.5" />} label="Type" />
              <ColHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Date" />
              <ColHeader icon={<FileText className="h-3.5 w-3.5" />} label="Doc Type" />
              <ColHeader icon={<Hash className="h-3.5 w-3.5" />} label="Amount" align="right" />
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => {
              const globalIndex = MOCK_TASKS.findIndex((t) => t.id === task.id)
              return (
                <tr
                  key={task.id}
                  onClick={() => onSelectTask(globalIndex)}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <td className="py-2.5 px-3">
                    <span className="text-gray-800 text-sm font-medium group-hover:text-[#1a2744] transition-colors">
                      {task.title}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="bg-gray-100 text-gray-700 rounded px-2 py-0.5 text-xs">
                      {task.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-gray-500 tabular-nums">{task.date}</td>
                  <td className="py-2.5 px-3">
                    <span className="bg-gray-100 text-gray-700 rounded px-2 py-0.5 text-xs">
                      {task.docType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-xs tabular-nums font-medium text-gray-700">
                    {task.amount}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button className="text-sm text-gray-500 hover:text-gray-700 mt-3 transition-colors flex items-center gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        New entry
      </button>

      <div className="flex gap-8 text-sm font-medium text-gray-700 border-t border-gray-200 pt-4 mt-4">
        <span>
          Total Documents:{" "}
          <span className="text-gray-900">{filteredTasks.length}</span>
        </span>
        <span>
          Total Amount:{" "}
          <span className="text-gray-900">
            RM{" "}
            {filteredTasks
              .reduce((sum, t) => {
                const num = parseFloat(t.amount.replace(/[^0-9.]/g, ""))
                return sum + (isNaN(num) ? 0 : num)
              }, 0)
              .toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </span>
        </span>
      </div>
    </div>
  )
}

// ─── Main LedgerPage ───────────────────────────────────────────────────────

interface LedgerPageProps {
  id: string
}

export function LedgerPage({ id }: LedgerPageProps) {
  const [mainTab, setMainTab] = useState<MainTab>("Overview")
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null)
  const [tasks, setTasks] = useState<TaskData[]>(MOCK_TASKS)
  const [drafts, setDrafts] = useState<Record<string, TaskDraft>>({})
  const book = BOOKS_DATA[id] ?? { name: "Ledger", groups: [] }

  const handleDraftChange = (taskId: string, draft: TaskDraft) => {
    setDrafts((prev) => ({ ...prev, [taskId]: draft }))
  }

  const handleSelectTask = (index: number) => {
    setSelectedTaskIndex(index)
  }

  const handleCloseTask = () => {
    setSelectedTaskIndex(null)
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    setSelectedTaskIndex(null)
  }

  const handleVerifyTask = (taskId: string, data: TaskData) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...data } : t)))
    setSelectedTaskIndex(null)
  }

  const handlePrevTask = () => {
    setSelectedTaskIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))
  }

  const handleNextTask = () => {
    setSelectedTaskIndex((prev) =>
      prev !== null && prev < tasks.length - 1 ? prev + 1 : prev
    )
  }

  // When a task is selected, show the TaskDetailView full-screen
  // (replaced by Sheet below — remove early return)

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">{book.name}</h1>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        <button className="flex items-center gap-2 bg-[#03234B] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#03234B]/90 transition-colors">
          <CheckCircle className="h-4 w-4" />
          Verify your book
        </button>
      </div>

      {/* Main tab navigation */}
      <div className="flex gap-1 px-6 py-3 border-b border-gray-100 flex-shrink-0">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setMainTab(tab)}
            className={cn(
              "px-4 py-1.5 text-sm rounded-full transition-colors",
              mainTab === tab
                ? "bg-gray-100 text-gray-700 font-medium"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden relative">
        {mainTab === "Overview" ? (
          <OverviewTab book={book} />
        ) : (
          <TasksTab onSelectTask={handleSelectTask} />
        )}
      </div>

      {/* Floating action button — both tabs */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10">
        <button className="flex items-center gap-2 bg-[#1a2744] text-white px-5 py-3 rounded-full shadow-lg hover:bg-[#1a2744]/90 transition-colors text-sm font-medium">
          <Pencil className="h-4 w-4" />
          Edit the ledger manually
        </button>
      </div>

      {/* Task detail — slides up as a large bottom sheet */}
      <Sheet
        open={selectedTaskIndex !== null}
        onOpenChange={(open) => { if (!open) handleCloseTask() }}
      >
        <SheetContent
          side="bottom"
          className="h-[92vh] p-0 rounded-t-2xl overflow-hidden flex flex-col [&>button]:hidden"
        >
          {selectedTaskIndex !== null && tasks[selectedTaskIndex] && (
            <TaskDetailView
              key={tasks[selectedTaskIndex].id}
              task={tasks[selectedTaskIndex]}
              taskIndex={selectedTaskIndex}
              totalTasks={tasks.length}
              ledgerTitle={book.name}
              initialDraft={drafts[tasks[selectedTaskIndex].id]}
              onDraftChange={handleDraftChange}
              onClose={handleCloseTask}
              onDelete={handleDeleteTask}
              onVerify={handleVerifyTask}
              onPrev={handlePrevTask}
              onNext={handleNextTask}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
