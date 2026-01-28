"use client"

import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { CaseDetail } from "@/components/case/CaseDetail"

export default function CaseDetailPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/case">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Cases
            </Button>
          </Link>
        </div>
      </header>
      <CaseDetail sessionId={sessionId} />
    </div>
  )
}
