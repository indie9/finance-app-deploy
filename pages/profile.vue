<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Профиль</h1>

    <p v-if="!userId" class="text-gray-500 mb-4">
      Загрузка пользователя...
    </p>

    <div v-else-if="isProfileLoading" class="profile-skeleton max-w-md">
      <div class="skeleton-block skeleton-title" />
      <div class="skeleton-block skeleton-line" />
      <div class="skeleton-block skeleton-line" />
      <div class="skeleton-block skeleton-line skeleton-line--short" />
      <div class="skeleton-block skeleton-btn" />
    </div>

    <Transition v-else name="profile" mode="out-in">
      <div key="content" class="profile-card bg-white rounded-lg shadow p-6 max-w-md">
        <!-- Режим просмотра -->
        <template v-if="!isEditing">
        <dl class="space-y-4">
          <div>
            <dt class="text-sm font-medium text-gray-500">Полное имя</dt>
            <dd class="mt-1 text-gray-900">
              {{ form.full_name || '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Валюта</dt>
            <dd class="mt-1 text-gray-900">
              {{ currencyLabel }}
            </dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Месячный бюджет</dt>
            <dd class="mt-1 text-gray-900">
              {{ form.monthly_budget != null ? formatBudget(form.monthly_budget, form.currency) : '—' }}
            </dd>
          </div>
        </dl>
        <button
          type="button"
          class="mt-6 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          @click="isEditing = true"
        >
          Отредактировать
        </button>
      </template>

      <!-- Режим редактирования -->
      <form v-else @submit.prevent="handleSave" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Полное имя
          </label>
          <input
            v-model="form.full_name"
            type="text"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">
            Валюта
          </label>
          <select
            v-model="form.currency"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="RUB">Рубль (RUB)</option>
            <option value="USD">Доллар (USD)</option>
            <option value="EUR">Евро (EUR)</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">
            Месячный бюджет
          </label>
          <input
            v-model.number="form.monthly_budget"
            type="number"
            min="0"
            step="1"
            placeholder="Оставьте пустым, если не задан"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            aria-describedby="hint-budget"
          >
          <p id="hint-budget" class="mt-1 text-xs text-gray-500">
            Планируемая сумма расходов в месяц в выбранной валюте
          </p>
        </div>

        <p v-if="saveError" class="text-red-600 text-sm" role="alert">
          {{ saveError }}
        </p>

        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            :disabled="isSaving"
            @click="handleCancelEdit"
          >
            Отмена
          </button>
          <button
            type="submit"
            class="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            :disabled="isSaving"
          >
            {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </form>
      </div>
    </Transition>

    <Transition name="toast">
      <div v-if="saveSuccess" class="profile-toast" role="status" aria-live="polite">
        Профиль сохранён
      </div>
    </Transition>

    <div class="mt-8 max-w-md">
      <button
        type="button"
        class="py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
        :disabled="pingLoading"
        @click="pingServer"
      >
        {{ pingLoading ? 'Запрос...' : 'Пинг localhost:8000' }}
      </button>
      <p v-if="pingResponse" class="mt-2 text-sm text-gray-600">
        Ответ: {{ pingResponse }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

interface ProfileForm {
  full_name: string
  currency: 'RUB' | 'USD' | 'EUR'
  monthly_budget: number | null
}

const emptyForm = (): ProfileForm => ({
  full_name: '',
  currency: 'RUB',
  monthly_budget: null
})

const { userId } = useUser()
const { formatBudget } = useFormatters()
const profileQuery = useProfileQuery()

// Локальные refs, синхронизируемые с query — гарантируют обновление UI при навигации.
const profileDataLocal = ref(profileQuery.data?.value)
const isFetchingLocal = ref(profileQuery.isFetching?.value ?? false)

watch(() => profileQuery.data?.value, (v) => { profileDataLocal.value = v }, { immediate: true, flush: 'sync' })
watch(() => profileQuery.isFetching?.value, (v) => { isFetchingLocal.value = Boolean(v) }, { immediate: true, flush: 'sync' })

const isProfileLoading = computed(() => profileDataLocal.value === undefined && isFetchingLocal.value)
const updateMutation = useUpdateProfileMutation()

const form = ref<ProfileForm>(emptyForm())
const isEditing = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

const pingResponse = ref('')
const pingLoading = ref(false)
async function pingServer() {
  pingResponse.value = ''
  pingLoading.value = true
  try {
    const res = await fetch('http://localhost:8000/')
    const text = await res.text()
    pingResponse.value = `${res.status}: ${text || '(пусто)'}`
  } catch (e) {
    pingResponse.value = 'Ошибка: ' + (e instanceof Error ? e.message : String(e))
  } finally {
    pingLoading.value = false
  }
}
let successTimeout: ReturnType<typeof setTimeout> | null = null

const currencyLabels: Record<string, string> = {
  RUB: 'Рубль (RUB)',
  USD: 'Доллар (USD)',
  EUR: 'Евро (EUR)'
}

const currencyLabel = computed(() =>
  currencyLabels[form.value.currency] ?? form.value.currency
)

function profileToForm(profile: { full_name?: string | null; currency?: string | null; monthly_budget?: number | null } | null): ProfileForm {
  if (!profile || (profile.full_name == null && profile.currency == null && profile.monthly_budget == null)) {
    return emptyForm()
  }
  return {
    full_name: typeof profile.full_name === 'string' ? profile.full_name : '',
    currency: profile.currency === 'USD' || profile.currency === 'EUR' ? profile.currency : 'RUB',
    monthly_budget: typeof profile.monthly_budget === 'number' ? profile.monthly_budget : null
  }
}

// Синхронизируем кэш профиля в форму (только когда не в режиме редактирования)
watch(
  [profileDataLocal, isEditing],
  ([data, editing]) => {
    if (editing) return
    const next = profileToForm(data ?? null)
    form.value = next
  },
  { immediate: true, flush: 'post' }
)

watch(userId, (id) => {
  if (!id) {
    form.value = emptyForm()
  }
}, { immediate: true })

const handleSave = () => {
  if (!userId.value) {
    saveError.value = 'Пользователь не авторизован.'
    return
  }

  saveError.value = ''

  updateMutation.mutate(
    {
      full_name: form.value.full_name,
      currency: form.value.currency,
      monthly_budget: form.value.monthly_budget
    },
    {
      onSuccess: (result) => {
        if (result == null) {
          saveError.value = 'Не удалось сохранить профиль. Попробуйте ещё раз.'
          return
        }
        saveError.value = ''
        isEditing.value = false
        saveSuccess.value = true
        if (successTimeout) clearTimeout(successTimeout)
        successTimeout = setTimeout(() => {
          saveSuccess.value = false
          successTimeout = null
        }, 3000)
      },
      onError: (error) => {
        saveError.value = error instanceof Error ? error.message : 'Неизвестная ошибка'
      }
    }
  )
}

const isSaving = computed(() => Boolean(updateMutation.isPending?.value))

function handleCancelEdit() {
  isEditing.value = false
  saveError.value = ''
  form.value = profileToForm(profileDataLocal.value ?? null)
}
</script>

<style scoped>
.profile-skeleton {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-block {
  height: 1.5rem;
  border-radius: 0.5rem;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: profile-shimmer 1.2s ease-in-out infinite;
}

.skeleton-title { width: 60%; height: 2rem; }
.skeleton-line { width: 100%; }
.skeleton-line--short { width: 50%; }
.skeleton-btn { width: 100%; height: 2.5rem; margin-top: 0.5rem; }

@keyframes profile-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.profile-enter-active,
.profile-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.profile-enter-from,
.profile-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.profile-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  background: #0f172a;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
  z-index: 100;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
</style>
