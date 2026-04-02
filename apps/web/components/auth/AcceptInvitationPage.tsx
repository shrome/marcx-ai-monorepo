'use client'

import { useRouter } from 'next/navigation'
import { Building2, UserPlus, LogIn, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useInvitationByToken, useAcceptInvitation } from '@/hooks/useInvitationQueries'
import { useAuth } from '@/components/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Administrator',
  ACCOUNTANT: 'Accountant',
  VIEWER: 'Viewer',
}

interface Props {
  token: string
}

export function AcceptInvitationPage({ token }: Props) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { data: invitation, isLoading, error } = useInvitationByToken(token)
  const acceptMutation = useAcceptInvitation()

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync(token)
      toast.success(`You've joined ${invitation?.company?.name ?? 'the company'} as ${ROLE_LABELS[invitation?.role ?? ''] ?? invitation?.role}!`)
      router.push('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept invitation'
      toast.error(message)
    }
  }

  const handleRegister = () => {
    router.push(`/register?invitation=${token}`)
  }

  const handleLogin = () => {
    router.push(`/login?redirect=/invitations/${token}`)
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto mt-2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invitation Invalid</CardTitle>
            <CardDescription>
              {error instanceof Error
                ? error.message
                : 'This invitation link is invalid, expired, or has already been used.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" variant="outline" onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (acceptMutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>You're in!</CardTitle>
            <CardDescription>
              You've successfully joined <strong>{invitation.company?.name}</strong>.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push('/')}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>You've been invited</CardTitle>
          <CardDescription>
            {invitation.invitedByUser?.name ?? 'Someone'} has invited you to join a company on MarcX AI
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Company Info */}
          <div className="rounded-lg border p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{invitation.company?.name ?? 'Company'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-muted-foreground">Role:</p>
                <Badge variant="secondary" className="text-xs">
                  {ROLE_LABELS[invitation.role] ?? invitation.role}
                </Badge>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This invitation expires on{' '}
            {new Date(invitation.expiresAt).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {user ? (
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
          ) : (
            <>
              <Button className="w-full" onClick={handleRegister}>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account & Accept
              </Button>
              <Button className="w-full" variant="outline" onClick={handleLogin}>
                <LogIn className="h-4 w-4 mr-2" />
                Log In & Accept
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
