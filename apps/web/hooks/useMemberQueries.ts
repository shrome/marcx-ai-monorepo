import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createBackendClient } from "@/lib/backend"
import type { InviteMemberDto, UpdateMemberRoleDto } from "@/lib/backend"

const backend = createBackendClient()

export const memberKeys = {
  all: ["members"] as const,
  list: (companyId: string) => [...memberKeys.all, "list", companyId] as const,
}

export function useCompanyMembers(companyId: string) {
  return useQuery({
    queryKey: memberKeys.list(companyId),
    queryFn: () => backend.member.list(companyId),
    enabled: !!companyId,
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: InviteMemberDto }) =>
      backend.member.invite(companyId, data),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(companyId) })
    },
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      companyId,
      memberId,
      data,
    }: {
      companyId: string
      memberId: string
      data: UpdateMemberRoleDto
    }) => backend.member.updateRole(companyId, memberId, data),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(companyId) })
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ companyId, memberId }: { companyId: string; memberId: string }) =>
      backend.member.remove(companyId, memberId),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(companyId) })
    },
  })
}
