<template>
  <form class="budget-form" @submit.prevent="submit">
    <div class="form-grid">
      <label class="field field--full">
        <span>Категория</span>
        <input
          v-model.trim="form.category"
          type="text"
          list="budget-categories"
          placeholder="Например: Продукты, Транспорт"
          class="input"
          aria-required="true"
          :aria-invalid="!!(clientError && clientError.includes('категорию'))"
        >
        <datalist id="budget-categories">
          <option v-for="c in categories" :key="c" :value="c">
            {{ c }}
          </option>
        </datalist>
      </label>

      <label class="field">
        <span>Период</span>
        <select v-model="form.period" class="input">
          <option value="monthly">Ежемесячно</option>
        </select>
      </label>

      <label class="field">
        <span>Лимит (₽)</span>
        <input
          v-model.number="form.amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          class="input"
          :aria-invalid="!!(clientError && clientError.includes('Лимит'))"
        >
      </label>
    </div>

    <Transition name="message">
      <p v-if="errorMessage" class="message message--error" role="alert">
        {{ errorMessage }}
      </p>
      <p v-else-if="successMessage" class="message message--success" role="status">
        {{ successMessage }}
      </p>
      <p
        v-else-if="categoryHint"
        class="message message--hint"
        role="status"
      >
        {{ categoryHint }}
      </p>
    </Transition>

    <div class="actions">
      <button
        type="submit"
        class="submit-btn"
        :disabled="isSaving"
        :aria-busy="isSaving"
      >
        <span v-if="isSaving" class="submit-btn__spinner" aria-hidden="true" />
        {{ isSaving ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать бюджет') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Budget } from '~/types/budget'

const props = withDefaults(
  defineProps<{
    budget?: Budget | null
  }>(),
  { budget: null }
)

const emit = defineEmits<{
  success: []
}>()

const { data: categoriesList } = useCategoriesQuery()
const categories = computed(() => categoriesList.value ?? [])

const addMutation = useAddBudget()
const updateMutation = useUpdateBudget()

const isEdit = computed(() => !!props.budget)

const isSaving = computed(
  () => Boolean(addMutation.isPending?.value || updateMutation.isPending?.value)
)

const form = reactive({
  category: '',
  period: 'monthly',
  amount: 0,
})

watch(
  () => props.budget,
  (b) => {
    if (b) {
      form.category = b.category
      form.period = b.period || 'monthly'
      form.amount = b.amount
    } else {
      form.category = ''
      form.period = 'monthly'
      form.amount = 0
    }
  },
  { immediate: true }
)

const clientError = ref('')
const successMessage = ref('')

const categoryHint = computed(() => {
  const cat = form.category.trim()
  if (!cat) return ''
  const catNorm = cat.toLowerCase()
  const found = categories.value.some((c) => c.trim().toLowerCase() === catNorm)
  if (found) return ''
  return `Категория «${cat}» пока не встречалась в транзакциях. Факт и остаток появятся, когда вы добавите транзакции с такой категорией.`
})

const errorMessage = computed(() => {
  if (clientError.value) return clientError.value
  const err = isEdit.value ? updateMutation.error.value : addMutation.error.value
  if (!err) return ''
  const e = err as { data?: { message?: string }; statusMessage?: string }
  return e?.data?.message ?? e?.statusMessage ?? 'Не удалось сохранить. Попробуйте снова.'
})

function submit() {
  successMessage.value = ''
  clientError.value = ''
  if (!form.category.trim()) {
    clientError.value = 'Укажите категорию.'
    return
  }
  if (form.amount <= 0 || !Number.isFinite(form.amount)) {
    clientError.value = 'Лимит должен быть больше нуля.'
    return
  }

  if (isEdit.value && props.budget) {
    updateMutation.mutate(
      {
        id: props.budget.id,
        payload: {
          category: form.category,
          amount: form.amount,
          period: form.period,
        },
      },
      {
        onSuccess: () => {
          clientError.value = ''
          successMessage.value = 'Бюджет обновлён.'
          emit('success')
        },
      }
    )
  } else {
    addMutation.mutate(
      {
        category: form.category,
        amount: form.amount,
        period: form.period,
      },
      {
        onSuccess: () => {
          clientError.value = ''
          successMessage.value = 'Бюджет создан.'
          emit('success')
        },
      }
    )
  }
}
</script>

<style scoped>
.budget-form {
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.field {
  display: grid;
  gap: 0.4rem;
}

.field--full {
  grid-column: 1 / -1;
}

.field span {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  font: inherit;
  color: #0f172a;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.input[aria-invalid="true"] {
  border-color: #dc2626;
}

.message {
  margin-top: 1rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
}

.message--error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.message--success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.message--hint {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.actions {
  margin-top: 1rem;
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: #2563eb;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.submit-btn:disabled {
  opacity: 0.85;
  cursor: wait;
}

.submit-btn__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: form-spin 0.7s linear infinite;
}

@keyframes form-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 500px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
