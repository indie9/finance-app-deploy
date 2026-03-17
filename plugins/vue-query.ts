import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

// Упрощённый плагин без SSR-dehydrate/hydrate,
// чтобы не вызывать ошибок на продакшене.
export default defineNuxtPlugin((nuxt) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
      },
    },
  })

  nuxt.vueApp.use(VueQueryPlugin, { queryClient })
})
