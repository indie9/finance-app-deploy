import type { Transaction } from '~/types/transaction'

export type CategoryChartPoint = {
  category: string
  total: number
}

export type BalanceTimelinePoint = {
  date: string
  balance: number
}

export function aggregateByCategory(transactions: Transaction[]): CategoryChartPoint[] {
  const totals = new Map<string, number>()

  for (const tx of transactions) {
    const prev = totals.get(tx.category) ?? 0
    const delta = tx.type === 'income' ? tx.amount : -tx.amount
    totals.set(tx.category, prev + delta)
  }

  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
}

export function buildBalanceTimeline(transactions: Transaction[]): BalanceTimelinePoint[] {
  const byDate = new Map<string, number>()

  for (const tx of transactions) {
    const day = tx.date.slice(0, 10)
    const delta = tx.type === 'income' ? tx.amount : -tx.amount
    byDate.set(day, (byDate.get(day) ?? 0) + delta)
  }

  const days = Array.from(byDate.keys()).sort()

  const result: BalanceTimelinePoint[] = []
  let cumulative = 0

  for (const day of days) {
    cumulative += byDate.get(day) ?? 0
    result.push({ date: day, balance: cumulative })
  }

  return result
}

/** Кумулятивный баланс по месяцам (date = первый день месяца YYYY-MM-01) */
export function buildBalanceTimelineByMonth(transactions: Transaction[]): BalanceTimelinePoint[] {
  const byMonth = new Map<string, number>()

  for (const tx of transactions) {
    const month = tx.date.slice(0, 7) // YYYY-MM
    const delta = tx.type === 'income' ? tx.amount : -tx.amount
    byMonth.set(month, (byMonth.get(month) ?? 0) + delta)
  }

  const months = Array.from(byMonth.keys()).sort()

  const result: BalanceTimelinePoint[] = []
  let cumulative = 0

  for (const month of months) {
    cumulative += byMonth.get(month) ?? 0
    result.push({ date: `${month}-01`, balance: cumulative })
  }

  return result
}

