// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Pinia подключаем вручную через плагин, чтобы обойти баг SSR-хука app:rendered
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],
  // Автоимпорт стооров из папки stores, чтобы можно было использовать
  // useTransactionStore() без явных import во всех файлах
  imports: {
    dirs: ['stores']
  },
  supabase: {
    redirect: false,
    // ЯВНО пробрасываем значения из env
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  }
})
