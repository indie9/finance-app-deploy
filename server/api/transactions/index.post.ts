import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createSdeskAppeal } from '~/server/utils/sdeskAppeal'
import { parseTransactionCreateBody } from '~/server/utils/parseTransactionCreateBody'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<Record<string, unknown>>(event)
  const payload = parseTransactionCreateBody(body)

  const client = await serverSupabaseClient(event)
  const dbPromise = client
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

  // Интеграцию запускаем параллельно вставке в БД.
  const integrationPromise = createSdeskAppeal({
    category: payload.category,
    description: payload.description,
  })

  const [{ data, error }, integrationOk] = await Promise.all([dbPromise, integrationPromise])

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { ...data, integrationOk }
})
