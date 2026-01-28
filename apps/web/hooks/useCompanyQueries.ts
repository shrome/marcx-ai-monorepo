import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createBackendClient } from "@/lib/backend"
import type { CreateCompanyDto, UpdateCompanyDto } from "@/lib/backend/types"
import { authKeys } from "./useAuthQueries"

// Create backend client instance
const backend = createBackendClient()

// Query keys for caching
export const companyKeys = {
  all: ["company"] as const,
  lists: () => [...companyKeys.all, "list"] as const,
  list: (filters: string) => [...companyKeys.lists(), { filters }] as const,
  details: () => [...companyKeys.all, "detail"] as const,
  detail: (id: string) => [...companyKeys.details(), id] as const,
}

/**
 * Hook to get all companies
 */
export function useCompanies() {
  return useQuery({
    queryKey: companyKeys.lists(),
    queryFn: async () => {
      return await backend.company.findAll()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get a single company
 */
export function useCompany(id: string) {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: async () => {
      return await backend.company.findOne(id)
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to create a new company
 */
export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCompanyDto) => {
      return await backend.company.create(data)
    },
    onSuccess: () => {
      // Invalidate and refetch companies list
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
    },
  })
}

/**
 * Hook to register a company for the current user
 * Creates company and assigns it to the authenticated user
 */
export function useRegisterCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCompanyDto) => {
      return await backend.company.register(data)
    },
    onSuccess: (data) => {
      // Update current user cache with new companyId
      queryClient.setQueryData(authKeys.currentUser(), { user: data.user })
      // Invalidate companies list
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
      // Invalidate current user to refetch with company data
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() })
    },
  })
}

/**
 * Hook to update a company
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCompanyDto }) => {
      return await backend.company.update(id, data)
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(data.id) })
    },
  })
}

/**
 * Hook to delete a company
 */
export function useDeleteCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await backend.company.remove(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
    },
  })
}
