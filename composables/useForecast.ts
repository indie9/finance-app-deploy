import { useQuery } from '@tanstack/vue-query'
import type { ForecastResponse } from '~/server/api/transactions/forecast.get'

export function useForecastQuery(months = 3) {
  return useQuery({
    queryKey: ['transactions', 'forecast', months] as const,
    queryFn: () =>
      $fetch<ForecastResponse>('/api/transactions/forecast', {
        params: { months },
      }),
  })
}
