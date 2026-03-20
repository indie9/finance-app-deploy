<template>
  <div class="card">
    <h2 class="card__title">Динамика баланса</h2>
    <div class="card__body">
      <div v-if="!hasData" class="card__empty">
        Недостаточно данных для построения графика.
      </div>
      <Bar
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
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Transaction } from '~/types/transaction'
import { buildBalanceTimeline } from '~/utils/transactionsCharts'

ChartJS.register(BarElement, LinearScale, CategoryScale, Tooltip, Legend)

const props = defineProps<{
  transactions: Transaction[]
}>()

const timeline = computed(() => buildBalanceTimeline(props.transactions))

const { formatAmount } = useFormatters()

const hasData = computed(() => timeline.value.length >= 1)

function formatDayLabel(dateStr: string) {
  try {
    const d = parseISO(dateStr)
    return format(d, 'd MMM', { locale: ru })
  } catch {
    return dateStr
  }
}

const chartData = computed(() => {
  const points = timeline.value
  return {
    labels: points.map(p => formatDayLabel(p.date)),
    datasets: [
      {
        label: 'Баланс',
        data: points.map(p => p.balance),
        backgroundColor: points.map(p =>
          p.balance >= 0 ? 'rgba(37, 99, 235, 0.7)' : 'rgba(220, 38, 38, 0.7)'
        ),
        borderColor: points.map(p =>
          p.balance >= 0 ? '#2563eb' : '#dc2626'
        ),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        maxTicksLimit: 12,
        maxRotation: 45,
        minRotation: 0,
        font: { size: 11 },
        color: '#64748b',
      },
    },
    y: {
      beginAtZero: false,
      grid: { color: '#f1f5f9' },
      ticks: {
        callback(value: number) {
          return formatAmount(value)
        },
        font: { size: 11 },
        color: '#64748b',
        maxTicksLimit: 6,
      },
    },
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      align: 'end' as const,
      labels: {
        boxWidth: 14,
        boxHeight: 14,
        usePointStyle: true,
        padding: 16,
        font: { size: 12, weight: '500' as const },
        color: '#334155',
      },
    },
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 10,
      titleFont: { size: 12 },
      bodyFont: { size: 13 },
      displayColors: true,
      boxPadding: 4,
      callbacks: {
        title(items) {
          const idx = items[0]?.dataIndex
          if (idx == null || !timeline.value[idx]) return ''
          return format(parseISO(timeline.value[idx].date), 'd MMMM yyyy', { locale: ru })
        },
        label(ctx) {
          const v = ctx.parsed?.y
          if (v == null) return ''
          return `Баланс: ${formatAmount(v)}`
        },
      },
    },
  },
}))
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
