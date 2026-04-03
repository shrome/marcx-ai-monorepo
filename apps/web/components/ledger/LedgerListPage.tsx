'use client'

import { useState } from 'react'
import { BookOpen, Plus, Calendar, FileText, ArrowRight } from 'lucide-react'
import { useLedgers } from '@/hooks/useLedgerQueries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateLedgerDialog } from '@/components/ledger/CreateLedgerDialog'
import { useRouter } from 'next/navigation'
import type { Ledger } from '@/lib/backend'

function LedgerCard({ ledger }: { ledger: Ledger }) {
  const router = useRouter()
  const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    ACTIVE: 'default',
    CLOSED: 'secondary',
    ARCHIVED: 'outline',
  }
  return (
    <Card
      className="cursor-pointer hover:border-foreground/40 transition-colors group"
      onClick={() => router.push(`/ledger/${ledger.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
            <CardTitle className="text-base truncate">{ledger.name}</CardTitle>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>FY {ledger.fiscalYear}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {ledger.description && (
          <CardDescription className="line-clamp-2 text-xs mb-3">
            {ledger.description}
          </CardDescription>
        )}
        <div className="flex items-center justify-between">
          <Badge variant={statusVariant[ledger.status] ?? 'outline'} className="text-xs capitalize">
            {ledger.status.toLowerCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(ledger.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function LedgerSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-20 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-full mb-3" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

export function LedgerListPage() {
  const router = useRouter()
  const { data: ledgers, isLoading, error } = useLedgers()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="flex flex-col h-full">
      <CreateLedgerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b">
        <div>
          <h1 className="text-xl font-semibold">General Ledger</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your accounting ledgers and financial records
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Ledger
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <LedgerSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-sm font-medium text-destructive">Failed to load ledgers</p>
            <p className="text-xs text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'}
            </p>
          </div>
        ) : !ledgers?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-sm font-semibold mb-1">No ledgers yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Create your first General Ledger to start organising invoices and financial documents by fiscal year.
            </p>
            <Button className="mt-5" size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create your first ledger
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ledgers.map((ledger) => (
              <LedgerCard key={ledger.id} ledger={ledger} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
