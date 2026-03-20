<template>
  <div class="budget-progress">
    <h3 class="budget-progress__title">Бюджет по категориям</h3>

    <div v-if="!budgetsList.length" class="budget-progress__empty">
      Нет бюджетов. <NuxtLink to="/budgets">Добавить бюджет</NuxtLink>
    </div>

    <div v-else class="budget-progress__list">
      <div
        v-for="item in progressItems"
        :key="item.category"
        class="progress-item"
      >
        <div class="progress-item__header">
          <span class="progress-item__category">{{ item.category }}</span>
          <span class="progress-item__pct" :class="item.colorClass">
            {{ item.usagePctText }}
          </span>
        </div>
        <div class="progress-item__bar-wrap">
          <div
            class="progress-item__bar"
            :class="item.colorClass"
            :style="{ width: item.barWidth }"
          />
        </div>
        <div class="progress-item__meta">
          <span class="progress-item__spent">
            {{ formatAmount(item.spent) }} <span class="progress-item__sep">/</span> {{ formatAmount(item.limit) }}
          </span>
          <span class="progress-item__remainder" :class="item.remainderClass">
            {{ item.remainder >= 0 ? `Осталось ${formatAmount(item.remainder)}` : `Превышение ${formatAmount(-item.remainder)}` }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Budget } from '~/types/budget'

const props = withDefaults(
  defineProps<{
    month: string
  }>(),
  { month: '' }
)

const monthRef = computed(() => props.month || null)
const { data: budgets } = useBudgetsQuery()
const { data: spending } = useSpendingByCategoryQuery(monthRef)

const budgetsList = computed(() => budgets.value ?? [])

const { formatAmount } = useFormatters()

function normalizeCategory(c: string): string {
  return c.trim().toLowerCase()
}

const progressItems = computed(() => {
  const list = budgetsList.value
  const spentMap = spending.value ?? {}

  return list.map((b) => {
    const key = normalizeCategory(b.category)
    const spent = Number(spentMap[key]) || 0
    const limit = Math.max(0, Number(b.amount) || 0)
    const remainder = limit - spent
    const usagePct = limit > 0 ? (spent / limit) * 100 : 0
    const safePct = Number.isFinite(usagePct) ? usagePct : 0

    let colorClass = 'progress-item--green'
    if (safePct >= 100) colorClass = 'progress-item--red'
    else if (safePct >= 80) colorClass = 'progress-item--yellow'

    let remainderClass = 'progress-item__remainder--ok'
    if (spent > limit) remainderClass = 'progress-item__remainder--over'
    else if (safePct >= 100) remainderClass = 'progress-item__remainder--over'
    else if (safePct >= 80) remainderClass = 'progress-item__remainder--warn'

    const barWidth = `${Math.min(safePct, 100)}%`
    const usagePctText = `${Math.round(safePct)}%`

    return {
      category: b.category || 'Без названия',
      limit,
      spent,
      remainder,
      usagePct: safePct,
      usagePctText,
      barWidth,
      colorClass,
      remainderClass,
    }
  })
})
</script>

<style scoped>
.budget-progress {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #fff;
}

.budget-progress__title {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.budget-progress__empty {
  color: #64748b;
  font-size: 0.9rem;
}

.budget-progress__empty a {
  color: #2563eb;
  text-decoration: none;
}

.budget-progress__empty a:hover {
  text-decoration: underline;
}

.budget-progress__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-item {
  display: grid;
  gap: 0.35rem;
}

.progress-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-item__category {
  font-weight: 600;
  font-size: 0.9rem;
  color: #334155;
}

.progress-item__pct {
  font-size: 0.85rem;
  font-weight: 600;
}

.progress-item__bar-wrap {
  height: 0.5rem;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.progress-item__bar {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-item__bar.progress-item--green {
  background: #22c55e;
}

.progress-item__bar.progress-item--yellow {
  background: #eab308;
}

.progress-item__bar.progress-item--red {
  background: #ef4444;
}

.progress-item__pct.progress-item--green {
  color: #16a34a;
}

.progress-item__pct.progress-item--yellow {
  color: #ca8a04;
}

.progress-item__pct.progress-item--red {
  color: #dc2626;
}

.progress-item__meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  font-size: 0.8rem;
}

.progress-item__spent {
  color: #64748b;
}

.progress-item__sep {
  margin: 0 0.2rem;
  color: #94a3b8;
  font-weight: 400;
}

.progress-item__remainder--ok {
  color: #16a34a;
}

.progress-item__remainder--warn {
  color: #ca8a04;
}

.progress-item__remainder--over {
  color: #dc2626;
  font-weight: 600;
}
</style>
