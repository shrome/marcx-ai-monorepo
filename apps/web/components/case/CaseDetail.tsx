"use client"

import { useState } from "react"
import { FileCategorySections } from "./FileCategorySections"

interface CaseFile {
  id: string
  name: string
  url: string
  size: string
  type: string
  category: "PENDING" | "INVOICE" | "RECEIPTS"
}

interface CaseDetailProps {
  sessionId: string
}

export function CaseDetail({ sessionId }: CaseDetailProps) {
  // Mock data - replace with actual API call
  const [caseData] = useState({
    id: sessionId,
    title: "Sample Case",
    description: "This is a sample case description",
    status: "open",
    priority: "medium",
    clientName: "John Doe",
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const [files, setFiles] = useState<CaseFile[]>([
    {
      id: "1",
      name: "contract.pdf",
      url: "#",
      size: "245KB",
      type: "application/pdf",
      category: "PENDING",
    },
    {
      id: "2",
      name: "invoice-001.pdf",
      url: "#",
      size: "120KB",
      type: "application/pdf",
      category: "INVOICE",
    },
    {
      id: "3",
      name: "receipt-001.jpg",
      url: "#",
      size: "89KB",
      type: "image/jpeg",
      category: "RECEIPTS",
    },
  ])

  const handleCategoryChange = (fileId: string, newCategory: "PENDING" | "INVOICE" | "RECEIPTS") => {
    setFiles((prev) =>
      prev.map((file) => (file.id === fileId ? { ...file, category: newCategory } : file))
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Case Information */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{caseData.title}</h1>
            {caseData.description && <p className="text-muted-foreground">{caseData.description}</p>}
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium">
              {caseData.status}
            </span>
            <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-medium capitalize">
              {caseData.priority}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg border bg-card">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Client Name</p>
            <p className="font-medium">{caseData.clientName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Created</p>
            <p className="font-medium">{caseData.createdAt.toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
            <p className="font-medium">{caseData.updatedAt.toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* File Categories */}
      <FileCategorySections files={files} onCategoryChange={handleCategoryChange} />
    </div>
  )
}
