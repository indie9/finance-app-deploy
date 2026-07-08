<template>
  <div class="app">
    <header class="header">
      <div class="header-row">
        <nav class="nav">
          <NuxtLink to="/" class="nav-link" active-class="nav-link--active">
            Дашборд
          </NuxtLink>
          <NuxtLink to="/budgets" class="nav-link" active-class="nav-link--active">
            Бюджеты
          </NuxtLink>
          <NuxtLink to="/profile" class="nav-link" active-class="nav-link--active">
            Профиль
          </NuxtLink>
        </nav>

        <div class="auth-box">
          <div class="auth-box__user">
            <strong class="auth-box__full-name">{{ displayName }}</strong>
            <strong class="auth-box__initials" aria-hidden="true">{{ initials }}</strong>
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
    <div class="alerts" aria-live="polite" aria-relevant="additions removals">
      <transition-group name="alert" tag="div" class="alerts__list">
        <div
          v-for="a in alerts"
          :key="a.id"
          class="alert"
          :class="`alert--${a.type}`"
          role="status"
        >
          {{ a.message }}
        </div>
      </transition-group>
    </div>
    <main class="main">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { transactionsQueryKey } from '~/composables/useTransactions'
import { budgetsQueryKey, categoriesQueryKey } from '~/composables/useBudgets'
import { profileQueryKey, useProfileQuery } from '~/composables/useProfile'
import { useAppAlerts } from '~/composables/useAppAlerts'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const queryClient = useQueryClient()

const { data: profile } = useProfileQuery()
const { alerts } = useAppAlerts()

const displayName = computed(() => {
  if (profile.value?.full_name) return profile.value.full_name
  if (user.value?.email) return user.value.email
  return 'Гость'
})

function getInitials(name: string): string {
  const s = name.trim()
  if (!s) return '?'
  const words = s.split(/\s+/).filter(Boolean)
  if (words.length >= 2)
    return (words[0][0] + words[1][0]).toUpperCase()
  if (s.includes('@'))
    return s[0].toUpperCase()
  return s.slice(0, 2).toUpperCase()
}

const initials = computed(() => getInitials(displayName.value))

const handleLogout = async () => {
  queryClient.removeQueries({ queryKey: transactionsQueryKey })
  queryClient.removeQueries({ queryKey: budgetsQueryKey })
  queryClient.removeQueries({ queryKey: categoriesQueryKey })
  queryClient.removeQueries({ queryKey: profileQueryKey })
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  max-width: 72rem;
  width: 100%;
  margin: 0 auto;
}

@media (min-width: 1400px) {
  .header-row {
    max-width: 96rem;
  }
}

@media (min-width: 1600px) {
  .header-row {
    max-width: 112rem;
  }
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

.auth-box__initials {
  display: none;
}

@media (max-width: 768px) {
  .auth-box__full-name {
    display: none;
  }

  .auth-box__initials {
    display: inline;
  }
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
  min-height: 0;
  padding: 1.5rem;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.alerts {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.alerts__list {
  display: contents;
}

.alert {
  pointer-events: none;
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.95);
  color: #0f172a;
  font-size: 0.9rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  max-width: 26rem;
}

.alert--success {
  background: rgba(240, 253, 244, 0.98);
  border-color: rgba(187, 247, 208, 0.95);
  color: #166534;
}

.alert--error {
  background: rgba(254, 242, 242, 0.98);
  border-color: rgba(254, 202, 202, 0.95);
  color: #b91c1c;
}

.alert--info {
  background: rgba(239, 246, 255, 0.98);
  border-color: rgba(191, 219, 254, 0.95);
  color: #1d4ed8;
}

.alert-enter-active,
.alert-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.alert-enter-from,
.alert-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

</style>
