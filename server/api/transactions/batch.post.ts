import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { TransactionCreatePayload } from '~/types/transaction'

const ALLOWED_TYPES = ['income', 'expense'] as const

const sanitize = (value: unknown) => String(value ?? '').trim()

function isValidIsoDate(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<Record<string, unknown>>(event)
  const transactionsUnknown = body?.transactions

  const transactions = Array.isArray(transactionsUnknown) ? transactionsUnknown : []

  if (transactions.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Нет транзакций для импорта.' })
  }

  if (transactions.length > 1000) {
    throw createError({ statusCode: 400, statusMessage: 'Слишком много строк для импорта.' })
  }

  const payloads: TransactionCreatePayload[] = []

  for (const t of transactions) {
    if (t == null || typeof t !== 'object') continue
    const obj = t as Record<string, unknown>

    const amount = Number(obj?.amount)
    const type = sanitize(obj?.type) as 'income' | 'expense'
    const category = sanitize(obj?.category)
    const dateRaw = obj?.date != null ? sanitize(String(obj.date)) : ''
    const description = sanitize(obj?.description) || ''

    if (!(amount > 0) || !Number.isFinite(amount)) {
      throw createError({ statusCode: 400, statusMessage: 'Сумма должна быть больше нуля.' })
    }
    if (!ALLOWED_TYPES.includes(type)) {
      throw createError({ statusCode: 400, statusMessage: 'Тип должен быть income или expense.' })
    }
    if (!category) {
      throw createError({ statusCode: 400, statusMessage: 'Укажите категорию.' })
    }

    const date = dateRaw && isValidIsoDate(dateRaw) ? dateRaw : undefined

    payloads.push({
      amount,
      type,
      category,
      date,
      description: description || undefined,
    })
  }

  if (payloads.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Все строки невалидные.' })
  }

  const client = await serverSupabaseClient(event)

  const { error } = await client.from('transactions').insert(
    payloads.map((p) => ({
      user_id: user.sub,
      amount: p.amount,
      type: p.type,
      category: p.category,
      date: p.date ?? new Date().toISOString(),
      description: p.description ?? '',
    }))
  )

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { imported: payloads.length }
})

