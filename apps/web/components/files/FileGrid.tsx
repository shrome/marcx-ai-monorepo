"use client"

import { useState } from "react"
import {
  FileText,
  ImageIcon,
  Folder,
  MoreVertical,
  Download,
  Trash2,
  Pencil,
  FileVideo,
  FileAudio,
  FileArchive,
  File,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { File as FileType, Folder as FolderType } from "@marcx/db"

interface FileGridProps {
  files: FileType[]
  folders: FolderType[]
  onOpenFolder: (id: string) => void
  onDeleteFile: (id: string) => void
  onDeleteFolder: (id: string) => void
  onRenameFile: (id: string, name: string) => void
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon
  if (type.startsWith("video/")) return FileVideo
  if (type.startsWith("audio/")) return FileAudio
  if (type.includes("zip") || type.includes("rar") || type.includes("tar")) return FileArchive
  if (type.includes("pdf") || type.includes("document") || type.includes("text")) return FileText
  return File
}

function formatFileSize(bytes: string | number) {
  const size = typeof bytes === "string" ? Number.parseInt(bytes) : bytes
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function FileGrid({ files, folders, onOpenFolder, onDeleteFile, onDeleteFolder, onRenameFile }: FileGridProps) {
  const [renameDialog, setRenameDialog] = useState<{ id: string; name: string } | null>(null)

  const handleRename = () => {
    if (renameDialog && renameDialog.name.trim()) {
      onRenameFile(renameDialog.id, renameDialog.name.trim())
      setRenameDialog(null)
    }
  }

  if (files.length === 0 && folders.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Folder className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">No files yet</h3>
          <p className="text-muted-foreground">Upload files or create folders to get started</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
        {/* Folders */}
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="group relative flex flex-col items-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
            onDoubleClick={() => onOpenFolder(folder.id)}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpenFolder(folder.id)}>Open</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDeleteFolder(folder.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Folder className="h-12 w-12 text-primary mb-2" />
            <p className="text-sm font-medium text-center truncate w-full">{folder.name}</p>
          </div>
        ))}

        {/* Files */}
        {files.map((file) => {
          const Icon = getFileIcon(file.type)
          return (
            <div
              key={file.id}
              className="group relative flex flex-col items-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRenameDialog({ id: file.id, name: file.name })}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDeleteFile(file.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {file.type.startsWith("image/") ? (
                <div className="h-12 w-12 mb-2 rounded overflow-hidden">
                  <img src={file.url || "/placeholder.svg"} alt={file.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <Icon className="h-12 w-12 text-muted-foreground mb-2" />
              )}
              <p className="text-sm font-medium text-center truncate w-full">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
          )
        })}
      </div>

      {/* Rename Dialog */}
      <Dialog open={!!renameDialog} onOpenChange={() => setRenameDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename file</DialogTitle>
          </DialogHeader>
          <Input
            value={renameDialog?.name || ""}
            onChange={(e) => setRenameDialog((prev) => (prev ? { ...prev, name: e.target.value } : null))}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
