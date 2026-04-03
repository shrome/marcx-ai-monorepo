"use client"

import {
  FileText,
  ImageIcon,
  FileArchive,
  X,
  CheckCircle2,
  Loader2,
  FolderOpen,
  AlertCircle,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import { useDocuments, useDeleteDocument } from "@/hooks/useDocumentQueries"
import { useTriggerOcr } from "@/hooks/useAiQueries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Document } from "@/lib/backend"

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileTypeIcon({ type, className }: { type: string; className?: string }) {
  if (type.startsWith("image/")) return <ImageIcon className={className} />
  if (type.includes("zip") || type.includes("archive")) return <FileArchive className={className} />
  return <FileText className={className} />
}

function ExtractionStatusBadge({ status }: { status: Document["extractionStatus"] }) {
  const map = {
    PENDING: { label: "Pending", variant: "secondary" as const, icon: <Clock className="h-3 w-3" /> },
    PROCESSING: { label: "Processing", variant: "secondary" as const, icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    COMPLETED: { label: "Extracted", variant: "default" as const, icon: <CheckCircle2 className="h-3 w-3" /> },
    FAILED: { label: "Failed", variant: "destructive" as const, icon: <AlertCircle className="h-3 w-3" /> },
  }
  const { label, variant, icon } = map[status]
  return (
    <Badge variant={variant} className="gap-1 text-xs">
      {icon}
      {label}
    </Badge>
  )
}

function DocumentStatusBadge({ status }: { status: Document["documentStatus"] }) {
  const map = {
    DRAFT: { label: "Draft", variant: "outline" as const },
    UNDER_REVIEW: { label: "Under Review", variant: "secondary" as const },
    APPROVED: { label: "Approved", variant: "default" as const },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant} className="text-xs">{label}</Badge>
}

export function DocumentsPage() {
  const { data: documents = [], isLoading: docsLoading } = useDocuments()
  const deleteDocument = useDeleteDocument()
  const triggerOcr = useTriggerOcr()

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument.mutateAsync(id)
      toast.success("Document deleted")
    } catch {
      toast.error("Failed to delete document")
    }
  }

  const handleTriggerExtraction = async (docId: string) => {
    try {
      await triggerOcr.mutateAsync(docId)
      toast.success("AI extraction triggered")
    } catch {
      toast.error("Failed to trigger extraction")
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <FolderOpen className="h-5 w-5 text-gray-500" />
          <h1 className="text-xl font-semibold text-gray-900">Documents</h1>
        </div>
        <p className="text-sm text-gray-500 ml-8">Files processed for AI extraction and general ledger</p>
      </div>

      {/* Documents list */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          All Documents {documents.length > 0 && `(${documents.length})`}
        </p>

        {docsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No documents yet. Files uploaded during ledger creation will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <FileTypeIcon type={doc.mimeType ?? ""} className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {doc.name ?? doc.id}
                  </p>
                  {doc.size && (
                    <p className="text-xs text-gray-400">{formatBytes(Number(doc.size))}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ExtractionStatusBadge status={doc.extractionStatus} />
                  <DocumentStatusBadge status={doc.documentStatus} />
                  {doc.extractionStatus === "FAILED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTriggerExtraction(doc.id)}
                      className="text-xs h-7"
                    >
                      Retry
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-destructive"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
