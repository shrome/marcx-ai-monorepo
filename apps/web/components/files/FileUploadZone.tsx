"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface UploadingFile {
  name: string
  progress: number
}

interface FileUploadZoneProps {
  onUploadComplete: (file: { name: string; url: string; size: string; type: string }) => void
}

export function FileUploadZone({ onUploadComplete }: FileUploadZoneProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([])

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    // Add to uploading list
    setUploading((prev) => [...prev, { name: file.name, progress: 0 }])

    try {
      // Simulate progress for demo
      const progressInterval = setInterval(() => {
        setUploading((prev) =>
          prev.map((f) => (f.name === file.name ? { ...f, progress: Math.min(f.progress + 20, 90) } : f)),
        )
      }, 200)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) throw new Error("Upload failed")

      const blob = await response.json()

      // Complete progress
      setUploading((prev) => prev.map((f) => (f.name === file.name ? { ...f, progress: 100 } : f)))

      // Notify parent
      onUploadComplete({
        name: file.name,
        url: blob.url,
        size: file.size.toString(),
        type: file.type,
      })

      // Remove from uploading list after delay
      setTimeout(() => {
        setUploading((prev) => prev.filter((f) => f.name !== file.name))
      }, 500)
    } catch (error) {
      toast.error(`Failed to upload ${file.name}`)
      setUploading((prev) => prev.filter((f) => f.name !== file.name))
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 50MB allowed.`)
        return
      }
      uploadFile(file)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium mb-1">{isDragActive ? "Drop files here" : "Drag & drop files here"}</p>
        <p className="text-sm text-muted-foreground">or click to browse (max 50MB per file)</p>
      </div>

      {/* Upload progress */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((file) => (
            <div key={file.name} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <Progress value={file.progress} className="h-1 mt-1" />
              </div>
              <span className="text-xs text-muted-foreground">{file.progress}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
