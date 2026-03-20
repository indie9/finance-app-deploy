import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Budget, BudgetCreatePayload, BudgetUpdatePayload } from '~/types/budget'

export const budgetsQueryKey = ['budgets'] as const
export const categoriesQueryKey = ['transactions', 'categories'] as const

export function useBudgetsQuery() {
  return useQuery({
    queryKey: budgetsQueryKey,
    queryFn: () => $fetch<Budget[]>('/api/budgets'),
  })
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: () => $fetch<string[]>('/api/transactions/categories'),
  })
}

export function useSpendingByCategoryQuery(month: Ref<string | null>) {
  return useQuery({
    queryKey: computed(() => ['transactions', 'spending-by-category', month.value ?? ''] as const),
    queryFn: () =>
      $fetch<Record<string, number>>('/api/transactions/spending-by-category', {
        params: { month: month.value! },
      }),
    enabled: computed(() => !!month.value && /^\d{4}-\d{2}$/.test(month.value)),
  })
}

export function useAddBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BudgetCreatePayload) =>
      $fetch<Budget>('/api/budgets', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetsQueryKey })
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BudgetUpdatePayload }) =>
      $fetch<Budget>(`/api/budgets/${id}`, {
        method: 'PATCH',
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetsQueryKey })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      $fetch<{ ok: boolean }>(`/api/budgets/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetsQueryKey })
    },
  })
}
