import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { TransactionCreatePayload } from '~/types/transaction'

const ALLOWED_TYPES = ['income', 'expense'] as const

const sanitize = (value: unknown) => String(value ?? '').trim()

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<Record<string, unknown>>(event)

  const amount = Number(body?.amount)
  const type = sanitize(body?.type) as 'income' | 'expense'
  const category = sanitize(body?.category)
  const date = body?.date != null ? sanitize(String(body.date)) : new Date().toISOString()
  const description = sanitize(body?.description) ?? ''

  if (!(amount > 0) || !Number.isFinite(amount)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Сумма должна быть больше нуля.'
    })
  }

  if (!ALLOWED_TYPES.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Тип должен быть income или expense.'
    })
  }

  if (!category) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Укажите категорию.'
    })
  }

  const payload: TransactionCreatePayload = {
    amount,
    type,
    category,
    date: date || undefined,
    description: description || undefined
  }

  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('transactions')
    .insert({
      user_id: user.sub,
      amount: payload.amount,
      type: payload.type,
      category: payload.category,
      date: payload.date ?? new Date().toISOString(),
      description: payload.description ?? ''
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
