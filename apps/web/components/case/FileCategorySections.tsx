"use client"

import { useState } from "react"
import { FileIcon, FileText, ImageIcon, Download, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CaseFile {
  id: string
  name: string
  url: string
  size: string
  type: string
  category: "PENDING" | "INVOICE" | "RECEIPTS"
}

interface FileCategorySectionsProps {
  files: CaseFile[]
  onCategoryChange: (fileId: string, newCategory: "PENDING" | "INVOICE" | "RECEIPTS") => void
}

const categories = [
  { id: "PENDING" as const, label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { id: "INVOICE" as const, label: "Invoices", color: "bg-blue-100 text-blue-800" },
  { id: "RECEIPTS" as const, label: "Receipts", color: "bg-green-100 text-green-800" },
]

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon
  if (type.includes("pdf") || type.includes("document")) return FileText
  return FileIcon
}

export function FileCategorySections({ files, onCategoryChange }: FileCategorySectionsProps) {
  const [draggedFile, setDraggedFile] = useState<string | null>(null)
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null)

  const handleDragStart = (fileId: string) => {
    setDraggedFile(fileId)
  }

  const handleDragEnd = () => {
    setDraggedFile(null)
    setDragOverCategory(null)
  }

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault()
    setDragOverCategory(categoryId)
  }

  const handleDragLeave = () => {
    setDragOverCategory(null)
  }

  const handleDrop = (e: React.DragEvent, categoryId: "PENDING" | "INVOICE" | "RECEIPTS") => {
    e.preventDefault()
    if (draggedFile) {
      onCategoryChange(draggedFile, categoryId)
    }
    setDraggedFile(null)
    setDragOverCategory(null)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Documents</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((category) => {
          const categoryFiles = files.filter((file) => file.category === category.id)
          const isDragOver = dragOverCategory === category.id

          return (
            <div
              key={category.id}
              onDragOver={(e) => handleDragOver(e, category.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, category.id)}
              className={`rounded-lg border-2 transition-all ${
                isDragOver ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-card"
              }`}
            >
              <div className={`px-4 py-3 border-b ${category.color}`}>
                <h3 className="font-medium">{category.label}</h3>
                <p className="text-xs opacity-75">{categoryFiles.length} files</p>
              </div>

              <div className="p-3 space-y-2 min-h-[200px]">
                {categoryFiles.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                    Drop files here
                  </div>
                ) : (
                  categoryFiles.map((file) => {
                    const Icon = getFileIcon(file.type)
                    const isDragging = draggedFile === file.id

                    return (
                      <div
                        key={file.id}
                        draggable
                        onDragStart={() => handleDragStart(file.id)}
                        onDragEnd={handleDragEnd}
                        className={`group flex items-center gap-3 p-3 rounded-lg border bg-background cursor-move transition-all ${
                          isDragging ? "opacity-50 scale-95" : "hover:shadow-md hover:border-primary/50"
                        }`}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.size}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          asChild
                        >
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
