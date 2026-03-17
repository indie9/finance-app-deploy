interface UserProfile {
  id: string
  full_name?: string | null
  currency?: string | null
  monthly_budget?: number | null
  updated_at?: string | Date
  [key: string]: unknown
}

/** Payload для insert/upsert в таблицу profiles (совпадает с БД). */
interface ProfileUpsertRow {
  id: string
  full_name?: string | null
  currency?: string | null
  monthly_budget?: number | null
  updated_at: string
}

export const useUser = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // В @nuxtjs/supabase useSupabaseUser() возвращает JWT claims (JwtPayload), id пользователя в .sub
  const userId = computed(() => (user.value as { sub?: string })?.sub ?? null)

  // Получить профиль пользователя из БД.
  const getProfile = async () => {
    const id = userId.value

    if (!id) {
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data as unknown as UserProfile | null
  }

  // Создать или обновить профиль.
  const updateProfile = async (profileData: Record<string, unknown>) => {
    const id = userId.value

    if (!id) {
      return null
    }

    const payload: ProfileUpsertRow = {
      id,
      full_name: typeof profileData.full_name === 'string' ? profileData.full_name : null,
      currency: typeof profileData.currency === 'string' ? profileData.currency : 'RUB',
      monthly_budget:
        typeof profileData.monthly_budget === 'number' ? profileData.monthly_budget : null,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload as ProfileUpsertRow & Record<string, unknown>, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as unknown as UserProfile | null
  }

  // Проверка, заполнен ли профиль.
  const isProfileComplete = async () => {
    const profile = await getProfile()

    return !!(profile?.full_name && profile?.currency)
  }

  return {
    user: readonly(user),
    userId,
    getProfile,
    updateProfile,
    isProfileComplete
  }
}
