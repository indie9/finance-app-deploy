import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { getMonthRange } from '~/utils/date'
import { subMonths } from 'date-fns'
import { format } from 'date-fns'

export interface ForecastResponse {
  byCategory: Record<string, number>
  total: number
  topCategories: Array<{ category: string; amount: number }>
  overBudget: Array<{ category: string; limit: number; forecast: number }>
}

const DEFAULT_MONTHS = 3

export default defineEventHandler(async (event): Promise<ForecastResponse> => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)
  const monthsCount = Math.min(12, Math.max(1, Number(query.months) || DEFAULT_MONTHS))

  const now = new Date()
  const dateTo = subMonths(now, 1)
  const dateFrom = subMonths(now, monthsCount)
  const dateFromStr = format(dateFrom, 'yyyy-MM-dd')
  const dateToStr = format(dateTo, 'yyyy-MM-dd')

  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('transactions')
    .select('category, amount')
    .eq('user_id', user.sub)
    .eq('type', 'expense')
    .gte('date', dateFromStr)
    .lte('date', dateToStr)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const byCategory: Record<string, number> = {}
  const categoryNames: Record<string, string> = {}
  for (const row of data ?? []) {
    const r = row as { category: string; amount: number }
    const raw = r.category?.trim() || 'Без категории'
    const key = raw.toLowerCase()
    byCategory[key] = (byCategory[key] ?? 0) + Number(r.amount)
    if (!categoryNames[key]) categoryNames[key] = raw
  }

  for (const k of Object.keys(byCategory)) {
    byCategory[k] = byCategory[k] / monthsCount
  }

  const total = Object.values(byCategory).reduce((sum, v) => sum + v, 0)
  const topCategories = Object.entries(byCategory)
    .map(([key, amount]) => ({ category: categoryNames[key] || key, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  const { data: budgets } = await client
    .from('budgets')
    .select('category, amount')
    .eq('user_id', user.sub)

  const overBudget: Array<{ category: string; limit: number; forecast: number }> = []
  for (const b of budgets ?? []) {
    const row = b as { category: string; amount: number }
    const key = row.category?.trim().toLowerCase() || ''
    const forecast = byCategory[key] ?? 0
    const limit = Number(row.amount) || 0
    if (limit > 0 && forecast > limit) {
      overBudget.push({
        category: row.category,
        limit,
        forecast,
      })
    }
  }

  return {
    byCategory,
    total,
    topCategories,
    overBudget,
  }
})
