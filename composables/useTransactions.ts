import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Transaction, TransactionCreatePayload, TransactionUpdatePayload } from '~/types/transaction'

export const transactionsQueryKey = ['transactions'] as const

export type TransactionsParams = {
  page?: number
  limit?: number
  sortBy?: 'date' | 'amount' | 'description' | 'category' | 'type'
  sortOrder?: 'asc' | 'desc'
  category?: string
  dateFrom?: string
  dateTo?: string
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
      params.dateFrom ?? '',
      params.dateTo ?? '',
    ]),
    queryFn: () =>
      $fetch<TransactionsResponse>('/api/transactions', {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          sortBy: params.sortBy ?? 'date',
          sortOrder: params.sortOrder ?? 'desc',
          category: params.category || undefined,
          dateFrom: params.dateFrom || undefined,
          dateTo: params.dateTo || undefined,
        },
      }),
    placeholderData: (previousData) => previousData,
  })
}

export function useAddTransaction() {
  const queryClient = useQueryClient()

  type OptimisticContext = {
    tempId: string
    previous: Array<[unknown[], TransactionsResponse | undefined]>
  }

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
    onMutate: async (payload): Promise<OptimisticContext> => {
      const tempId = `optimistic-${Date.now()}`
      const optimisticDate = payload.date ?? new Date().toISOString()

      const optimisticTx: Transaction = {
        id: tempId,
        user_id: 'optimistic-user',
        amount: payload.amount,
        type: payload.type,
        category: payload.category,
        date: optimisticDate,
        description: payload.description ?? '',
      }

      // При старте мутации: отменяем текущие запросы и показываем временную запись в UI.
      await queryClient.cancelQueries({ queryKey: transactionsQueryKey, exact: false })

      const previous = queryClient.getQueriesData<TransactionsResponse>({
        queryKey: transactionsQueryKey,
        exact: false,
      }) as Array<[unknown[], TransactionsResponse | undefined]>

      for (const [queryKey, old] of previous) {
        if (!old) continue

        const keyArr = queryKey as unknown[]
        const page = Number(keyArr[1] ?? 1) || 1
        const limit = Number(keyArr[2] ?? 10) || 10
        const sortBy = (keyArr[3] ?? 'date') as TransactionsParams['sortBy']
        const sortOrder = (keyArr[4] ?? 'desc') as TransactionsParams['sortOrder']
        const categoryFilter = (keyArr[5] ?? '') as string
        const dateFrom = (keyArr[6] ?? '') as string
        const dateTo = (keyArr[7] ?? '') as string

        const matchesCategory = (() => {
          if (!categoryFilter) return true
          const needle = categoryFilter.toLowerCase()
          const cat = optimisticTx.category.toLowerCase()
          const desc = (optimisticTx.description ?? '').toLowerCase()
          return cat.includes(needle) || desc.includes(needle)
        })()

        const matchesDate = (() => {
          if (!dateFrom && !dateTo) return true
          const txTime = new Date(optimisticTx.date).getTime()
          const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : -Infinity
          const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : Infinity
          return txTime >= fromTime && txTime <= toTime
        })()

        if (!matchesCategory || !matchesDate) continue

        const dir = sortOrder === 'asc' ? 1 : -1

        const sorted = [...old.data, optimisticTx].sort((a, b) => {
          const by = sortBy ?? 'date'
          let av: number | string = ''
          let bv: number | string = ''

          if (by === 'amount') {
            av = a.amount
            bv = b.amount
            return dir * (Number(av) - Number(bv))
          }

          if (by === 'date') {
            av = new Date(a.date).getTime()
            bv = new Date(b.date).getTime()
            return dir * (Number(av) - Number(bv))
          }

          if (by === 'description') {
            av = a.description ?? ''
            bv = b.description ?? ''
            return dir * String(av).localeCompare(String(bv), 'ru')
          }

          if (by === 'category') {
            av = a.category
            bv = b.category
            return dir * String(av).localeCompare(String(bv), 'ru')
          }

          // by === 'type'
          av = a.type
          bv = b.type
          return dir * String(av).localeCompare(String(bv), 'ru')
        })

        const start = (page - 1) * limit
        const end = start + limit

        queryClient.setQueryData(queryKey, {
          ...old,
          data: sorted.slice(start, end),
          total: old.total + 1,
        })
      }

      return { tempId, previous }
    },
    onError: (_err, _payload, ctx) => {
      // При ошибке: откатываем изменение в кэше.
      if (!ctx) return
      for (const [queryKey, old] of ctx.previous) {
        queryClient.setQueryData(queryKey, old)
      }
    },
    onSuccess: (data, _payload, ctx) => {
      const tempId = ctx?.tempId

      if (tempId) {
        for (const [queryKey, old] of ctx?.previous ?? []) {
          if (!old) continue
          queryClient.setQueryData(queryKey, {
            ...old,
            data: old.data.map((t) => (t.id === tempId ? data : t)),
          })
        }
      }

      // Подтверждаем запись данными с сервера: обновляем кэш.
      queryClient.invalidateQueries({ queryKey: transactionsQueryKey, exact: false })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TransactionUpdatePayload }) =>
      $fetch<Transaction>(`/api/transactions/${id}`, {
        method: 'PATCH',
        body: payload,
        credentials: 'include',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionsQueryKey, exact: false })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      $fetch<{ ok: boolean }>(`/api/transactions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionsQueryKey, exact: false })
    },
  })
}
