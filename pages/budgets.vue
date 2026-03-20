<template>
  <section class="page">
    <BudgetModal v-model="showModal" :budget="editingBudget" @success="onModalSuccess" />

    <div class="page-header">
      <h1 class="page-title">Бюджеты</h1>
      <button
        type="button"
        class="add-btn"
        aria-label="Добавить бюджет"
        @click="openCreate"
      >
        + Добавить бюджет
      </button>
    </div>

    <div v-if="isLoading" class="loading-state">
      Загрузка...
    </div>

    <div v-else-if="errorMessage" class="error-state" role="alert">
      {{ errorMessage }}
    </div>

    <template v-else>
      <div v-if="budgets.length === 0" class="empty-state">
        <p>Пока нет бюджетов. Добавьте первый.</p>
        <button type="button" class="add-btn add-btn--secondary" @click="openCreate">
          + Добавить бюджет
        </button>
      </div>

      <div v-else class="budgets-content">
        <div class="budgets-filter">
          <label class="filter-label">Показать траты за месяц:</label>
          <input
            v-model="selectedMonth"
            type="month"
            class="filter-input"
          >
        </div>

        <div class="budgets-table-wrap">
          <table class="budgets-table">
            <thead>
              <tr>
                <th>Категория</th>
                <th>Период</th>
                <th class="text-right">Лимит</th>
                <th class="text-right">Факт</th>
                <th class="text-right">Остаток</th>
                <th class="actions-col" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="b in sortedBudgets"
                :key="b.id"
                class="budget-row"
              >
                <td>{{ b.category }}</td>
                <td>{{ periodLabel(b.period) }}</td>
                <td class="text-right">{{ formatAmount(b.amount) }}</td>
                <td class="text-right">{{ formatAmount(getSpending(b)) }}</td>
                <td class="text-right" :class="getRemainderClass(b)">
                  {{ formatAmount(getRemainder(b)) }}
                </td>
                <td class="actions-col">
                  <button
                    type="button"
                    class="action-btn action-btn--edit"
                    aria-label="Редактировать"
                    title="Редактировать"
                    @click="openEdit(b)"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    class="action-btn action-btn--delete"
                    aria-label="Удалить"
                    title="Удалить"
                    @click="confirmDelete(b)"
                  >
                    ×
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="confirmModal"
          class="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          @click.self="confirmModal = false"
          @keydown.escape="confirmModal = false"
        >
          <div class="modal-backdrop" />
          <div class="modal-box modal-box--confirm">
            <h2 id="confirm-title" class="modal-title">Удалить бюджет?</h2>
            <p v-if="deletingBudget" class="confirm-text">
              Категория «{{ deletingBudget.category }}»
            </p>
            <div class="confirm-actions">
              <button
                type="button"
                class="btn btn--secondary"
                @click="confirmModal = false"
              >
                Отмена
              </button>
              <button
                type="button"
                class="btn btn--danger"
                :disabled="deleteMutation.isPending?.value"
                @click="executeDelete"
              >
                {{ deleteMutation.isPending?.value ? 'Удаление...' : 'Удалить' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import type { Budget } from '~/types/budget'

const showModal = ref(false)
const editingBudget = ref<Budget | null>(null)
const confirmModal = ref(false)
const deletingBudget = ref<Budget | null>(null)
const d = new Date()
const selectedMonth = ref(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)

const { data: budgets, isLoading, isError, error } = useBudgetsQuery()
const { data: spending } = useSpendingByCategoryQuery(selectedMonth)
const deleteMutation = useDeleteBudget()

const errorMessage = computed(() => {
  if (!isError.value || !error.value) return ''
  const e = error.value as { statusMessage?: string; message?: string }
  return e?.statusMessage ?? e?.message ?? 'Ошибка загрузки'
})

const sortedBudgets = computed(() => {
  const list = budgets.value ?? []
  return [...list].sort((a, b) => a.category.localeCompare(b.category, 'ru'))
})

function openCreate() {
  editingBudget.value = null
  showModal.value = true
}

function openEdit(b: Budget) {
  editingBudget.value = b
  showModal.value = true
}

function onModalSuccess() {
  editingBudget.value = null
}

function confirmDelete(b: Budget) {
  deletingBudget.value = b
  confirmModal.value = true
}

function executeDelete() {
  if (!deletingBudget.value) return
  deleteMutation.mutate(deletingBudget.value.id, {
    onSuccess: () => {
      confirmModal.value = false
      deletingBudget.value = null
    },
  })
}

function periodLabel(period: string): string {
  return period === 'monthly' ? 'Ежемесячно' : period
}

function normalizeCategory(c: string): string {
  return c.trim().toLowerCase()
}

function getSpending(b: Budget): number {
  const key = normalizeCategory(b.category)
  return (spending.value?.[key] ?? 0)
}

function getRemainder(b: Budget): number {
  const fact = getSpending(b)
  return b.amount - fact
}

function getRemainderClass(b: Budget): string {
  const rem = getRemainder(b)
  if (rem < 0) return 'remainder--over'
  if (rem === 0) return 'remainder--zero'
  return 'remainder--ok'
}

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
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
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
}

.add-btn:hover {
  background: #1d4ed8;
}

.add-btn--secondary {
  background: #e2e8f0;
  color: #334155;
}

.add-btn--secondary:hover {
  background: #cbd5e1;
}

.loading-state,
.error-state {
  padding: 2rem;
  text-align: center;
  background: #f8fafc;
  border-radius: 0.75rem;
  color: #64748b;
}

.error-state {
  background: #fef2f2;
  color: #b91c1c;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  background: #f8fafc;
  border-radius: 0.75rem;
  color: #64748b;
}

.empty-state p {
  margin: 0 0 1rem;
}

.budgets-filter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.filter-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
}

.filter-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  font: inherit;
}

.budgets-table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #fff;
}

.budgets-table {
  width: 100%;
  border-collapse: collapse;
}

.budgets-table th,
.budgets-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.budgets-table th {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  background: #f8fafc;
}

.budgets-table .text-right {
  text-align: right;
}

.budgets-table .actions-col {
  width: 1%;
  white-space: nowrap;
}

.budget-row:last-child td {
  border-bottom: none;
}

.remainder--over {
  color: #dc2626;
  font-weight: 600;
}

.remainder--zero {
  color: #ca8a04;
}

.remainder--ok {
  color: #16a34a;
}

.action-btn {
  padding: 0.35rem 0.5rem;
  border: none;
  border-radius: 0.4rem;
  background: transparent;
  font: inherit;
  cursor: pointer;
  transition: background 0.15s;
}

.action-btn--edit:hover {
  background: #dbeafe;
  color: #2563eb;
}

.action-btn--delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
}

.modal-box {
  position: relative;
  width: 100%;
  max-width: 28rem;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding: 1.5rem;
}

.modal-title {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.confirm-text {
  margin: 0 0 1.25rem;
  color: #64748b;
}

.confirm-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.btn--secondary {
  background: #e2e8f0;
  color: #334155;
}

.btn--secondary:hover {
  background: #cbd5e1;
}

.btn--danger {
  background: #dc2626;
  color: #fff;
}

.btn--danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn--danger:disabled {
  opacity: 0.7;
  cursor: wait;
}
</style>
