'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateLedgerWithGL } from '@/hooks/useLedgerQueries'

interface CreateLedgerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function CreateLedgerDialog({ open, onOpenChange }: CreateLedgerDialogProps) {
  const router = useRouter()
  const createWithGL = useCreateLedgerWithGL()

  const currentYear = new Date().getFullYear()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [fiscalYear, setFiscalYear] = useState(currentYear)
  const [files, setFiles] = useState<File[]>([])

  const onDrop = useCallback((accepted: File[]) => {
    const valid = accepted.filter((f) => {
      if (f.size > 50 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 50MB limit`)
        return false
      }
      return true
    })
    setFiles((prev) => [...prev, ...valid])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'application/pdf': [],
      'image/*': [],
      'text/csv': [],
      'application/vnd.ms-excel': [],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
    },
  })

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx))

  const handleReset = () => {
    setName('')
    setDescription('')
    setFiscalYear(currentYear)
    setFiles([])
  }

  const handleClose = () => {
    if (createWithGL.isPending) return
    handleReset()
    onOpenChange(false)
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Ledger name is required')
      return
    }
    if (!fiscalYear || fiscalYear < 2000 || fiscalYear > 2100) {
      toast.error('Please enter a valid fiscal year (2000–2100)')
      return
    }

    try {
      const result = await createWithGL.mutateAsync({
        data: { name: name.trim(), fiscalYear, description: description.trim() || undefined },
        files,
      })

      const failedUploads = result.glUploads.filter((u) => !u.success)
      if (failedUploads.length > 0) {
        toast.warning('Ledger created, but some files failed to upload', {
          description: failedUploads.map((u) => u.file).join(', '),
        })
      } else {
        toast.success('Ledger created successfully', {
          description: files.length > 0
            ? `${files.length} file${files.length > 1 ? 's' : ''} uploaded to GL`
            : `FY ${fiscalYear} ledger is ready`,
        })
      }

      handleReset()
      onOpenChange(false)
      router.push(`/ledger/${result.ledger.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      toast.error('Failed to create ledger', { description: message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Create New Ledger</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="ledger-name" className="text-sm">
              Ledger Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ledger-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. FY 2024 General Ledger"
              disabled={createWithGL.isPending}
            />
          </div>

          {/* Fiscal Year */}
          <div className="space-y-1.5">
            <Label htmlFor="fiscal-year" className="text-sm">
              Fiscal Year <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fiscal-year"
              type="number"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(parseInt(e.target.value, 10))}
              min={2000}
              max={2100}
              disabled={createWithGL.isPending}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm text-muted-foreground">
              Description <span className="text-xs">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this ledger…"
              rows={2}
              className="resize-none"
              disabled={createWithGL.isPending}
            />
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Upload Files <span className="text-xs">(optional — last year GL, bank statements, related docs)</span>
            </Label>
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-gray-600 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50',
                createWithGL.isPending && 'pointer-events-none opacity-50',
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-5 w-5 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {isDragActive ? 'Drop files here' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, Excel, Word, Images up to 50MB</p>
            </div>

            {files.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {files.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50"
                  >
                    <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="flex-1 text-sm text-gray-700 truncate">{f.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">{formatBytes(f.size)}</span>
                    <button
                      onClick={() => removeFile(idx)}
                      disabled={createWithGL.isPending}
                      className="shrink-0 text-gray-400 hover:text-gray-600 disabled:opacity-40"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={createWithGL.isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createWithGL.isPending || !name.trim()}>
            {createWithGL.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Ledger
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
