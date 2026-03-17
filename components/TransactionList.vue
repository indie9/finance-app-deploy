<template>
  <TransitionGroup
    tag="ul"
    name="list"
    class="transaction-list list-none p-0 m-0 grid gap-3"
  >
    <li
      v-for="tx in transactions"
      :key="tx.id"
      class="transaction-item rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
      :class="[
        tx.type === 'income'
          ? 'border-l-4 border-l-emerald-500 bg-emerald-50/50'
          : 'border-l-4 border-l-rose-500 bg-rose-50/50',
        isOptimisticTransaction(tx) && 'transaction-item--optimistic'
      ]"
    >
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span class="text-sm text-slate-500 tabular-nums">
          {{ formatDate(tx.date) }}
        </span>
        <span class="font-medium text-slate-800">
          {{ tx.category }}
        </span>
        <span
          class="ml-auto font-bold tabular-nums"
          :class="
            tx.type === 'income'
              ? 'text-emerald-700'
              : 'text-rose-700'
          "
        >
          {{ tx.type === 'income' ? '+' : '−' }}{{ formatAmount(tx.amount) }}
        </span>
      </div>
      <div class="mt-1 flex items-center gap-2">
        <span
          class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
          :class="
            tx.type === 'income'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-rose-100 text-rose-800'
          "
        >
          {{ tx.type === 'income' ? 'Доход' : 'Расход' }}
        </span>
        <span
          v-if="tx.description"
          class="text-sm text-slate-500 truncate"
        >
          {{ tx.description }}
        </span>
        <span
          v-if="isOptimisticTransaction(tx)"
          class="text-xs text-slate-400"
          title="Сохраняется на сервере"
        >
          Сохраняется…
        </span>
      </div>
    </li>
  </TransitionGroup>
</template>

<script setup lang="ts">
import type { Transaction } from '~/types/transaction'
import { isOptimisticTransaction } from '~/composables/useTransactions'

defineProps<{
  transactions: Transaction[]
}>()

const { formatDate, formatAmount } = useFormatters()
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

.list-move {
  transition: transform 0.25s ease;
}

.transaction-item--optimistic {
  opacity: 0.92;
  animation: optimistic-pulse 1.5s ease-in-out infinite;
}

@keyframes optimistic-pulse {
  0%, 100% { opacity: 0.92; }
  50% { opacity: 1; }
}
</style>
