import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createBackendClient } from "@/lib/backend"
import type { UpdateDocumentDraftDto, ListDocumentsQuery } from "@/lib/backend"

const backend = createBackendClient()

export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (filters: ListDocumentsQuery) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
}

export function useDocuments(query?: ListDocumentsQuery) {
  return useQuery({
    queryKey: documentKeys.list(query ?? {}),
    queryFn: () => backend.document.findAll(query),
    select: (data) => data.data,
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => backend.document.findOne(id),
    enabled: !!id,
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, companyId, sessionId }: { file: File; companyId: string; sessionId?: string }) =>
      backend.document.upload(file, companyId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}

export function useUpdateDocumentDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentDraftDto }) =>
      backend.document.updateDraft(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}

export function useApproveDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => backend.document.approve(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => backend.document.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}
