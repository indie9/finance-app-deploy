<template>
  <div class="table-wrapper">
    <div class="table-toolbar">
      <button
        type="button"
        class="table-toolbar__refresh"
        :disabled="loading"
        :aria-busy="loading"
        :aria-label="loading ? 'Обновление списка...' : 'Обновить список транзакций'"
        title="Обновить данные с сервера"
        @click="emit('refresh')"
      >
        <span class="table-toolbar__refresh-icon" aria-hidden="true">⟳</span>
        <span class="table-toolbar__refresh-text">Обновить данные</span>
      </button>
      <label class="filter">
        <span class="filter__icon" aria-hidden="true">🔍</span>
        <input
          v-model="filterInput"
          type="text"
          placeholder="Поиск..."
          class="filter__input"
          aria-label="Поиск по описанию и категории"
        >
      </label>
    </div>

    <div class="table-scroll">
      <div v-if="loading && transactions.length > 0" class="table-preloader" aria-hidden="true">
        <span class="table-preloader__spinner" />
      </div>
      <table class="tx-table" role="grid">
        <thead>
        <tr>
          <th
            v-for="col in columnIds"
            :key="col.id"
            :class="['tx-th', col.sortable && 'tx-th--sortable']"
            @click="col.sortable && onSortClick(col.id)"
          >
            <span class="tx-th__content">
              <span>{{ col.header }}</span>
              <span v-if="col.sortable" class="tx-th__icon">
                <span v-if="sortBy === col.id && sortOrder === 'asc'">▲</span>
                <span v-else-if="sortBy === col.id && sortOrder === 'desc'">▼</span>
                <span v-else>⇅</span>
              </span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading && transactions.length === 0" class="tx-row tx-row--loading">
          <td :colspan="columnIds.length" class="tx-empty">
            Загрузка…
          </td>
        </tr>
        <tr v-else-if="transactions.length === 0">
          <td :colspan="columnIds.length" class="tx-empty">
            Нет транзакций для отображения.
          </td>
        </tr>
        <tr
          v-else
          v-for="tx in transactions"
          :key="tx.id"
          :class="[
            'tx-row',
            tx.type === 'income' ? 'tx-row--income' : 'tx-row--expense'
          ]"
        >
          <td>{{ formatDate(tx.date) }}</td>
          <td>{{ tx.description }}</td>
          <td>{{ tx.category }}</td>
          <td>{{ formatAmount(tx.amount) }}</td>
          <td>
            <span class="tx-type-pill" :class="tx.type === 'income' ? 'tx-type-pill--income' : 'tx-type-pill--expense'">
              {{ tx.type === 'income' ? 'Доход' : 'Расход' }}
            </span>
          </td>
        </tr>
      </tbody>
      </table>
    </div>

    <!--
      Пагинация временно отключена для работы с графиками на полном наборе данных.
      Разметка и логика оставлены закомментированными на случай будущего возвращения.

    <div v-if="transactions.length > 0" class="pagination">
      <label class="pagination__page-size">
        <span>На странице</span>
        <select
          :value="limit"
          class="pagination__select"
          :disabled="loading"
          @change="onLimitChange($event)"
        >
          <option v-for="size in pageSizeOptions" :key="size" :value="size">
            {{ size }}
          </option>
        </select>
      </label>
      <div class="pagination__center">
        <button
          type="button"
          class="pagination__btn"
          :disabled="page <= 1 || loading"
          @click="goToPage(1)"
        >
          «
        </button>
        <button
          type="button"
          class="pagination__btn"
          :disabled="page <= 1 || loading"
          @click="goToPage(page - 1)"
        >
          ‹
        </button>
        <span class="pagination__info">
          Страница
          <input
            v-model.number="pageInput"
            type="number"
            min="1"
            :max="totalPages"
            class="pagination__page-input"
            :disabled="loading"
            @change="applyPageInput"
          >
          из {{ totalPages }}
        </span>
        <button
          type="button"
          class="pagination__btn"
          :disabled="page >= totalPages || loading"
          @click="goToPage(page + 1)"
        >
          ›
        </button>
        <button
          type="button"
          class="pagination__btn"
          :disabled="page >= totalPages || loading"
          @click="goToPage(totalPages)"
        >
          »
        </button>
      </div>
      <span class="pagination__total">
        Всего {{ total }}
      </span>
    </div>
    -->
  </div>
</template>

<script setup lang="ts">
import type { Transaction } from '~/types/transaction'

const props = withDefaults(
  defineProps<{
    transactions: Transaction[]
    total: number
    page: number
    limit: number
    sortBy: 'date' | 'amount' | 'description' | 'category' | 'type'
    sortOrder: 'asc' | 'desc'
    categoryFilter: string
    loading?: boolean
  }>(),
  { loading: false }
)

const emit = defineEmits<{
  refresh: []
  'update:page': [value: number]
  'update:sort-by': [value: 'date' | 'amount' | 'description' | 'category' | 'type']
  'update:sort-order': [value: 'asc' | 'desc']
  'update:category-filter': [value: string]
  'update:limit': [value: number]
}>()

const { formatDate, formatAmount } = useFormatters()

const columnIds = [
  { id: 'date', header: 'Дата', sortable: true },
  { id: 'description', header: 'Описание', sortable: true },
  { id: 'category', header: 'Категория', sortable: true },
  { id: 'amount', header: 'Сумма', sortable: true },
  { id: 'type', header: 'Тип', sortable: true },
]

// Пагинация временно отключена, но вычисление оставлено на будущее.
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.limit)))

const filterInput = ref(props.categoryFilter)
watch(() => props.categoryFilter, (v) => {
  filterInput.value = v
})
let categoryDebounce: ReturnType<typeof setTimeout> | null = null
watch(filterInput, (value) => {
  if (categoryDebounce) clearTimeout(categoryDebounce)
  categoryDebounce = setTimeout(() => {
    emit('update:category-filter', value)
    emit('update:page', 1)
    categoryDebounce = null
  }, 300)
})

const pageInput = ref(props.page)
// const pageSizeOptions = [5, 10, 20, 50]

function onSortClick(columnId: string) {
  if (!['date', 'amount', 'description', 'category', 'type'].includes(columnId)) return
  if (props.sortBy === columnId) {
    emit('update:sort-order', props.sortOrder === 'desc' ? 'asc' : 'desc')
  } else {
    emit('update:sort-by', columnId as 'date' | 'amount' | 'description' | 'category' | 'type')
    emit('update:sort-order', 'desc')
  }
  emit('update:page', 1)
}

// function goToPage(p: number) {
//   const next = Math.max(1, Math.min(p, totalPages.value))
//   emit('update:page', next)
// }

// function onLimitChange(event: Event) {
//   const value = Number((event.target as HTMLSelectElement).value) || props.limit
//   emit('update:page', 1)
//   ;(emit as any)('update:limit', value)
// }

// function applyPageInput() {
//   if (!pageInput.value) return
//   goToPage(pageInput.value)
// }
</script>

<style scoped>
.table-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.table-toolbar {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.table-toolbar__refresh {
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #fff;
  font-size: 0.85rem;
  color: #475569;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.table-toolbar__refresh:disabled {
  cursor: wait;
  opacity: 0.8;
}

.table-toolbar__refresh:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.table-toolbar__refresh-icon {
  font-size: 1.05rem;
  color: #64748b;
}

.table-toolbar__refresh-text {
  font-weight: 500;
}

@media (max-width: 768px) {
  .table-toolbar__refresh-text {
    display: none;
  }

  .table-toolbar__refresh {
    padding: 0.35rem;
  }
}

.filter {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 260px;
  width: 100%;
}

.filter__input {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  font-size: 0.85rem;
}

.filter__icon {
  font-size: 0.9rem;
  color: #94a3b8;
}

.table-scroll {
  position: relative;
  overflow-y: auto;
  overflow-x: auto;
  flex: 1;
  min-height: 0;
}

@media (max-width: 768px) {
  .table-wrapper {
    flex: none;
    min-height: 200px;
  }

  .table-scroll {
    flex: none;
    min-height: 200px;
    max-height: none;
  }
}

.table-preloader {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.75);
  z-index: 2;
}

.table-preloader__spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: table-spin 0.7s linear infinite;
}

@keyframes table-spin {
  to { transform: rotate(360deg); }
}

.tx-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
}

th,
td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.9rem;
}

.tx-th {
  background: #f8fafc;
  font-weight: 600;
  color: #0f172a;
  user-select: none;
  position: sticky;
  top: 0;
  z-index: 1;
  box-shadow: 0 1px 0 0 #e2e8f0;
}

.tx-th__content {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.tx-th--sortable {
  cursor: pointer;
}

.tx-th__icon {
  font-size: 0.7rem;
  color: #94a3b8;
}

.tx-row {
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
}

.tx-row--income {
  background-color: #ecfdf3;
}

.tx-row--expense {
  background-color: #fef2f2;
}

.tx-row--loading .tx-empty {
  color: #94a3b8;
}

.tx-row:hover {
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}

.tx-type-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tx-type-pill--income {
  background-color: #dcfce7;
  color: #166534;
}

.tx-type-pill--expense {
  background-color: #fee2e2;
  color: #b91c1c;
}

.tx-empty {
  padding: 1.25rem;
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
}

.pagination {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.pagination__info {
  font-size: 0.85rem;
  color: #64748b;
}

.pagination__btn {
  padding: 0.4rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  background: #fff;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.pagination__btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.pagination__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pagination__center {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination__page-size {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #64748b;
}

.pagination__select {
  padding: 0.25rem 0.5rem;
  border-radius: 0.4rem;
  border: 1px solid #cbd5e1;
  font-size: 0.85rem;
}

.pagination__page-input {
  width: 3rem;
  margin: 0 0.25rem;
  padding: 0.15rem 0.3rem;
  border-radius: 0.35rem;
  border: 1px solid #cbd5e1;
  font-size: 0.85rem;
  text-align: center;
}

.pagination__total {
  font-size: 0.8rem;
  color: #94a3b8;
}
</style>
