import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Transaction, TransactionCreatePayload } from '~/types/transaction'

export const transactionsQueryKey = ['transactions'] as const

export type TransactionsParams = {
  page?: number
  limit?: number
  sortBy?: 'date' | 'amount' | 'description' | 'category' | 'type'
  sortOrder?: 'asc' | 'desc'
  category?: string
}

export type TransactionsResponse = {
  data: Transaction[]
  total: number
}

export function useTransactions(params: TransactionsParams = {}) {
  return useQuery({
    queryKey: computed(() => [
      ...transactionsQueryKey,
      params.page ?? 1,
      params.limit ?? 10,
      params.sortBy ?? 'date',
      params.sortOrder ?? 'desc',
      params.category ?? '',
    ]),
    queryFn: () =>
      $fetch<TransactionsResponse>('/api/transactions', {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          sortBy: params.sortBy ?? 'date',
          sortOrder: params.sortOrder ?? 'desc',
          category: params.category || undefined,
        },
      }),
  })
}

export function useAddTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TransactionCreatePayload) =>
      $fetch<Transaction>('/api/transactions', {
        method: 'POST',
        body: {
          ...payload,
          date: payload.date ?? undefined,
          description: payload.description ?? undefined,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionsQueryKey })
    },
  })
}
