<template>
  <div class="card">
    <h2 class="card__title">Динамика баланса</h2>
    <div class="card__body">
      <div v-if="!hasData" class="card__empty">
        Недостаточно данных для построения графика.
      </div>
      <Line
        v-else
        :data="chartData"
        :options="chartOptions"
        aria-label="График динамики баланса"
        role="img"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js'
import type { Transaction } from '~/types/transaction'
import { buildBalanceTimeline } from '~/utils/transactionsCharts'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

const props = defineProps<{
  transactions: Transaction[]
}>()

const timeline = computed(() => buildBalanceTimeline(props.transactions))

const hasData = computed(() => timeline.value.length > 1)

const chartData = computed(() => ({
  labels: timeline.value.map(p => p.date),
  datasets: [
    {
      label: 'Баланс',
      data: timeline.value.map(p => p.balance),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.15)',
      tension: 0.25,
      fill: true,
      pointRadius: 2,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 7,
      },
    },
    y: {
      beginAtZero: false,
    },
  },
  plugins: {
    legend: {
      display: false,
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

