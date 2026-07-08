// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  nitro: {
    preset: 'node-server',
  },
  // Pinia подключаем вручную через плагин, чтобы обойти баг SSR-хука app:rendered
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],
  // Автоимпорт стооров из папки stores, чтобы можно было использовать
  // useTransactionStore() без явных import во всех файлах
  imports: {
    dirs: ['stores']
  },
  runtimeConfig: {
    // Серверный ключ: переопределяется NUXT_SUPABASE_SERVICE_KEY в runtime (Amvera/Docker).
    supabase: {
      serviceKey: '',
    },
    public: {
      supabase: {
        url: '',
        key: '',
      },
    },
  },
  supabase: {
    redirect: false,
    // url/key/serviceKey не задаём через process.env — иначе на Amvera
    // при сборке без env они запекаются как undefined в билд.
  },
})
