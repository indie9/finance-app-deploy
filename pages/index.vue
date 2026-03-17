<template>
  <section class="page">
    <div class="toolbar toolbar--top">
      <button
        type="button"
        class="add-btn"
        aria-label="Добавить новую транзакцию"
        @click="showTransactionModal = true"
      >
        Добавить транзакцию
      </button>
    </div>

    <TransactionModal v-model="showTransactionModal" />

    <div class="stats">
      <span class="stat">Транзакций: {{ transactions.length }}</span>
      <span class="stat">Баланс: {{ formatAmount(totalBalance) }}</span>
    </div>

    <div class="toolbar">
      <button
        type="button"
        class="refresh-button"
        :disabled="isFetching"
        :aria-busy="isFetching"
        :aria-label="isFetching ? 'Обновление списка...' : 'Обновить список транзакций'"
        title="Обновить данные с сервера"
        @click="refetch()"
      >
        <span class="refresh-button__text">{{ isFetching ? 'Обновление...' : 'Обновить' }}</span>
        <span v-if="isFetching" class="refresh-button__spinner" aria-hidden="true" />
      </button>
    </div>

    <Transition name="content" mode="out-in">
      <div v-if="status === 'pending'" key="loading" class="skeleton-wrap">
        <p class="skeleton-caption">Загрузка транзакций...</p>
        <ul class="skeleton-list">
          <li v-for="i in 5" :key="i" class="skeleton-item">
            <span class="skeleton-line skeleton-line--short" />
            <span class="skeleton-line skeleton-line--mid" />
            <span class="skeleton-line skeleton-line--amount" />
          </li>
        </ul>
      </div>

      <div v-else-if="status === 'error'" key="error" class="state-card state-card--error">
        <p>Не удалось загрузить транзакции.</p>
        <button type="button" class="retry-btn" @click="refetch()">
          Повторить
        </button>
      </div>

      <div v-else-if="transactions.length === 0" key="empty" class="state-card">
        <p>Пока нет транзакций.</p>
        <p class="state-card__hint">Нажмите «Добавить транзакцию», чтобы создать первую.</p>
      </div>

      <TransactionList v-else key="list" :transactions="transactions" />
    </Transition>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const showTransactionModal = ref(false)
const transactionStore = useTransactionStore()

const query = useTransactions()

// Локальные refs, синхронизируемые с query — гарантируют обновление UI при навигации (refs из useQuery иногда не триггерят ре-рендер).
const data = ref(query.data.value)
const isError = ref(query.isError.value)
const isPending = ref(query.isPending.value)

watch(
  () => query.data.value,
  (v) => {
    data.value = v
    if (v != null) transactionStore.setTransactions(v)
  },
  { immediate: true, flush: 'sync' }
)
watch(() => query.isError.value, (v) => { isError.value = v }, { flush: 'sync' })
watch(() => query.isPending.value, (v) => { isPending.value = v }, { flush: 'sync' })

const { isFetching, refetch } = query

const transactions = computed(() => data.value ?? [])

const totalBalance = computed(() =>
  transactions.value.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
    0
  )
)

// Показываем контент, как только есть данные. Скелетон — только пока нет данных и идёт загрузка.
const status = computed(() => {
  if (data.value !== undefined) return 'success'
  if (isError.value) return 'error'
  if (isPending.value) return 'pending'
  return 'success'
})

const { formatAmount } = useFormatters()
</script>

<style scoped>
.page {
  display: grid;
  gap: 1.5rem;
  max-width: 72rem;
}

.toolbar--top {
  margin-bottom: 0;
}

.add-btn {
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  background: #2563eb;
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.add-btn:hover {
  background: #1d4ed8;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.stat {
  color: #64748b;
  font-size: 0.9rem;
}

.stat:first-child {
  font-weight: 500;
  color: #0f172a;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.refresh-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  background: #fff;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.refresh-button:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.refresh-button:disabled {
  cursor: wait;
  opacity: 0.85;
}

.refresh-button__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-card {
  padding: 1.25rem;
  border-radius: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.state-card__hint {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #64748b;
}

.state-card--error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.retry-btn {
  margin-top: 0.75rem;
  padding: 0.4rem 0.9rem;
  border: 1px solid #fca5a5;
  border-radius: 0.5rem;
  background: #fff;
  color: #b91c1c;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #fee2e2;
}

/* Progressive loading skeleton */
.skeleton-wrap {
  padding: 0;
}

.skeleton-caption {
  margin-bottom: 1rem;
  color: #64748b;
  font-size: 0.9rem;
}

.skeleton-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.skeleton-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.skeleton-line {
  height: 0.875rem;
  border-radius: 0.25rem;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.2s ease-in-out infinite;
}

.skeleton-line--short { width: 5rem; }
.skeleton-line--mid { width: 8rem; flex-grow: 1; }
.skeleton-line--amount { width: 4rem; margin-left: auto; }

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
 100% { background-position: -200% 0; }
}

/* Content transitions */
.content-enter-active,
.content-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.content-enter-from,
.content-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
