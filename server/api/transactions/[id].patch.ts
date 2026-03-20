import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Transaction } from '~/types/transaction'

const ALLOWED_TYPES = ['income', 'expense'] as const
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

  if (body?.amount !== undefined) {
    const amount = Number(body.amount)
    if (!(amount > 0) || !Number.isFinite(amount)) {
      throw createError({ statusCode: 400, statusMessage: 'Сумма должна быть больше нуля.' })
    }
    updates.amount = amount
  }
  if (body?.type !== undefined) {
    const type = sanitize(body.type) as 'income' | 'expense'
    if (!ALLOWED_TYPES.includes(type)) {
      throw createError({ statusCode: 400, statusMessage: 'Тип должен быть income или expense.' })
    }
    updates.type = type
  }
  if (body?.category !== undefined) {
    const category = sanitize(body.category)
    if (!category) {
      throw createError({ statusCode: 400, statusMessage: 'Укажите категорию.' })
    }
    updates.category = category
  }
  if (body?.date !== undefined) {
    updates.date = sanitize(String(body.date)) || new Date().toISOString()
  }
  if (body?.description !== undefined) {
    updates.description = sanitize(body.description) ?? ''
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Нет полей для обновления.' })
  }

  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.sub)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createError({ statusCode: 404, statusMessage: 'Транзакция не найдена.' })
    }
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data as Transaction
})
