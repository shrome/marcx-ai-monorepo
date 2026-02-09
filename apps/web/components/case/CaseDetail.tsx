"use client"

import { FileCategorySections } from "./FileCategorySections"
import { trpc } from "@/trpc/client"

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
  const { data: caseData, isLoading } = trpc.case.findOne.useQuery({ id: sessionId })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="text-center text-muted-foreground">Loading case details...</div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="text-center text-muted-foreground">Case not found</div>
      </div>
    )
  }

  // Map files to the expected format with default category
  const files: CaseFile[] = (caseData.files || []).map((file: any) => ({
    id: file.id,
    name: file.name,
    url: file.url,
    size: file.size?.toString() || "0",
    type: file.type,
    category: "PENDING" as const, // Default category, can be extended
  }))

  const handleCategoryChange = (fileId: string, newCategory: "PENDING" | "INVOICE" | "RECEIPTS") => {
    // TODO: Implement API call to update file category
    console.log(`Update file ${fileId} to category ${newCategory}`)
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
            <p className="font-medium">{caseData.caseInfo?.clientName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Created</p>
            <p className="font-medium">{new Date(caseData.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
            <p className="font-medium">{new Date(caseData.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* File Categories */}
      <FileCategorySections files={files} onCategoryChange={handleCategoryChange} />
    </div>
  )
}
