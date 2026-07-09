import { serverSupabaseServiceRole } from '#supabase/server'
import { assertSdeskInboundAuth } from '~/server/utils/sdeskInboundAuth'
import {
  parseSdeskUserId,
  parseTransactionCreateBody,
} from '~/server/utils/parseTransactionCreateBody'

export default defineEventHandler(async (event) => {
  assertSdeskInboundAuth(event)

  const body = await readBody<Record<string, unknown>>(event)
  const userId = parseSdeskUserId(body)
  const payload = parseTransactionCreateBody(body)

  const client = serverSupabaseServiceRole(event)

  const { data: authUser, error: authError } = await client.auth.admin.getUserById(userId)

  if (authError || !authUser.user) {
    throw createError({ statusCode: 404, statusMessage: 'Пользователь с указанным user_id не найден.' })
  }

  const { data, error } = await client
    .from('transactions')
    .insert({
      user_id: userId,
      amount: payload.amount,
      type: payload.type,
      category: payload.category,
      date: payload.date ?? new Date().toISOString(),
      description: payload.description ?? '',
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    ok: true,
    source: 'sdesk',
    transaction: data,
  }
})
