import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Transaction, TransactionCreatePayload } from '~/types/transaction'

export const transactionsQueryKey = ['transactions'] as const

const OPTIMISTIC_ID_PREFIX = 'opt-'

export function useTransactions() {
  return useQuery({
    queryKey: transactionsQueryKey,
    queryFn: () => $fetch<Transaction[]>('/api/transactions'),
  })
}

/** Проверяет, что транзакция добавлена оптимистично (ещё без ответа сервера). */
export function isOptimisticTransaction(t: Transaction): boolean {
  return t.id.startsWith(OPTIMISTIC_ID_PREFIX)
}

export function useAddTransaction() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (payload: TransactionCreatePayload) =>
      $fetch<Transaction>('/api/transactions', {
        method: 'POST',
        body: {
          ...payload,
          date: payload.date ?? undefined,
          description: payload.description ?? undefined,
        },
      }),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: transactionsQueryKey })
      const previousData = queryClient.getQueryData<Transaction[]>(transactionsQueryKey)
      const optimistic: Transaction = {
        id: `${OPTIMISTIC_ID_PREFIX}${Date.now()}`,
        user_id: '',
        amount: payload.amount,
        type: payload.type,
        category: payload.category,
        date: payload.date ?? new Date().toISOString(),
        description: payload.description ?? '',
      }
      queryClient.setQueryData<Transaction[]>(transactionsQueryKey, (old) =>
        old ? [optimistic, ...old] : [optimistic]
      )
      return { previousData }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(transactionsQueryKey, context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionsQueryKey })
    },
  })

  return mutation
}
