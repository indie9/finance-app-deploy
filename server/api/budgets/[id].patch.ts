import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Budget } from '~/types/budget'

const sanitize = (value: unknown) => String(value ?? '').trim()

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID не указан.' })
  }

  const body = await readBody<Record<string, unknown>>(event)
  const updates: Record<string, unknown> = {}

  if (body?.category !== undefined) {
    const category = sanitize(body.category)
    if (!category) {
      throw createError({ statusCode: 400, statusMessage: 'Категория не может быть пустой.' })
    }
    updates.category = category
  }
  if (body?.amount !== undefined) {
    const amount = Number(body.amount)
    if (!(amount > 0) || !Number.isFinite(amount)) {
      throw createError({ statusCode: 400, statusMessage: 'Лимит должен быть больше нуля.' })
    }
    updates.amount = amount
  }
  if (body?.period !== undefined) {
    updates.period = sanitize(body.period) || 'monthly'
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Нет полей для обновления.' })
  }

  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.sub)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createError({ statusCode: 404, statusMessage: 'Бюджет не найден.' })
    }
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data as Budget
})
