"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, ImageIcon, FileArchive, X, CheckCircle2, Loader2, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface StagedFile {
  id: string
  file: File
  status: "pending" | "uploading" | "done" | "error"
  progress: number
  url?: string
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

export function DocumentsPage() {
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
      prev.map((f) => (f.id === staged.id ? { ...f, status: "uploading", progress: 0 } : f))
    )

    const progressInterval = setInterval(() => {
      setStagedFiles((prev) =>
        prev.map((f) =>
          f.id === staged.id && f.status === "uploading"
            ? { ...f, progress: Math.min(f.progress + 25, 90) }
            : f
        )
      )
    }, 200)

    try {
      const formData = new FormData()
      formData.append("file", staged.file)
      const response = await fetch("/api/upload", { method: "POST", body: formData })
      clearInterval(progressInterval)
      if (!response.ok) throw new Error("Upload failed")
      const blob = await response.json()
      setStagedFiles((prev) =>
        prev.map((f) =>
          f.id === staged.id ? { ...f, status: "done", progress: 100, url: blob.url } : f
        )
      )
    } catch {
      clearInterval(progressInterval)
      setStagedFiles((prev) =>
        prev.map((f) => (f.id === staged.id ? { ...f, status: "error", progress: 0 } : f))
      )
      toast.error(`Failed to upload ${staged.file.name}`)
    }
  }

  const handleUpload = async () => {
    const pending = stagedFiles.filter((f) => f.status === "pending" || f.status === "error")
    if (pending.length === 0) return
    setIsUploading(true)
    await Promise.all(pending.map(uploadSingle))
    setIsUploading(false)
    toast.success(`${pending.length} file${pending.length > 1 ? "s" : ""} uploaded successfully`)
  }

  const pendingCount = stagedFiles.filter((f) => f.status === "pending" || f.status === "error").length
  const doneFiles = stagedFiles.filter((f) => f.status === "done")

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <FolderOpen className="h-5 w-5 text-gray-500" />
          <h1 className="text-xl font-semibold text-gray-900">Documents</h1>
        </div>
        <p className="text-sm text-gray-500 ml-8">Upload and manage your files</p>
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
            Files ({stagedFiles.length})
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
                {f.status === "uploading" && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900 rounded-full transition-all duration-300"
                        style={{ width: `${f.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{f.progress}%</span>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
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
                {f.status === "error" && (
                  <span className="text-xs text-red-500 font-medium">Failed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit button */}
      {pendingCount > 0 && (
        <div className="mt-6 flex items-center gap-3">
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

      {/* Empty state */}
      {stagedFiles.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">No files selected yet</p>
        </div>
      )}

      {/* Done summary */}
      {doneFiles.length > 0 && pendingCount === 0 && (
        <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">
            {doneFiles.length} file{doneFiles.length > 1 ? "s" : ""} uploaded successfully
          </p>
        </div>
      )}
    </div>
  )
}
