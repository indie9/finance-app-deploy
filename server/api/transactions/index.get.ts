import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Transaction } from '~/types/transaction'

const SORT_FIELDS = ['date', 'amount', 'description', 'category', 'type'] as const
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 100

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || DEFAULT_PAGE)
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT))
  const sortBy = SORT_FIELDS.includes(query.sortBy as any)
    ? (query.sortBy as (typeof SORT_FIELDS)[number])
    : 'date'
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'
  const category = typeof query.category === 'string' ? query.category.trim() : ''

  const client = await serverSupabaseClient(event)
  let q = client
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', user.sub)

  if (category) {
    const pattern = `%${category}%`
    q = q.or(`category.ilike.${pattern},description.ilike.${pattern}`)
  }

  const { data, error, count } = await q
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    data: (data ?? []) as Transaction[],
    total: count ?? 0,
  }
})
