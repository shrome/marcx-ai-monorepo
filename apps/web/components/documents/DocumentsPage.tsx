"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import {
  Upload,
  FileText,
  ImageIcon,
  FileArchive,
  X,
  CheckCircle2,
  Loader2,
  FolderOpen,
  AlertCircle,
  Clock,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAuth } from "@/components/AuthContext"
import { useDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/useDocumentQueries"
import { useTriggerOcr } from "@/hooks/useAiQueries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Document } from "@/lib/backend"

interface StagedFile {
  id: string
  file: File
  status: "pending" | "uploading" | "done" | "error"
  progress: number
}

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
  const { user } = useAuth()
  const companyId = user?.companyId ?? ""

  const { data: documents = [], isLoading: docsLoading } = useDocuments()
  const uploadDocument = useUploadDocument()
  const deleteDocument = useDeleteDocument()
  const triggerOcr = useTriggerOcr()

  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: StagedFile[] = acceptedFiles
      .filter((f) => {
        if (f.size > 50 * 1024 * 1024) {
          toast.error(`${f.name} exceeds the 50MB limit`)
          return false
        }
        return true
      })
      .map((f) => ({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        file: f,
        status: "pending" as const,
        progress: 0,
      }))
    setStagedFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "image/*": [],
      "application/pdf": [],
      "text/*": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
      "application/vnd.ms-excel": [],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
    },
  })

  const removeFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const uploadSingle = async (staged: StagedFile): Promise<void> => {
    setStagedFiles((prev) =>
      prev.map((f) => (f.id === staged.id ? { ...f, status: "uploading", progress: 50 } : f))
    )

    try {
      const doc = await uploadDocument.mutateAsync({
        file: staged.file,
        companyId,
      })

      setStagedFiles((prev) =>
        prev.map((f) => (f.id === staged.id ? { ...f, status: "done", progress: 100 } : f))
      )

      // Auto-trigger OCR extraction after upload
      if (doc.id) {
        triggerOcr.mutate(doc.id)
      }
    } catch {
      setStagedFiles((prev) =>
        prev.map((f) => (f.id === staged.id ? { ...f, status: "error", progress: 0 } : f))
      )
      toast.error(`Failed to upload ${staged.file.name}`)
    }
  }

  const handleUpload = async () => {
    if (!companyId) {
      toast.error("No company associated with your account")
      return
    }
    const pending = stagedFiles.filter((f) => f.status === "pending" || f.status === "error")
    if (pending.length === 0) return
    setIsUploading(true)
    await Promise.all(pending.map(uploadSingle))
    setIsUploading(false)
    toast.success(`${pending.length} file${pending.length > 1 ? "s" : ""} uploaded successfully`)
  }

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

  const pendingCount = stagedFiles.filter((f) => f.status === "pending" || f.status === "error").length

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <FolderOpen className="h-5 w-5 text-gray-500" />
          <h1 className="text-xl font-semibold text-gray-900">Documents</h1>
        </div>
        <p className="text-sm text-gray-500 ml-8">Upload files for AI extraction and general ledger processing</p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
          isDragActive
            ? "border-gray-900 bg-gray-50"
            : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Upload className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              or <span className="text-blue-600 font-medium">browse to upload</span>
              {" · "}PDF, Word, Excel, Images up to 50MB
            </p>
          </div>
        </div>
      </div>

      {/* Staged files list */}
      {stagedFiles.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Staged ({stagedFiles.length})
          </p>
          {stagedFiles.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FileTypeIcon type={f.file.type} className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{f.file.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(f.file.size)}</p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {f.status === "pending" && (
                  <button
                    onClick={() => removeFile(f.id)}
                    disabled={isUploading}
                    className="h-6 w-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {f.status === "uploading" && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
                {f.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {f.status === "error" && <span className="text-xs text-red-500 font-medium">Failed</span>}
              </div>
            </div>
          ))}

          {pendingCount > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload {pendingCount} file{pendingCount > 1 ? "s" : ""}
                  </>
                )}
              </button>
              {!isUploading && (
                <button
                  onClick={() => setStagedFiles((prev) => prev.filter((f) => f.status === "done"))}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear pending
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Documents list */}
      <div className="mt-10">
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
            <p className="text-sm">No documents yet. Upload your first file above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {doc.file?.name ?? doc.id}
                  </p>
                  {doc.file?.size && (
                    <p className="text-xs text-gray-400">{formatBytes(doc.file.size)}</p>
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
