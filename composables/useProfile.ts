import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

export const profileQueryKey = ['profile'] as const

export function useProfileQuery() {
  const { userId, getProfile } = useUser()

  return useQuery({
    queryKey: computed(() => [...profileQueryKey, userId.value] as const),
    queryFn: () => getProfile(),
    enabled: computed(() => !!userId.value),
  })
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  const { userId, updateProfile } = useUser()

  return useMutation({
    mutationFn: (profileData: Record<string, unknown>) => updateProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey })
    },
  })
}
