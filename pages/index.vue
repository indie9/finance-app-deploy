<template>
  <section class="page">
    <TransactionModal v-model="showTransactionModal" />

    <div class="stats">
      <div class="stat-card">
        <div class="stat-card__label">Всего транзакций</div>
        <div class="stat-card__value">{{ total }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Текущий баланс</div>
        <div class="stat-card__value">{{ formatAmount(totalBalance) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Доходы</div>
        <div class="stat-card__value stat-card__value--income">{{ formatAmount(totalIncome) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Расходы</div>
        <div class="stat-card__value stat-card__value--expense">{{ formatAmount(totalExpense) }}</div>
      </div>
    </div>

    <div class="period-section">
      <div class="period-section__left">
        <div class="toolbar toolbar--period">
          <span class="toolbar__label">Период:</span>
          <div class="period-toggle" role="tablist" aria-label="Переключение по дням и месяцам">
            <button
              type="button"
              class="period-toggle__btn"
              :class="periodMode === 'days' && 'period-toggle__btn--active'"
              role="tab"
              aria-selected="periodMode === 'days'"
              @click="switchPeriodMode('days')"
            >
              По дням
            </button>
            <button
              type="button"
              class="period-toggle__btn"
              :class="periodMode === 'months' && 'period-toggle__btn--active'"
              role="tab"
              aria-selected="periodMode === 'months'"
              @click="switchPeriodMode('months')"
            >
              По месяцам
            </button>
          </div>
        </div>
        <div class="period-nav">
          <template v-if="periodMode === 'days'">
            <button
              type="button"
              class="period-nav__btn"
              aria-label="Предыдущий день"
              @click="prevDay"
            >
              ‹
            </button>
            <input
              v-model="currentDay"
              type="date"
              class="period-nav__input"
              :max="todayStr"
              aria-label="Выбрать дату"
            >
            <button
              type="button"
              class="period-nav__btn"
              aria-label="Следующий день"
              :disabled="currentDay >= todayStr"
              @click="nextDay"
            >
              ›
            </button>
          </template>
          <template v-else>
            <button
              type="button"
              class="period-nav__btn"
              aria-label="Предыдущий месяц"
              @click="prevMonth"
            >
              ‹
            </button>
            <div class="period-nav__month">
              <select
                v-model.number="currentMonth.month"
                class="period-nav__select"
                aria-label="Месяц"
              >
                <option v-for="(name, i) in monthNames" :key="i" :value="i + 1">
                  {{ name }}
                </option>
              </select>
              <select
                v-model.number="currentMonth.year"
                class="period-nav__select"
                aria-label="Год"
              >
                <option v-for="y in yearOptions" :key="y" :value="y">
                  {{ y }}
                </option>
              </select>
            </div>
            <button
              type="button"
              class="period-nav__btn"
              aria-label="Следующий месяц"
              :disabled="isCurrentMonth"
              @click="nextMonth"
            >
              ›
            </button>
          </template>
        </div>
      </div>
      <div class="period-actions">
        <button
          type="button"
          class="add-btn add-btn--icon"
          aria-label="Добавить новую транзакцию"
          @click="showTransactionModal = true"
        >
          <span class="add-btn__icon" aria-hidden="true">+</span>
          <span class="add-btn__text">Добавить</span>
        </button>
      </div>
    </div>

    <div class="charts-grid">
      <div class="charts-grid__item">
        <BalanceTimelineChart
          v-if="showBalanceTimeline"
          :transactions="transactions"
        />
        <div v-else class="chart-placeholder">
          Для одного дня график баланса не отображается — используйте режим «По месяцам».
        </div>
      </div>
      <div class="charts-grid__item">
        <ExpensesByCategoryChart :transactions="transactions" />
      </div>
    </div>

    <div class="page__table-wrap">
      <TransactionTable
        :transactions="transactions"
        :total="total"
        :page="params.page"
        :limit="params.limit"
        :sort-by="params.sortBy"
        :sort-order="params.sortOrder"
        :category-filter="params.category"
        :loading="isFetching"
        @refresh="refetch()"
        @update:page="params.page = $event"
        @update:sort-by="params.sortBy = $event"
        @update:sort-order="params.sortOrder = $event"
        @update:category-filter="params.category = $event"
        @update:limit="params.limit = $event"
      />
    </div>

    <Transition name="content" mode="out-in">
      <div v-if="status === 'error'" key="error" class="state-card state-card--error">
        <p>Не удалось загрузить транзакции.</p>
        <button type="button" class="retry-btn" @click="refetch()">
          Повторить
        </button>
      </div>

      <div v-else-if="!isFetching && transactions.length === 0" key="empty" class="state-card">
        <p>Пока нет транзакций.</p>
        <p class="state-card__hint">Нажмите «Добавить транзакцию», чтобы создать первую.</p>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import ExpensesByCategoryChart from '~/components/ExpensesByCategoryChart.vue'
import BalanceTimelineChart from '~/components/BalanceTimelineChart.vue'
definePageMeta({
  layout: 'default'
})

const showTransactionModal = ref(false)
const transactionStore = useTransactionStore()

const params = reactive({
  page: 1,
  limit: 100,
  sortBy: 'date' as 'date' | 'amount' | 'description' | 'category' | 'type',
  sortOrder: 'desc' as 'asc' | 'desc',
  category: '',
  dateFrom: undefined as string | undefined,
  dateTo: undefined as string | undefined,
})

const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

const periodMode = ref<'days' | 'months'>('days')
const currentDay = ref(todayStr.value)
const currentMonth = ref({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
})

const yearOptions = computed(() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 11 }, (_, i) => y - 5 + i)
})

function firstDayOfMonth(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}-01`
}
function lastDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 0)
  return `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function addDays(dateStr: string, delta: number) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const isCurrentMonth = computed(() => {
  const now = new Date()
  return currentMonth.value.year === now.getFullYear() && currentMonth.value.month === now.getMonth() + 1
})

function switchPeriodMode(mode: 'days' | 'months') {
  periodMode.value = mode
  if (mode === 'days') currentDay.value = todayStr.value
  else {
    const now = new Date()
    currentMonth.value = { year: now.getFullYear(), month: now.getMonth() + 1 }
  }
}

function prevDay() {
  currentDay.value = addDays(currentDay.value, -1)
}
function nextDay() {
  if (currentDay.value >= todayStr.value) return
  currentDay.value = addDays(currentDay.value, 1)
}
function prevMonth() {
  let { year, month } = currentMonth.value
  month -= 1
  if (month < 1) { month = 12; year -= 1 }
  currentMonth.value = { year, month }
}
function nextMonth() {
  if (isCurrentMonth.value) return
  let { year, month } = currentMonth.value
  month += 1
  if (month > 12) { month = 1; year += 1 }
  currentMonth.value = { year, month }
}

const periodDateFrom = computed(() => {
  if (periodMode.value === 'days') return currentDay.value
  return firstDayOfMonth(currentMonth.value.year, currentMonth.value.month)
})
const periodDateTo = computed(() => {
  if (periodMode.value === 'days') return currentDay.value
  return lastDayOfMonth(currentMonth.value.year, currentMonth.value.month)
})

watch([periodDateFrom, periodDateTo], ([from, to]) => {
  params.dateFrom = from as string
  params.dateTo = to as string
}, { immediate: true })

const query = useTransactions(params)

const data = ref<{ data: import('~/types/transaction').Transaction[]; total: number } | undefined>(query.data.value)
const isError = ref(query.isError.value)
const isPending = ref(query.isPending.value)

watch(
  () => query.data.value,
  (v) => {
    data.value = v
    if (v?.data != null) transactionStore.setTransactions(v.data)
  },
  { immediate: true, flush: 'sync' }
)
watch(() => query.isError.value, (v) => { isError.value = v }, { flush: 'sync' })
watch(() => query.isPending.value, (v) => { isPending.value = v }, { flush: 'sync' })

const { isFetching, refetch } = query

const transactions = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.total ?? 0)

const totalBalance = computed(() =>
  transactions.value.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
    0
  )
)

const totalIncome = computed(() =>
  transactions.value.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amount : 0),
    0
  )
)

const totalExpense = computed(() =>
  transactions.value.reduce(
    (sum, t) => sum + (t.type === 'expense' ? t.amount : 0),
    0
  )
)

const showBalanceTimeline = computed(() => periodDateFrom.value !== periodDateTo.value)

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
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 72rem;
  width: 100%;
  margin: 0 auto;
  flex: 1;
  min-height: 0;
}

.page__table-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.charts-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 1rem;
  min-width: 0;
}

.charts-grid__item {
  min-height: 260px;
  min-width: 0;
  overflow: hidden;
}

.chart-placeholder {
  height: 100%;
  min-width: 0;
  border-radius: 0.75rem;
  border: 1px dashed #e2e8f0;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  font-size: 0.85rem;
  color: #64748b;
  text-align: center;
}

@media (max-width: 900px) {
  .charts-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .page {
    flex: none;
    min-height: auto;
  }

  .page__table-wrap {
    flex: none;
    min-height: 0;
  }
}

.toolbar--top {
  margin-bottom: 0;
}

.add-btn {
  padding: 0.5rem 1rem;
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

.add-btn--icon {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.add-btn__icon {
  font-size: 1.1rem;
}

.add-btn__text {
  font-size: 0.9rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
}

.stat-card {
  padding: 0.75rem 0.9rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  display: grid;
  gap: 0.25rem;
}

.stat-card__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}

.stat-card__value {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.stat-card__value--income {
  color: #15803d;
}

.stat-card__value--expense {
  color: #b91c1c;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.period-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.period-section__left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.toolbar--period {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.toolbar__label {
  font-size: 0.85rem;
  color: #64748b;
}

.period-toggle {
  display: inline-flex;
  padding: 0.15rem;
  border-radius: 999px;
  background-color: #e2e8f0;
  gap: 0.15rem;
}

.period-toggle__btn {
  border: none;
  background: transparent;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #64748b;
}

.period-toggle__btn--active {
  background-color: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.15);
}

.period-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.period-nav {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.period-nav__btn {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  background: #fff;
  font-size: 1.1rem;
  color: #475569;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.period-nav__btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.period-nav__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.period-nav__input {
  padding: 0.35rem 1.75rem 0.35rem 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
}

.period-nav__month {
  display: inline-flex;
  gap: 0.35rem;
}

.period-nav__select {
  padding: 0.35rem 1.75rem 0.35rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
  min-width: 4rem;
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
