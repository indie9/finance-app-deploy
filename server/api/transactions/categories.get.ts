import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('transactions')
    .select('category')
    .eq('user_id', user.sub)
    .not('category', 'is', null)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const set = new Set<string>()
  for (const row of data ?? []) {
    const cat = (row as { category: string }).category?.trim()
    if (cat) set.add(cat)
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'))
})
