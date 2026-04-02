'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, Plus, Calendar, FileText, ArrowRight } from 'lucide-react'
import { useSessions } from '@/hooks/useBackendQueries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Session } from '@/lib/backend'

function LedgerCard({ session }: { session: Session }) {
  const router = useRouter()
  return (
    <Card
      className="cursor-pointer hover:border-foreground/40 transition-colors group"
      onClick={() => router.push(`/ledger/${session.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
            <CardTitle className="text-base truncate">{session.title}</CardTitle>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {session.fiscalYear && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>FY {session.fiscalYear}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {session.description && (
          <CardDescription className="line-clamp-2 text-xs mb-3">
            {session.description}
          </CardDescription>
        )}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs capitalize">
            {session.status.replace('_', ' ')}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(session.createdAt).toLocaleDateString(undefined, {
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
  const { data: sessions, isLoading, error } = useSessions()

  const ledgerSessions = sessions?.filter((s) => s.fiscalYear) ?? []

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b">
        <div>
          <h1 className="text-xl font-semibold">General Ledger</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your accounting ledgers and financial records
          </p>
        </div>
        <Button size="sm" onClick={() => router.push('/chat')}>
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
        ) : ledgerSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-sm font-semibold mb-1">No ledgers yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Start a new chat session with a fiscal year to create your first General Ledger. Upload invoices and documents to get started.
            </p>
            <Button className="mt-5" size="sm" onClick={() => router.push('/chat')}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create your first ledger
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ledgerSessions.map((session) => (
              <LedgerCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
