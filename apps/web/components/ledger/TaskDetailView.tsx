"use client"

import { useEffect, useState } from "react"
import {
  Pencil,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  Calendar,
  FileText,
  Tag,
  Hash,
  DollarSign,
  MoreHorizontal,
  Link2,
  Package,
  LayoutGrid,
  Plus,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  GridTable,
  GridTableCell,
  GridTableHead,
  GridTableHeader,
  GridTableRow,
  TableBody,
  TablePill,
} from "@/components/ui/table"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ItemisedRow {
  id: string
  item: string
  description: string
  quantity: string
  unitPrice: string
  amount: string
}

export interface TaskData {
  id: string
  title: string
  type: string
  docType: string
  date: string
  fileUrl: string
  quantity: string
  amount: string
  itemisedItems: ItemisedRow[]
  correctedItemisedRows: ItemisedRow[]
  correctedValues: Partial<Record<string, string>>
  feedbackValues: Partial<Record<string, string>>
}

export interface TaskDraft {
  title?: string
  correctedValues?: Record<string, string>
  feedbackValues?: Record<string, string>
  correctedItemisedRows?: ItemisedRow[]
}

interface TaskDetailViewProps {
  task: TaskData
  taskIndex: number
  totalTasks: number
  ledgerTitle: string
  initialDraft?: TaskDraft
  onDraftChange?: (taskId: string, draft: TaskDraft) => void
  onClose: () => void
  onDelete: (taskId: string) => void
  onVerify: (taskId: string, data: TaskData) => void
  onPrev: () => void
  onNext: () => void
}

// ─── Mock Document Preview ─────────────────────────────────────────────────

function DocumentPreview({ task }: { task: TaskData }) {
  return (
    <div className="w-full h-full flex items-start justify-center p-8 overflow-y-auto bg-gray-100/60">
      <div
        className="w-full max-w-[480px] bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.10)] overflow-hidden"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        {/* Document header bar */}
        <div className="bg-[#1a2744] px-6 py-4 flex justify-between items-start">
          <div>
            <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-0.5">From</p>
            <p className="text-white text-xs font-semibold">ATS LABS SDN BHD</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-0.5">Quote to</p>
            <p className="text-white text-xs font-semibold">Asia Green Construction Sdn Bhd</p>
          </div>
        </div>

        {/* Document body */}
        <div className="p-6 space-y-5 text-xs text-gray-700">
          {/* From / To addresses */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <p className="font-bold text-gray-900">ATS LABS SDN BHD (1416597-K)</p>
              <p className="text-gray-500">Lot 1217, Seksyen, 57, Jln Sultan Ismail,</p>
              <p className="text-gray-500">50250 Kuala Lumpur</p>
              <p className="text-gray-500 mt-1">23 January 2025</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="font-bold text-gray-900">Asia Plywood SDN BHD</p>
              <p className="text-gray-500">Lot 15735, Persiaran Bayan Indah,</p>
              <p className="text-gray-500">11900 Bayan Lepas, Pulau Pinang</p>
            </div>
          </div>

          {/* Line items table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <GridTable className="text-xs">
              <GridTableHeader>
                <GridTableRow className="hover:bg-[#efefef]">
                  <GridTableHead>Description</GridTableHead>
                  <GridTableHead className="text-right">Qty</GridTableHead>
                  <GridTableHead className="text-right">Unit/mo</GridTableHead>
                  <GridTableHead className="text-right">Unit/yr</GridTableHead>
                </GridTableRow>
              </GridTableHeader>
              <TableBody>
                <GridTableRow>
                  <GridTableCell className="font-medium text-gray-800">Website Development Maintenance</GridTableCell>
                  <GridTableCell colSpan={3} className="text-right text-gray-600">7,800</GridTableCell>
                </GridTableRow>
                <GridTableRow>
                  <GridTableCell className="pl-5 text-gray-500">Website Content Management</GridTableCell>
                  <GridTableCell className="text-right text-gray-500">6</GridTableCell>
                  <GridTableCell className="text-right text-gray-500">1,000</GridTableCell>
                  <GridTableCell className="text-right text-gray-500">6,000</GridTableCell>
                </GridTableRow>
                <GridTableRow>
                  <GridTableCell className="pl-5 text-gray-500">Server Fees Hosting</GridTableCell>
                  <GridTableCell className="text-right text-gray-500">1</GridTableCell>
                  <GridTableCell className="text-right text-gray-500">150</GridTableCell>
                  <GridTableCell className="text-right text-gray-500">1,800</GridTableCell>
                </GridTableRow>
              </TableBody>
            </GridTable>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 border-t border-gray-100 pt-3">
            {[
              { label: "Subtotal", value: "RM7,800" },
              { label: "SST (8%)", value: "624" },
              { label: "SST (8%)", value: "8,424" },
              { label: "Discount", value: "RM (1,524)" },
            ].map((row) => (
              <div key={row.label + row.value} className="flex justify-between">
                <span className="text-gray-500">{row.label}</span>
                <span className="text-gray-700 tabular-nums">{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold border-t border-gray-200 pt-1.5 mt-1.5">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900 tabular-nums">RM 6,900</span>
            </div>
          </div>

          {/* Terms */}
          <div className="border-t border-gray-100 pt-4 space-y-1.5">
            <p className="font-semibold text-gray-800">Terms of Service</p>
            <p className="text-gray-500">1. Maintenance will be inclusive of Server Fees Hosting</p>
            <p className="text-gray-500">2. Payment term can choose on monthly basis, or quarterly basis or half a year basis.</p>
          </div>

          {/* Acceptance */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="font-semibold text-gray-800">Acceptance</p>
            <p className="text-gray-500">We confirm your appointment on the terms and conditions set out above.</p>
            <div className="border-b border-gray-400 w-32 mt-4" />
            <div className="space-y-1 text-gray-500 mt-2">
              <p>Name:</p>
              <p>Designation:</p>
              <p>Date:</p>
            </div>
          </div>
        </div>

        {/* Page footer */}
        <div className="border-t border-gray-200 px-6 py-2 text-center text-[10px] text-gray-400 bg-gray-50">
          Page 1
        </div>
      </div>
    </div>
  )
}

// ─── Editable cell ─────────────────────────────────────────────────────────

function EditableCell({
  value,
  onChange,
  align = "left",
  placeholder = "—",
}: {
  value: string
  onChange: (v: string) => void
  align?: "left" | "right"
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full text-xs text-gray-700 bg-transparent outline-none",
        "border-b border-transparent hover:border-gray-300 focus:border-[#1a2744]",
        "placeholder:text-gray-300 transition-colors py-0.5",
        align === "right" && "text-right tabular-nums"
      )}
    />
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export function TaskDetailView({
  task,
  taskIndex,
  totalTasks,
  ledgerTitle,
  initialDraft,
  onDraftChange,
  onClose,
  onDelete,
  onVerify,
  onPrev,
  onNext,
}: TaskDetailViewProps) {
  const [title, setTitle] = useState(initialDraft?.title ?? task.title)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [correctedValues, setCorrectedValues] = useState<Record<string, string>>(
    initialDraft?.correctedValues ?? (task.correctedValues as Record<string, string>)
  )
  const [feedbackValues, setFeedbackValues] = useState<Record<string, string>>(
    initialDraft?.feedbackValues ?? (task.feedbackValues as Record<string, string>)
  )
  const [correctedRows, setCorrectedRows] = useState<ItemisedRow[]>(
    initialDraft?.correctedItemisedRows ?? task.correctedItemisedRows
  )

  // Sync every edit back to the parent so drafts survive navigation
  useEffect(() => {
    onDraftChange?.(task.id, { title, correctedValues, feedbackValues, correctedItemisedRows: correctedRows })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, correctedValues, feedbackValues, correctedRows])

  const handleVerify = () => {
    onVerify(task.id, {
      ...task,
      title,
      correctedValues,
      feedbackValues,
      correctedItemisedRows: correctedRows,
    })
  }

  const addCorrectedRow = () => {
    setCorrectedRows((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, item: "", description: "", quantity: "", unitPrice: "", amount: "" },
    ])
  }

  const updateCorrectedRow = (index: number, field: keyof ItemisedRow, value: string) => {
    setCorrectedRows((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // Field definitions for the main data table
  const dataFields: {
    key: string
    icon: React.ReactNode
    label: string
    renderValue: () => React.ReactNode
  }[] = [
    {
      key: "type",
      icon: <Tag className="h-3.5 w-3.5 text-gray-400" />,
      label: "Type",
      renderValue: () => (
        <TablePill className="max-w-[180px] text-xs">{task.type}</TablePill>
      ),
    },
    {
      key: "docType",
      icon: <FileText className="h-3.5 w-3.5 text-gray-400" />,
      label: "Doc Type",
      renderValue: () => (
        <TablePill className="max-w-[180px] text-xs">{task.docType}</TablePill>
      ),
    },
    {
      key: "date",
      icon: <Calendar className="h-3.5 w-3.5 text-gray-400" />,
      label: "Date",
      renderValue: () => <span className="text-sm text-gray-700 tabular-nums">{task.date}</span>,
    },
    {
      key: "fileUrl",
      icon: <Link2 className="h-3.5 w-3.5 text-gray-400" />,
      label: "File URL",
      renderValue: () => (
        <TablePill className="max-w-[160px] text-xs">{task.fileUrl}</TablePill>
      ),
    },
    {
      key: "quantity",
      icon: <Package className="h-3.5 w-3.5 text-gray-400" />,
      label: "Quantity",
      renderValue: () => <span className="text-sm text-gray-700 tabular-nums">{task.quantity}</span>,
    },
    {
      key: "amount",
      icon: <DollarSign className="h-3.5 w-3.5 text-gray-400" />,
      label: "Amount",
      renderValue: () => <span className="text-sm text-gray-700 tabular-nums">{task.amount}</span>,
    },
  ]

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 truncate">{ledgerTitle}</h1>
          <button className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-4">
          {/* Prev */}
          <button
            onClick={onPrev}
            disabled={taskIndex === 0}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous task"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Verified button */}
          <button
            onClick={handleVerify}
            className="flex items-center gap-2 bg-[#1a2744] text-white px-5 py-2.5 rounded-full hover:bg-[#1a2744]/90 transition-colors text-sm font-medium shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            Verified
          </button>

          {/* Next */}
          <button
            onClick={onNext}
            disabled={taskIndex === totalTasks - 1}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            aria-label="Next task"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(task.id)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Document preview */}
        <div className="w-[46%] border-r border-gray-200 overflow-y-auto shrink-0">
          <DocumentPreview task={task} />
        </div>

        {/* Right: Extracted data */}
        <div className="flex-1 overflow-y-auto p-6 space-y-7 pb-12">

          {/* Document title row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                  className="text-xl font-semibold text-gray-900 border-b-2 border-[#1a2744] outline-none bg-transparent min-w-0 w-64"
                />
              ) : (
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              )}
              <button
                onClick={() => setIsEditingTitle(true)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          {/* ── Main data table ── */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <GridTable>
              <GridTableHeader>
                <GridTableRow className="hover:bg-[#efefef]">
                  <GridTableHead className="w-28">Item</GridTableHead>
                  <GridTableHead>Values</GridTableHead>
                  <GridTableHead className="bg-amber-50/70">
                    <div className="flex items-center gap-1.5">
                      <Pencil className="h-3 w-3 text-amber-500" />
                      Corrected Values
                    </div>
                  </GridTableHead>
                  <GridTableHead className="bg-amber-50/70">
                    <div className="flex items-center gap-1.5">
                      <Pencil className="h-3 w-3 text-amber-500" />
                      Feedback
                    </div>
                  </GridTableHead>
                </GridTableRow>
              </GridTableHeader>
              <TableBody>
                {dataFields.map(({ key, icon, label, renderValue }) => (
                  <GridTableRow key={key}>
                    <GridTableCell>
                      <div className="flex items-center gap-1.5">
                        {icon}
                        <span className="text-xs text-gray-500 font-medium">{label}</span>
                      </div>
                    </GridTableCell>
                    <GridTableCell>{renderValue()}</GridTableCell>
                    <GridTableCell className="bg-amber-50/40">
                      <EditableCell
                        value={correctedValues[key] ?? ""}
                        onChange={(v) => setCorrectedValues({ ...correctedValues, [key]: v })}
                      />
                    </GridTableCell>
                    <GridTableCell className="bg-amber-50/40">
                      <EditableCell
                        value={feedbackValues[key] ?? ""}
                        onChange={(v) => setFeedbackValues({ ...feedbackValues, [key]: v })}
                      />
                    </GridTableCell>
                  </GridTableRow>
                ))}
              </TableBody>
            </GridTable>
          </div>

          {/* ── Itemised items ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800">Itemised item</h3>
              <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <GridTable>
                <GridTableHeader>
                  <GridTableRow className="hover:bg-[#efefef]">
                    <GridTableHead><div className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Item</div></GridTableHead>
                    <GridTableHead><div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Item description</div></GridTableHead>
                    <GridTableHead className="text-right"><div className="flex items-center gap-1.5 justify-end"><Package className="h-3.5 w-3.5" /> Quantity</div></GridTableHead>
                    <GridTableHead className="text-right"><div className="flex items-center gap-1.5 justify-end"><DollarSign className="h-3.5 w-3.5" /> Unit Price</div></GridTableHead>
                    <GridTableHead className="text-right"><div className="flex items-center gap-1.5 justify-end"><DollarSign className="h-3.5 w-3.5" /> Amount</div></GridTableHead>
                  </GridTableRow>
                </GridTableHeader>
                <TableBody>
                  {task.itemisedItems.map((row, i) => (
                    <GridTableRow key={i}>
                      <GridTableCell className="text-xs font-medium">{row.item}</GridTableCell>
                      <GridTableCell className="text-xs">{row.description}</GridTableCell>
                      <GridTableCell className="text-right tabular-nums text-xs">{row.quantity}</GridTableCell>
                      <GridTableCell className="text-right tabular-nums text-xs">{row.unitPrice}</GridTableCell>
                      <GridTableCell className="text-right tabular-nums text-xs font-medium">{row.amount}</GridTableCell>
                    </GridTableRow>
                  ))}
                </TableBody>
              </GridTable>
            </div>
          </div>

          {/* ── Corrected Values for itemised ── */}
          <div>
            <div className="border border-amber-200 rounded-xl overflow-hidden bg-amber-50/30">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-100 bg-amber-50/60">
                <LayoutGrid className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold text-gray-700">Corrected Values</span>
              </div>
              <GridTable>
                <GridTableHeader>
                  <GridTableRow className="hover:bg-amber-50/60">
                    <GridTableHead><div className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Item</div></GridTableHead>
                    <GridTableHead><div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Item description</div></GridTableHead>
                    <GridTableHead className="text-right"><div className="flex items-center gap-1.5 justify-end"><Package className="h-3.5 w-3.5" /> Quantity</div></GridTableHead>
                    <GridTableHead className="text-right"><div className="flex items-center gap-1.5 justify-end"><DollarSign className="h-3.5 w-3.5" /> Unit Price</div></GridTableHead>
                    <GridTableHead className="text-right"><div className="flex items-center gap-1.5 justify-end"><DollarSign className="h-3.5 w-3.5" /> Amount</div></GridTableHead>
                  </GridTableRow>
                </GridTableHeader>
                <TableBody>
                  {correctedRows.map((row, i) => (
                    <GridTableRow key={row.id} className="hover:bg-amber-50/25">
                      <GridTableCell className="py-2"><EditableCell value={row.item} onChange={(v) => updateCorrectedRow(i, "item", v)} /></GridTableCell>
                      <GridTableCell className="py-2"><EditableCell value={row.description} onChange={(v) => updateCorrectedRow(i, "description", v)} /></GridTableCell>
                      <GridTableCell className="py-2"><EditableCell value={row.quantity} onChange={(v) => updateCorrectedRow(i, "quantity", v)} align="right" /></GridTableCell>
                      <GridTableCell className="py-2"><EditableCell value={row.unitPrice} onChange={(v) => updateCorrectedRow(i, "unitPrice", v)} align="right" /></GridTableCell>
                      <GridTableCell className="py-2"><EditableCell value={row.amount} onChange={(v) => updateCorrectedRow(i, "amount", v)} align="right" /></GridTableCell>
                    </GridTableRow>
                  ))}
                </TableBody>
              </GridTable>
              <div className="px-4 py-2.5 border-t border-amber-100">
                <button
                  onClick={addCorrectedRow}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
