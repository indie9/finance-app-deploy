<template>
  <div class="auth-page" :class="{ 'auth-page--with-hint': showHint }">
    <Transition name="auth-hint">
      <div v-if="showHint" class="auth-hint">
        <span class="auth-hint__text">
          Зарегистрируйтесь или используйте тестовые данные:
          <code>galanovn2@gmail.com</code> / <code>123456</code>
        </span>
        <button
          type="button"
          class="auth-hint__fill"
          @click="fillDemoCredentials"
        >
          Заполнить форму
        </button>
        <button
          type="button"
          class="auth-hint__close"
          aria-label="Закрыть подсказку"
          @click="showHint = false"
        >
          ×
        </button>
      </div>
    </Transition>
    <Transition name="auth-card" appear>
      <div class="auth-card">
        <h2 class="auth-card__title">Вход</h2>
        <p class="auth-card__hint">Введите данные от вашего аккаунта</p>
        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="auth-field">
            <label for="login-email" class="auth-label">Email</label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="example@mail.ru"
              class="auth-input"
              :disabled="isLoggingIn"
              aria-describedby="login-email-hint"
            >
            <span id="login-email-hint" class="auth-field-hint">Тот же email, что при регистрации</span>
          </div>
          <div class="auth-field">
            <label for="login-password" class="auth-label">Пароль</label>
            <input
              id="login-password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="••••••••"
              class="auth-input"
              :disabled="isLoggingIn"
              aria-describedby="login-password-hint"
            >
            <span id="login-password-hint" class="auth-field-hint">Минимум 6 символов</span>
          </div>
          <button
            type="submit"
            class="auth-submit"
            :disabled="isLoggingIn"
            :aria-busy="isLoggingIn"
          >
            <span v-if="isLoggingIn" class="auth-submit__spinner" aria-hidden="true" />
            {{ isLoggingIn ? 'Вход...' : 'Войти' }}
          </button>
        </form>
        <p class="auth-card__footer">
          Нет аккаунта?
          <NuxtLink to="/register" class="auth-link">Зарегистрироваться</NuxtLink>
        </p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const email = ref('')
const password = ref('')
const isLoggingIn = ref(false)
const showHint = ref(true)
const supabase = useSupabaseClient()

function fillDemoCredentials() {
  email.value = 'galanovn2@gmail.com'
  password.value = '123456'
}

async function waitForAuth(maxAttempts = 10, intervalMs = 150): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await $fetch('/api/auth/check')
      return true
    } catch {
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }
  }
  return false
}

const handleLogin = async () => {
  if (isLoggingIn.value) return

  isLoggingIn.value = true
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) {
      throw error
    }

    const authorized = await waitForAuth()
    if (!authorized) {
      throw new Error('Сервер не подтвердил авторизацию. Попробуйте ещё раз.')
    }

    await navigateTo('/', { replace: true })
  } catch (error) {
    alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
  } finally {
    isLoggingIn.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: #f8fafc;
}

.auth-hint {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.85rem 1.25rem;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 2px 12px rgba(37, 99, 235, 0.4);
  font-size: 0.95rem;
  color: #fff;
  font-weight: 500;
}

.auth-hint__text {
  flex: 1 1 auto;
  min-width: 0;
}

.auth-hint__text code {
  padding: 0.2rem 0.5rem;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 0.35rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.auth-hint__fill {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  background: #fff;
  color: #2563eb;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.auth-hint__fill:hover {
  background: #f8fafc;
  transform: scale(1.02);
}

.auth-hint__close {
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  border-radius: 0.35rem;
}

.auth-hint__close:hover {
  background: rgba(255, 255, 255, 0.35);
}

.auth-hint-enter-active,
.auth-hint-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.auth-hint-enter-from,
.auth-hint-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.auth-page--with-hint {
  padding-top: 3.5rem;
}

.auth-card {
  max-width: 28rem;
  width: 100%;
  padding: 2rem;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);
  border: 1px solid #e2e8f0;
}

.auth-card__title {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  color: #0f172a;
}

.auth-card__hint {
  margin: 0 0 1.5rem;
  font-size: 0.9rem;
  color: #64748b;
  text-align: center;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.auth-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.auth-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font: inherit;
  color: #111827;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.auth-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.auth-input::placeholder {
  color: #9ca3af;
}

.auth-input:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.auth-field-hint {
  font-size: 0.75rem;
  color: #6b7280;
}

.auth-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  padding: 0.65rem 1rem;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}

.auth-submit:hover:not(:disabled) {
  background: #1d4ed8;
}

.auth-submit:active:not(:disabled) {
  transform: scale(0.99);
}

.auth-submit:disabled {
  opacity: 0.85;
  cursor: wait;
}

.auth-submit__spinner {
  width: 1.125rem;
  height: 1.125rem;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: auth-spin 0.7s linear infinite;
}

@keyframes auth-spin {
  to { transform: rotate(360deg); }
}

.auth-card__footer {
  margin: 1.5rem 0 0;
  padding-top: 1.25rem;
  border-top: 1px solid #e5e7eb;
  font-size: 0.9rem;
  color: #6b7280;
  text-align: center;
}

.auth-link {
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
}

.auth-link:hover {
  text-decoration: underline;
}

.auth-card-enter-active,
.auth-card-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.auth-card-enter-from,
.auth-card-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
</style>
