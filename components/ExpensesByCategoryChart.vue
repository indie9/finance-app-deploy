<template>
  <div class="card">
    <h2 class="card__title">
      Расходы по категориям{{ props.monthLabel ? ` (${props.monthLabel})` : '' }}
    </h2>
    <div class="card__body">
      <div v-if="!hasData" class="card__empty">
        Недостаточно данных для построения графика.
      </div>
      <Doughnut
        v-else
        :data="chartData"
        :options="chartOptions"
        aria-label="График расходов по категориям"
        role="img"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import type { Transaction } from '~/types/transaction'
import { aggregateByCategory } from '~/utils/transactionsCharts'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  transactions: Transaction[]
  monthLabel?: string
}>()

const dataset = computed(() => aggregateByCategory(props.transactions.filter(tx => tx.type === 'expense')))

const hasData = computed(() => dataset.value.length > 0)

const chartData = computed(() => ({
  labels: dataset.value.map(d => d.category),
  datasets: [
    {
      data: dataset.value.map(d => Math.abs(d.total)),
      backgroundColor: [
        '#ef4444',
        '#f97316',
        '#facc15',
        '#22c55e',
        '#3b82f6',
        '#a855f7',
        '#ec4899',
        '#14b8a6',
      ],
      borderWidth: 1,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
      },
    },
  },
}
</script>

<style scoped>
.card {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background-color: #ffffff;
  display: grid;
  gap: 0.75rem;
  width: 100%;
  max-width: 100%;
}

.card__body {
  position: relative;
  height: 300px;
}

.card__title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
}

.card__empty {
  font-size: 0.85rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

@media (max-width: 640px) {
  .card__body {
    height: 220px;
  }
}
</style>

