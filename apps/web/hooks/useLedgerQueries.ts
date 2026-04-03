'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBackendClient } from '@/lib/backend'
import type { CreateLedgerDto, UpdateLedgerDto } from '@/lib/backend'

const backend = createBackendClient()

const ledgerKeys = {
  all: ['ledgers'] as const,
  list: () => [...ledgerKeys.all, 'list'] as const,
  detail: (id: string) => [...ledgerKeys.all, 'detail', id] as const,
}

export function useLedgers() {
  return useQuery({
    queryKey: ledgerKeys.list(),
    queryFn: () => backend.ledger.findAll(),
  })
}

export function useLedger(id: string) {
  return useQuery({
    queryKey: ledgerKeys.detail(id),
    queryFn: () => backend.ledger.findOne(id),
    enabled: !!id,
  })
}

export function useCreateLedger() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateLedgerDto) => backend.ledger.create(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ledgerKeys.list() })
    },
  })
}

export function useCreateLedgerWithGL() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      data,
      files,
    }: {
      data: { name: string; fiscalYear: number; description?: string }
      files: File[]
    }) => backend.ledger.createWithGL(data, files),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ledgerKeys.list() })
    },
  })
}

export function useUpdateLedger(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateLedgerDto) => backend.ledger.update(id, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ledgerKeys.list() })
      void queryClient.invalidateQueries({ queryKey: ledgerKeys.detail(id) })
    },
  })
}

export function useDeleteLedger() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => backend.ledger.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ledgerKeys.list() })
    },
  })
}
