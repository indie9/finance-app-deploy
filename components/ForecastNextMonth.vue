<template>
  <div class="forecast">
    <h3 class="forecast__title">Прогноз на следующий месяц</h3>

    <div v-if="isLoading" class="forecast__loading">
      Загрузка...
    </div>

    <div v-else-if="errorMessage" class="forecast__error">
      {{ errorMessage }}
    </div>

    <template v-else>
      <div class="forecast__total">
        <span class="forecast__total-label">Ожидаемые расходы</span>
        <span class="forecast__total-value">{{ formatAmount(total) }}</span>
      </div>

      <div v-if="topCategories.length" class="forecast__top">
        <span class="forecast__top-label">Топ категорий:</span>
        <ul class="forecast__top-list">
          <li v-for="item in topCategories" :key="item.category">
            {{ item.category }} — {{ formatAmount(item.amount) }}
          </li>
        </ul>
      </div>

      <div v-if="overBudget.length" class="forecast__warning">
        <span class="forecast__warning-icon" aria-hidden="true">⚠</span>
        Возможный перерасход: {{ overBudget.map((o) => o.category).join(', ') }}
      </div>

      <p class="forecast__disclaimer">
        Это оценка на основе истории транзакций за последние месяцы, а не точный результат.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
const { data: forecast, isLoading, isError, error } = useForecastQuery(3)

const { formatAmount } = useFormatters()

const total = computed(() => forecast.value?.total ?? 0)
const topCategories = computed(() => forecast.value?.topCategories ?? [])
const overBudget = computed(() => forecast.value?.overBudget ?? [])

const errorMessage = computed(() => {
  if (!isError.value || !error.value) return ''
  const e = error.value as { statusMessage?: string; message?: string }
  return e?.statusMessage ?? e?.message ?? 'Ошибка загрузки'
})
</script>

<style scoped>
.forecast {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #fff;
}

.forecast__title {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.forecast__loading,
.forecast__error {
  color: #64748b;
  font-size: 0.9rem;
}

.forecast__error {
  color: #dc2626;
}

.forecast__total {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.forecast__total-label {
  font-size: 0.85rem;
  color: #64748b;
}

.forecast__total-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.forecast__top {
  margin-bottom: 1rem;
}

.forecast__top-label {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.forecast__top-list {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.9rem;
  color: #334155;
}

.forecast__top-list li {
  margin-bottom: 0.2rem;
}

.forecast__warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #b91c1c;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.forecast__warning-icon {
  font-size: 1.1rem;
}

.forecast__disclaimer {
  margin: 0;
  font-size: 0.75rem;
  color: #94a3b8;
}
</style>
