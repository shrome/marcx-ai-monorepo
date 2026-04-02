'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBackendClient } from '@/lib/backend'
import type { CreateInvitationBody } from '@/lib/backend'

const backend = createBackendClient()

const invitationKeys = {
  all: ['invitations'] as const,
  list: (companyId: string) => [...invitationKeys.all, 'list', companyId] as const,
  token: (token: string) => [...invitationKeys.all, 'token', token] as const,
}

export function useInvitations(companyId: string) {
  return useQuery({
    queryKey: invitationKeys.list(companyId),
    queryFn: () => backend.invitation.list(companyId),
    enabled: !!companyId,
  })
}

export function useInvitationByToken(token: string) {
  return useQuery({
    queryKey: invitationKeys.token(token),
    queryFn: () => backend.invitation.getByToken(token),
    enabled: !!token,
    retry: false,
  })
}

export function useCreateInvitation(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateInvitationBody) => backend.invitation.create(companyId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationKeys.list(companyId) })
    },
  })
}

export function useRevokeInvitation(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invitationId: string) => backend.invitation.revoke(companyId, invitationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationKeys.list(companyId) })
    },
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => backend.invitation.accept(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sessions'] })
      void queryClient.invalidateQueries({ queryKey: ['company'] })
    },
  })
}
