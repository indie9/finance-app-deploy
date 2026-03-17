import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Transaction } from '~/types/transaction'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('transactions')
    .select('*')
    .eq('user_id', user.sub)
    .order('date', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return (data ?? []) as Transaction[]
})
