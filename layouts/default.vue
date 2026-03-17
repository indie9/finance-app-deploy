<template>
  <div class="app">
    <header class="header">
      <div class="header-row">
        <nav class="nav">
          <NuxtLink to="/" class="nav-link" active-class="nav-link--active">
            Дашборд
          </NuxtLink>
          <NuxtLink to="/profile" class="nav-link" active-class="nav-link--active">
            Профиль
          </NuxtLink>
        </nav>

        <div class="auth-box">
          <div class="auth-box__user">
            <strong>{{ displayName }}</strong>
          </div>

          <div class="auth-box__actions">
            <NuxtLink v-if="!user" to="/login" class="auth-link">
              Войти
            </NuxtLink>
            <NuxtLink v-if="!user" to="/register" class="auth-link auth-link--secondary">
              Регистрация
            </NuxtLink>
            <button
              v-if="user"
              type="button"
              class="logout-button"
              @click="handleLogout"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    </header>
    <main class="main">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { transactionsQueryKey } from '~/composables/useTransactions'
import { profileQueryKey, useProfileQuery } from '~/composables/useProfile'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const queryClient = useQueryClient()

const { data: profile } = useProfileQuery()

const displayName = computed(() => {
  if (profile.value?.full_name) return profile.value.full_name
  if (user.value?.email) return user.value.email
  return 'Гость'
})

const handleLogout = async () => {
  queryClient.removeQueries({ queryKey: transactionsQueryKey })
  queryClient.removeQueries({ queryKey: profileQueryKey })
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  background: var(--header-bg, #f9fafb);
}

.header-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.nav {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.nav-link {
  color: #374151;
  text-decoration: none;
  font-weight: 500;
}

.nav-link:hover {
  color: #111827;
}

.nav-link--active {
  color: #2563eb;
}

.auth-box {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.auth-box__user {
  display: grid;
  gap: 0.15rem;
}

.auth-box__label {
  color: #6b7280;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.auth-box__user strong {
  color: #111827;
  font-size: 0.95rem;
}

.auth-box__actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.auth-link,
.logout-button {
  padding: 0.6rem 0.9rem;
  border-radius: 0.85rem;
  text-decoration: none;
  font-weight: 600;
  font: inherit;
}

.auth-link {
  background: #2563eb;
  color: #fff;
}

.auth-link--secondary {
  background: #e5e7eb;
  color: #111827;
}

.logout-button {
  border: 0;
  background: #dc2626;
  color: #fff;
  cursor: pointer;
}

.main {
  flex: 1;
  padding: 1.5rem;
}
</style>
