"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
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
  Download,
  Upload,
  Loader2,
  AlertCircle,
  InboxIcon,
  Paperclip,
  ArrowUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { useGLStatus, useGLTransactions, useExportGL, useUploadGL } from "@/hooks/useAiQueries"
import { useAuth } from "@/components/AuthContext"
import { useLedgerChat } from "@/hooks/useLedgerChat"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocuments } from "@/hooks/useDocumentQueries"
import { useLedger } from "@/hooks/useLedgerQueries"
import {
  GridTable,
  GridTableCell,
  GridTableHead,
  GridTableHeader,
  GridTableRow,
  TableBody,
  TablePill,
} from "@/components/ui/table"
import type { Document } from "@/lib/backend"

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
    <div className="rounded-lg overflow-hidden border border-[#d4d4d4] bg-white">
      <GridTable>
        <GridTableHeader>
          <GridTableRow className="hover:bg-[#efefef]">
            <GridTableHead><div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Date</div></GridTableHead>
            <GridTableHead><div className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" />Account</div></GridTableHead>
            <GridTableHead><div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Description</div></GridTableHead>
            <GridTableHead className="text-right"><div className="flex items-center justify-end gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Debit</div></GridTableHead>
            <GridTableHead className="text-right"><div className="flex items-center justify-end gap-1.5"><TrendingDown className="h-3.5 w-3.5" />Credit</div></GridTableHead>
            <GridTableHead className="text-right"><div className="flex items-center justify-end gap-1.5"><Hash className="h-3.5 w-3.5" />Balance</div></GridTableHead>
          </GridTableRow>
        </GridTableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <GridTableRow key={i}>
              <GridTableCell className="tabular-nums text-[#3a3a3a]">{row.date}</GridTableCell>
              <GridTableCell><TablePill>{row.account}</TablePill></GridTableCell>
              <GridTableCell>{row.description}</GridTableCell>
              <GridTableCell className="text-right tabular-nums">{row.debit}</GridTableCell>
              <GridTableCell className="text-right tabular-nums">{row.credit}</GridTableCell>
              <GridTableCell className="text-right tabular-nums font-medium">{row.balance}</GridTableCell>
            </GridTableRow>
          ))}
        </TableBody>
      </GridTable>
    </div>
  )
}

// ─── Tasks table (no Balance column) ──────────────────────────────────────

type TaskRow = {
  date: string
  description: string
  account: string
  debit: string
  credit: string
}

function TaskTable({ rows }: { rows: TaskRow[] }) {
  return (
    <div className="rounded-lg overflow-hidden border border-[#d4d4d4] bg-white">
      <GridTable>
        <GridTableHeader>
          <GridTableRow className="hover:bg-[#efefef]">
            <GridTableHead><div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Date</div></GridTableHead>
            <GridTableHead><div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Description</div></GridTableHead>
            <GridTableHead><div className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" />Account</div></GridTableHead>
            <GridTableHead className="text-right"><div className="flex items-center justify-end gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Debit</div></GridTableHead>
            <GridTableHead className="text-right"><div className="flex items-center justify-end gap-1.5"><TrendingDown className="h-3.5 w-3.5" />Credit</div></GridTableHead>
          </GridTableRow>
        </GridTableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <GridTableRow key={i}>
              <GridTableCell className="tabular-nums text-[#3a3a3a]">{row.date}</GridTableCell>
              <GridTableCell>{row.description}</GridTableCell>
              <GridTableCell><TablePill>{row.account}</TablePill></GridTableCell>
              <GridTableCell className="text-right tabular-nums">{row.debit}</GridTableCell>
              <GridTableCell className="text-right tabular-nums">{row.credit}</GridTableCell>
            </GridTableRow>
          ))}
        </TableBody>
      </GridTable>
    </div>
  )
}

// ─── Overview tab ──────────────────────────────────────────────────────────

interface OverviewTabProps {
  realRows?: LedgerRow[]
  isLoading?: boolean
}

function OverviewTab({ realRows, isLoading }: OverviewTabProps) {
  const [entryTab, setEntryTab] = useState<EntryTab>("All Entries")

  const sourceRows = realRows ?? []

  const filterRows = (rows: LedgerRow[]) => {
    if (entryTab === "Debit") return rows.filter((r) => r.debit !== "-")
    if (entryTab === "Credit") return rows.filter((r) => r.credit !== "-")
    if (entryTab === "By Cash Account") return rows.filter((r) => r.account === "Cash")
    return rows
  }

  const displayGroups = realRows
    ? [{ name: "Transactions", rows: filterRows(sourceRows) }]
    : []

  return (
    <div className="p-6 overflow-y-auto h-full pb-24">
      {/* Status banner */}
      {!realRows && !isLoading && (
        <div className="border-l-4 border-orange-400 bg-orange-50 px-4 py-3 mb-6">
          <p className="text-sm font-semibold text-gray-800">No general ledger data</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Upload a general ledger file to get started, or send documents via chat for AI extraction.
          </p>
        </div>
      )}

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

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {displayGroups.map((group) => (
            <div key={group.name}>
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">{group.name}</span>
              </div>
              <LedgerTable rows={group.rows} />
              <button className="text-sm text-gray-500 hover:text-gray-700 mt-2 ml-1 transition-colors">
                + New Entry
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tasks tab (document list) ─────────────────────────────────────────────

const EXTRACTION_STATUS_COLOURS: Record<Document["extractionStatus"], string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
}

const DOCUMENT_STATUS_COLOURS: Record<Document["documentStatus"], string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  UNDER_REVIEW: "bg-yellow-50 text-yellow-700",
  APPROVED: "bg-green-50 text-green-700",
}

interface TasksTabProps {
  documents: Document[]
  isLoading?: boolean
}

function TasksTab({ documents, isLoading }: TasksTabProps) {
  const router = useRouter()
  const [taskTab, setTaskTab] = useState<TaskTab>("Activity")

  const filteredDocs =
    taskTab === "Debit"
      ? documents.filter((d) => d.extractionStatus === "COMPLETED")
      : taskTab === "Credit"
      ? documents.filter((d) => d.documentStatus === "APPROVED")
      : documents

  return (
    <div className="p-6 overflow-y-auto h-full pb-24">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Documents</h3>

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

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <InboxIcon className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-700">No documents processed yet</p>
          <p className="text-xs text-gray-400 mt-1">Upload documents to get started</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-medium text-gray-500 mb-3">
            {filteredDocs.length} document{filteredDocs.length !== 1 ? "s" : ""} processed
          </p>

          {/* Document list */}
          <div className="rounded-lg overflow-hidden border border-[#d4d4d4] bg-white">
            <GridTable>
              <GridTableHeader>
                <GridTableRow className="hover:bg-[#efefef]">
                  <GridTableHead><div className="flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5" />Document</div></GridTableHead>
                  <GridTableHead><div className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" />Extraction</div></GridTableHead>
                  <GridTableHead><div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Date</div></GridTableHead>
                  <GridTableHead><div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Status</div></GridTableHead>
                  <GridTableHead className="text-right"><div className="flex items-center justify-end gap-1.5"><Hash className="h-3.5 w-3.5" />Amount</div></GridTableHead>
                </GridTableRow>
              </GridTableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <GridTableRow
                    key={doc.id}
                    onClick={() => router.push(`/documents/${doc.id}`)}
                    className="cursor-pointer group"
                  >
                    <GridTableCell>
                      <span className="text-[#252525] font-medium group-hover:text-[#1a2744] transition-colors">
                        {doc.name ?? "Document"}
                      </span>
                    </GridTableCell>
                    <GridTableCell>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          EXTRACTION_STATUS_COLOURS[doc.extractionStatus]
                        )}
                      >
                        {doc.extractionStatus}
                      </span>
                    </GridTableCell>
                    <GridTableCell className="tabular-nums text-[#444]">
                      {new Date(doc.createdAt).toLocaleDateString("en-MY")}
                    </GridTableCell>
                    <GridTableCell>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          DOCUMENT_STATUS_COLOURS[doc.documentStatus]
                        )}
                      >
                        {doc.documentStatus.replace("_", " ")}
                      </span>
                    </GridTableCell>
                    <GridTableCell className="text-right tabular-nums font-medium">N/A</GridTableCell>
                  </GridTableRow>
                ))}
              </TableBody>
            </GridTable>
          </div>

          <button className="text-sm text-gray-500 hover:text-gray-700 mt-3 transition-colors flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New entry
          </button>

          <div className="flex gap-8 text-sm font-medium text-gray-700 border-t border-gray-200 pt-4 mt-4">
            <span>
              Total Documents:{" "}
              <span className="text-gray-900">{filteredDocs.length}</span>
            </span>
          </div>
        </>
      )}
    </div>
  )
}

// ─── GL Upload modal ───────────────────────────────────────────────────────

function GLUploadModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear())
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const uploadGL = useUploadGL()

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setStagedFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/vnd.ms-excel": [],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
      "text/csv": [],
    },
  })

  const handleUpload = async () => {
    if (!stagedFile) return
    try {
      await uploadGL.mutateAsync({ file: stagedFile, fiscalYear })
      toast.success("General ledger uploaded successfully. AI is processing…")
      setStagedFile(null)
      onClose()
    } catch {
      toast.error("Failed to upload general ledger. Please try again.")
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Upload General Ledger</h2>
        <p className="text-sm text-gray-500 mb-4">Accepts Excel (.xlsx, .xls) or CSV files</p>

        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Fiscal Year</label>
          <input
            type="number"
            value={fiscalYear}
            onChange={(e) => setFiscalYear(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-4",
            isDragActive ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400"
          )}
        >
          <input {...getInputProps()} />
          {stagedFile ? (
            <div className="flex items-center gap-2 justify-center text-sm text-gray-700">
              <FileText className="h-4 w-4" />
              {stagedFile.name}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {isDragActive ? "Drop file here" : "Drag & drop or click to browse"}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleUpload}
            disabled={!stagedFile || uploadGL.isPending}
          >
            {uploadGL.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading…</>
            ) : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main LedgerPage ───────────────────────────────────────────────────────

export function LedgerPage({ ledgerId }: { ledgerId: string }) {
  const { user } = useAuth()
  const _companyId = user?.companyId ?? ""

  const [mainTab, setMainTab] = useState<MainTab>("Overview")
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [chatPrompt, setChatPrompt] = useState("")
  const chatFileInputRef = useRef<HTMLInputElement>(null)

  const { data: ledger } = useLedger(ledgerId)
  const { sendMessage: sendChatMessage, isLoading: chatLoading } = useLedgerChat(
    ledgerId,
    ledger?.fiscalYear,
  )

  const handleChatSend = async () => {
    const text = chatPrompt.trim()
    if (!text || chatLoading) return
    setChatPrompt("")
    try {
      await sendChatMessage(text)
    } catch {
      toast.error("Failed to send message. Please try again.")
    }
  }

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleChatSend()
    }
  }
  const { data: glStatus } = useGLStatus()
  const { data: glTransactions, isLoading: glLoading } = useGLTransactions({ page_size: 100 })
  const { data: allDocuments = [], isLoading: docsLoading } = useDocuments()

  // Filter documents to only those belonging to this ledger
  const documents = allDocuments.filter((d) => d.ledgerId === ledgerId)

  const exportGL = useExportGL()

  // Convert real GL transactions to LedgerRow format for the table
  const realRows: LedgerRow[] | undefined = glTransactions?.rows.map((tx) => ({
    date: new Date(tx.date).toLocaleDateString("en-MY"),
    account: tx.account_name ?? tx.account_code,
    description: tx.description,
    debit: tx.debit > 0 ? tx.debit.toLocaleString("en-MY", { minimumFractionDigits: 2 }) : "-",
    credit: tx.credit > 0 ? tx.credit.toLocaleString("en-MY", { minimumFractionDigits: 2 }) : "-",
    balance: tx.balance.toLocaleString("en-MY", { minimumFractionDigits: 2 }),
  }))

  const pageTitle = ledger?.name ?? (glStatus
    ? `General Ledger ${glStatus.fiscal_year ?? ""}`
    : "General Ledger")

  const handleExport = async () => {
    try {
      const blob = await exportGL.mutateAsync(undefined)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `general-ledger-${new Date().getFullYear()}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Failed to export general ledger")
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUploadModalOpen(true)}
            className="gap-1.5"
          >
            <Upload className="h-4 w-4" />
            Upload GL
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportGL.isPending || !glStatus?.initialized}
            className="gap-1.5"
          >
            {exportGL.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export
          </Button>
          <button className="flex items-center gap-2 bg-[#03234B] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#03234B]/90 transition-colors">
            <CheckCircle className="h-4 w-4" />
            Verify your book
          </button>
        </div>
      </div>

      {/* Ledger chat box */}
      <div className="px-6 pt-4">
        <div className="rounded-3xl border border-gray-200 bg-[#f7f7f7] p-4">
          <input
            ref={chatFileInputRef}
            type="file"
            multiple
            accept="application/pdf,image/*,.csv,.xlsx,.xls,.doc,.docx"
            className="hidden"
          />
          <textarea
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            onKeyDown={handleChatKeyDown}
            placeholder="Ask about your company financial highlights"
            disabled={chatLoading}
            className="w-full resize-none bg-transparent text-[15px] text-gray-800 placeholder:text-gray-500 outline-none min-h-[74px] disabled:opacity-60"
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => chatFileInputRef.current?.click()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-gray-200/70 transition-colors"
              aria-label="Attach file"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleChatSend}
              disabled={!chatPrompt.trim() || chatLoading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-800 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-40"
              aria-label="Send prompt"
            >
              {chatLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* GL status pill */}
      {glStatus && (
        <div className="mx-6 mt-4 px-5 py-3 border-l-[4px] border-l-[#f59e0b] bg-[#f6ead8] flex items-center gap-3 text-sm text-gray-700">
          {glStatus.summary.entries_count > 0 ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">Ledger Summary</span>
              <span className="text-gray-600">
                GL active · Fiscal year {glStatus.fiscal_year} · {glStatus.summary.entries_count} entries ·{" "}
                {glStatus.summary.is_balanced ? "Balanced ✓" : "Unbalanced ⚠️"}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Ledger Summary</span>
              <span className="text-gray-600">No entries yet · Fiscal year {glStatus.fiscal_year}</span>
            </>
          )}
        </div>
      )}

      {/* Main tab navigation */}
      <div className="flex gap-1 px-6 py-3 border-b border-gray-100 flex-shrink-0 mt-3">
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
          <OverviewTab
            realRows={realRows}
            isLoading={glLoading}
          />
        ) : (
          <TasksTab documents={documents} isLoading={docsLoading} />
        )}
      </div>

      {/* Floating action button — both tabs */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10">
        <button className="flex items-center gap-2 bg-[#1a2744] text-white px-5 py-3 rounded-full shadow-lg hover:bg-[#1a2744]/90 transition-colors text-sm font-medium">
          <Pencil className="h-4 w-4" />
          Edit the ledger manually
        </button>
      </div>

      {/* GL upload modal */}
      <GLUploadModal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />
    </div>
  )
}
