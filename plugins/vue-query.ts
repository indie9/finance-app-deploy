import {
  VueQueryPlugin,
  QueryClient,
  dehydrate,
  hydrate,
  type DehydratedState,
} from '@tanstack/vue-query'
import { useState } from '#imports'

export default defineNuxtPlugin((nuxt) => {
  const vueQueryState = useState<DehydratedState | null>('vue-query')

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
      },
    },
  })

  nuxt.vueApp.use(VueQueryPlugin, { queryClient })

  if (process.server) {
    nuxt.hooks.hook('app:rendered', () => {
      try {
        vueQueryState.value = dehydrate(queryClient)
      } catch {
        vueQueryState.value = null
      }
    })
  }

  if (process.client) {
    hydrate(queryClient, vueQueryState.value ?? undefined)
  }
})
