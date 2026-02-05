/**
 * TanStack Query hooks for backend API calls
 * This file provides hooks for Case, Chat, Company, and Session APIs
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createBackendClient } from "@/lib/backend"
import type {
  CreateCaseDto,
  UpdateCaseDto,
  CreateMessageDto,
  Case,
  Message,
} from "@/lib/backend/types"

// Create backend client instance
const backend = createBackendClient()

// ============================================================================
// CASE QUERIES
// ============================================================================

export const caseKeys = {
  all: ["cases"] as const,
  lists: () => [...caseKeys.all, "list"] as const,
  list: (filters: string) => [...caseKeys.lists(), { filters }] as const,
  details: () => [...caseKeys.all, "detail"] as const,
  detail: (id: string) => [...caseKeys.details(), id] as const,
}

/**
 * Hook to get all cases
 */
export function useCases() {
  return useQuery({
    queryKey: caseKeys.lists(),
    queryFn: async () => {
      return await backend.case.findAll()
    },
  })
}

/**
 * Hook to get a single case by ID
 */
export function useCase(id: string) {
  return useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: async () => {
      return await backend.case.findOne(id)
    },
    enabled: !!id,
  })
}

/**
 * Hook to create a new case
 */
export function useCreateCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ data, files }: { data: CreateCaseDto; files?: File[] }) => {
      return await backend.case.create(data, files)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
    },
  })
}

/**
 * Hook to update a case
 */
export function useUpdateCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCaseDto }) => {
      return await backend.case.update(id, data)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
    },
  })
}

/**
 * Hook to delete a case
 */
export function useDeleteCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await backend.case.remove(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all })
    },
  })
}

// ============================================================================
// CHAT/MESSAGE QUERIES
// ============================================================================

export const chatKeys = {
  all: ["chat"] as const,
  messages: (sessionId: string) => [...chatKeys.all, "messages", sessionId] as const,
}

/**
 * Hook to get messages for a session
 */
export function useMessages(sessionId: string) {
  return useQuery({
    queryKey: chatKeys.messages(sessionId),
    queryFn: async () => {
      return await backend.chat.getMessages(sessionId)
    },
    enabled: !!sessionId,
  })
}

/**
 * Hook to create a new message
 */
export function useCreateMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      data,
      files,
    }: {
      sessionId: string
      data: CreateMessageDto
      files?: File[]
    }) => {
      return await backend.chat.createMessage(sessionId, data, files)
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(sessionId) })
    },
  })
}

// ============================================================================
// SESSION QUERIES
// ============================================================================

export const sessionKeys = {
  all: ["sessions"] as const,
  lists: () => [...sessionKeys.all, "list"] as const,
  details: () => [...sessionKeys.all, "detail"] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
}

/**
 * Hook to get all sessions
 */
export function useSessions() {
  return useQuery({
    queryKey: sessionKeys.lists(),
    queryFn: async () => {
      return await backend.session.findAll()
    },
  })
}

/**
 * Hook to get a single session by ID
 */
export function useSession(id: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: async () => {
      return await backend.session.findOne(id)
    },
    enabled: !!id,
  })
}

/**
 * Hook to create a new chat session (uses user's company automatically)
 */
export function useCreateChatSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data?: { title?: string }) => {
      return await backend.session.createChatSession(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() })
    },
  })
}

/**
 * Hook to create a new session
 */
export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      type: "CHAT" | "CASE"
      title: string
      description?: string
      priority?: "low" | "medium" | "high"
      companyId?: string
    }) => {
      return await backend.session.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() })
    },
  })
}

/**
 * Hook to update a session
 */
export function useUpdateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title?: string } }) => {
      return await backend.session.update(id, data)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() })
    },
  })
}

/**
 * Hook to delete a session
 */
export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await backend.session.remove(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
    },
  })
}

// ============================================================================
// COMPANY QUERIES
// ============================================================================

export const companyKeys = {
  all: ["companies"] as const,
  lists: () => [...companyKeys.all, "list"] as const,
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
  })
}

/**
 * Hook to get a single company by ID
 */
export function useCompany(id: string) {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: async () => {
      return await backend.company.findOne(id)
    },
    enabled: !!id,
  })
}

/**
 * Hook to create a new company
 */
export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      category: "ACCOUNTING" | "MARKETING"
      description?: string
      website?: string
    }) => {
      return await backend.company.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
    },
  })
}

/**
 * Hook to update a company
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: {
        name?: string
        category?: "ACCOUNTING" | "MARKETING"
        description?: string
        website?: string
      }
    }) => {
      return await backend.company.update(id, data)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
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
      queryClient.invalidateQueries({ queryKey: companyKeys.all })
    },
  })
}
