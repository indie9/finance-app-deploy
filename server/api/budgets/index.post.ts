import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Budget } from '~/types/budget'

const sanitize = (value: unknown) => String(value ?? '').trim()
const DEFAULT_PERIOD = 'monthly'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<Record<string, unknown>>(event)
  const category = sanitize(body?.category)
  const amount = Number(body?.amount)
  const period = sanitize(body?.period) || DEFAULT_PERIOD

  if (!category) {
    throw createError({ statusCode: 400, statusMessage: 'Укажите категорию.' })
  }
  if (!(amount > 0) || !Number.isFinite(amount)) {
    throw createError({ statusCode: 400, statusMessage: 'Лимит должен быть больше нуля.' })
  }

  const client = await serverSupabaseClient(event)

  const { data: existing } = await client
    .from('budgets')
    .select('id')
    .eq('user_id', user.sub)
    .eq('category', category)
    .maybeSingle()

  if (existing) {
    throw createError({ statusCode: 400, statusMessage: 'Бюджет на эту категорию уже существует.' })
  }

  const { data, error } = await client
    .from('budgets')
    .insert({
      user_id: user.sub,
      category,
      amount,
      period,
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data as Budget
})
