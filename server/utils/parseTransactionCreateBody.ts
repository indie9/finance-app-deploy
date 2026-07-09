import type { TransactionCreatePayload } from '~/types/transaction'

const ALLOWED_TYPES = ['income', 'expense'] as const

const sanitize = (value: unknown) => String(value ?? '').trim()

export function parseTransactionCreateBody(body: Record<string, unknown>): TransactionCreatePayload {
  const amount = Number(body?.amount)
  const type = sanitize(body?.type) as 'income' | 'expense'
  const category = sanitize(body?.category)
  const date = body?.date != null ? sanitize(String(body.date)) : undefined
  const description = sanitize(body?.description) || undefined

  if (!(amount > 0) || !Number.isFinite(amount)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Сумма должна быть больше нуля.',
    })
  }

  if (!ALLOWED_TYPES.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Тип должен быть income или expense.',
    })
  }

  if (!category) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Укажите категорию.',
    })
  }

  return {
    amount,
    type,
    category,
    date: date || undefined,
    description,
  }
}

export function parseSdeskUserId(body: Record<string, unknown>): string {
  const userId = sanitize(body?.user_id)

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Укажите user_id владельца транзакции.',
    })
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'user_id должен быть UUID пользователя Supabase.',
    })
  }

  return userId
}
