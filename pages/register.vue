<template>
  <div class="auth-page">
    <Transition name="auth-card" appear>
      <div class="auth-card">
        <h2 class="auth-card__title">Регистрация</h2>
        <p class="auth-card__hint">Создайте аккаунт для учёта финансов</p>
        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="auth-field">
            <label for="reg-email" class="auth-label">Email</label>
            <input
              id="reg-email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="example@mail.ru"
              class="auth-input"
              :disabled="isRegistering"
              aria-describedby="reg-email-hint"
            >
            <span id="reg-email-hint" class="auth-field-hint">На этот адрес можно восстановить доступ</span>
          </div>
          <div class="auth-field">
            <label for="reg-password" class="auth-label">Пароль</label>
            <input
              id="reg-password"
              v-model="password"
              type="password"
              required
              autocomplete="new-password"
              placeholder="Минимум 6 символов"
              class="auth-input"
              :disabled="isRegistering"
              aria-describedby="reg-password-hint"
            >
            <span id="reg-password-hint" class="auth-field-hint">Не менее 6 символов для безопасности</span>
          </div>
          <button
            type="submit"
            class="auth-submit"
            :disabled="isRegistering"
            :aria-busy="isRegistering"
          >
            <span v-if="isRegistering" class="auth-submit__spinner" aria-hidden="true" />
            {{ isRegistering ? 'Регистрация...' : 'Зарегистрироваться' }}
          </button>
        </form>
        <p class="auth-card__footer">
          Уже есть аккаунт?
          <NuxtLink to="/login" class="auth-link">Войти</NuxtLink>
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
const isRegistering = ref(false)
const supabase = useSupabaseClient()

const handleRegister = async () => {
  if (isRegistering.value) return

  isRegistering.value = true
  try {
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })

    if (error) {
      throw error
    }

    await navigateTo('/login')
  } catch (error) {
    alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
  } finally {
    isRegistering.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 1.5rem;
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
