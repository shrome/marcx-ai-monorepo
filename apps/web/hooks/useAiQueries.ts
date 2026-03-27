import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createBackendClient } from "@/lib/backend"
import type { Account } from "@/lib/backend"

const backend = createBackendClient()

export const aiKeys = {
  all: ["ai"] as const,
  ocrStatus: (docId: string) => [...aiKeys.all, "ocr", docId] as const,
  glStatus: (fiscalYear?: number) => [...aiKeys.all, "gl", "status", fiscalYear] as const,
  glTransactions: (filters: Record<string, unknown>) => [...aiKeys.all, "gl", "transactions", filters] as const,
  chartOfAccounts: () => [...aiKeys.all, "chart-of-accounts"] as const,
  categorisationRules: () => [...aiKeys.all, "categorisation-rules"] as const,
  llmUsage: (period?: string) => [...aiKeys.all, "llm-usage", period] as const,
}

export function useOcrStatus(docId: string, enabled = true) {
  return useQuery({
    queryKey: aiKeys.ocrStatus(docId),
    queryFn: () => backend.ai.getOcrStatus(docId),
    enabled: !!docId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'PENDING' || status === 'PROCESSING' ? 3000 : false
    },
  })
}

export function useTriggerOcr() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (docId: string) => backend.ai.triggerOcr(docId),
    onSuccess: (_, docId) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.ocrStatus(docId) })
    },
  })
}

export function useEnrichDocument() {
  return useMutation({
    mutationFn: (docId: string) => backend.ai.enrichDocument(docId),
  })
}

export function useGLStatus(fiscalYear?: number) {
  return useQuery({
    queryKey: aiKeys.glStatus(fiscalYear),
    queryFn: () => backend.ai.getGLStatus(fiscalYear ? { fiscal_year: fiscalYear } : undefined),
  })
}

export function useGLTransactions(filters?: {
  fiscal_year?: number
  page?: number
  limit?: number
  account?: string
  type?: "debit" | "credit"
}) {
  return useQuery({
    queryKey: aiKeys.glTransactions(filters ?? {}),
    queryFn: () => backend.ai.getGLTransactions(filters),
  })
}

export function useExportGL() {
  return useMutation({
    mutationFn: (fiscalYear?: number) => backend.ai.exportGL(fiscalYear),
  })
}

export function useUploadGL() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, fiscalYear }: { file: File; fiscalYear: number }) =>
      backend.ai.uploadGL(file, fiscalYear),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...aiKeys.all, "gl"] })
    },
  })
}

export function useChartOfAccounts() {
  return useQuery({
    queryKey: aiKeys.chartOfAccounts(),
    queryFn: () => backend.ai.getChartOfAccounts(),
  })
}

export function useUpsertChartOfAccounts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (accounts: Account[]) => backend.ai.upsertChartOfAccounts(accounts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.chartOfAccounts() })
    },
  })
}

export function useCategorisationRules() {
  return useQuery({
    queryKey: aiKeys.categorisationRules(),
    queryFn: () => backend.ai.getCategorisationRules(),
  })
}

export function useLlmUsage(period?: string) {
  return useQuery({
    queryKey: aiKeys.llmUsage(period),
    queryFn: () => backend.ai.getLlmUsage(period),
  })
}

export function useSetLlmBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => backend.ai.setLlmBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...aiKeys.all, "llm-usage"] })
    },
  })
}
