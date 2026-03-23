<template>
  <form class="transaction-form" @submit.prevent="submit">
    <div class="form-grid">
      <label class="field">
        <span>Тип</span>
        <select v-model="form.type" class="input">
          <option value="income">Доход</option>
          <option value="expense">Расход</option>
        </select>
      </label>

      <label class="field">
        <span>Сумма</span>
        <input
          v-model.number="form.amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          class="input"
          :aria-invalid="!!(clientError && clientError.includes('Сумма'))"
        >
      </label>

      <label class="field field--full">
        <span>Категория</span>
        <input
          v-model.trim="form.category"
          type="text"
          placeholder="Например: Продукты, Зарплата, Транспорт"
          class="input"
          aria-required="true"
          :aria-invalid="!!(clientError && clientError.includes('категорию'))"
        >
      </label>

      <label class="field">
        <span>Дата</span>
        <input
          v-model="form.date"
          type="date"
          class="input"
        >
      </label>

      <label class="field field--full">
        <span>Описание (необязательно)</span>
        <input
          v-model.trim="form.description"
          type="text"
          placeholder="Краткое описание или комментарий"
          class="input"
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
    </Transition>

    <div class="actions">
      <button
        type="submit"
        class="submit-btn"
        :disabled="isSaving"
        :aria-busy="isSaving"
      >
        <span v-if="isSaving" class="submit-btn__spinner" aria-hidden="true" />
        {{ isSaving ? 'Сохранение...' : (transaction ? 'Сохранить изменения' : 'Сохранить') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Transaction, TransactionUpdatePayload } from '~/types/transaction'

const props = withDefaults(
  defineProps<{
    transaction?: Transaction | null
  }>(),
  { transaction: null }
)

const emit = defineEmits<{
  success: []
}>()

const addMutation = useAddTransaction()
const updateMutation = useUpdateTransaction()
const successMessage = ref('')

const isEdit = computed(() => !!props.transaction)
const isSaving = computed(
  () => Boolean(addMutation.isPending?.value || updateMutation.isPending?.value)
)

const defaultDate = () => new Date().toISOString().slice(0, 10)

const form = reactive({
  amount: 0,
  type: 'expense' as 'income' | 'expense',
  category: '',
  date: defaultDate(),
  description: ''
})

function resetForm() {
  form.amount = 0
  form.type = 'expense'
  form.category = ''
  form.date = defaultDate()
  form.description = ''
}

watch(
  () => props.transaction,
  (tx) => {
    if (tx) {
      form.amount = tx.amount
      form.type = tx.type
      form.category = tx.category
      form.date = tx.date ? tx.date.slice(0, 10) : defaultDate()
      form.description = tx.description ?? ''
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

const clientError = ref('')

const errorMessage = computed(() => {
  if (clientError.value) return clientError.value
  const err = isEdit.value ? updateMutation.error.value : addMutation.error.value
  if (!err) return ''
  const e = err as {
    data?: { message?: string; statusMessage?: string }
    statusMessage?: string
    message?: string
  }
  const msg =
    e?.data?.statusMessage ??
    e?.data?.message ??
    e?.statusMessage ??
    e?.message
  if (import.meta.dev && !msg) {
    console.warn('[TransactionForm] Не удалось извлечь сообщение из ошибки:', e)
  }
  return msg ?? 'Не удалось сохранить. Попробуйте снова.'
})

const submit = () => {
  successMessage.value = ''
  clientError.value = ''
  if (form.amount <= 0 || !Number.isFinite(form.amount)) {
    clientError.value = 'Сумма должна быть больше нуля.'
    return
  }
  if (!form.category.trim()) {
    clientError.value = 'Укажите категорию.'
    return
  }

  if (isEdit.value && props.transaction) {
    const tx = props.transaction
    const payload: TransactionUpdatePayload = {
      amount: form.amount,
      type: form.type,
      category: form.category.trim(),
      date: form.date ? new Date(form.date).toISOString() : undefined,
      description: form.description.trim() || undefined
    }
    updateMutation.mutate(
      { id: tx.id, payload },
      {
        onSuccess: () => {
          clientError.value = ''
          successMessage.value = 'Транзакция обновлена.'
          emit('success')
        }
      }
    )
  } else {
    addMutation.mutate(
      {
        amount: form.amount,
        type: form.type,
        category: form.category,
        date: form.date ? new Date(form.date).toISOString() : undefined,
        description: form.description || undefined
      },
      {
        onSuccess: () => {
          clientError.value = ''
          successMessage.value = 'Транзакция добавлена.'
          resetForm()
          emit('success')
        }
      }
    )
  }
}
</script>

<style scoped>
.transaction-form {
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

.input {
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.input[aria-invalid="true"] {
  border-color: #dc2626;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.15);
}

.message {
  margin-top: 1rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  transition: opacity 0.2s ease;
}

.message-enter-active,
.message-leave-active {
  transition: opacity 0.2s ease;
}

.message-enter-from,
.message-leave-to {
  opacity: 0;
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

.actions {
  margin-top: 1rem;
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: #2563eb;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}

.submit-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
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
