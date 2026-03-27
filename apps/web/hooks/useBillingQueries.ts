import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createBackendClient } from "@/lib/backend"
import type { TopUpCreditDto, ListTransactionsQuery } from "@/lib/backend"

const backend = createBackendClient()

export const billingKeys = {
  all: ["billing"] as const,
  balance: (companyId: string) => [...billingKeys.all, "balance", companyId] as const,
  transactions: (companyId: string) => [...billingKeys.all, "transactions", companyId] as const,
}

export function useCreditBalance(companyId: string) {
  return useQuery({
    queryKey: billingKeys.balance(companyId),
    queryFn: () => backend.billing.getBalance(companyId),
    enabled: !!companyId,
  })
}

export function useCreditTransactions(companyId: string, query?: ListTransactionsQuery) {
  return useQuery({
    queryKey: billingKeys.transactions(companyId),
    queryFn: () => backend.billing.listTransactions(companyId, query),
    enabled: !!companyId,
  })
}

export function useTopUpCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: TopUpCreditDto }) =>
      backend.billing.topUp(companyId, data),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.balance(companyId) })
      queryClient.invalidateQueries({ queryKey: billingKeys.transactions(companyId) })
    },
  })
}
