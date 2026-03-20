import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { getMonthRange } from '~/utils/date'

function isValidMonth(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}$/.test(s)
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)
  const month = query.month
  if (!isValidMonth(month)) {
    throw createError({ statusCode: 400, statusMessage: 'Параметр month обязателен в формате ГГГГ-ММ.' })
  }

  // Расчёт только за выбранный месяц — старые транзакции не влияют
  const { from: dateFrom, to: dateTo } = getMonthRange(month)

  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('transactions')
    .select('category, amount')
    .eq('user_id', user.sub)
    .eq('type', 'expense')
    .gte('date', dateFrom)
    .lte('date', dateTo)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const byCategory: Record<string, number> = {}
  for (const row of data ?? []) {
    const r = row as { category: string; amount: number }
    const raw = r.category?.trim() || 'Без категории'
    const key = raw.toLowerCase()
    byCategory[key] = (byCategory[key] ?? 0) + Number(r.amount)
  }

  return byCategory
})
