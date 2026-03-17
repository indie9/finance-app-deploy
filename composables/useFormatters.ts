/**
 * Общие форматтеры для чисел и дат (локаль ru-RU).
 */
export function useFormatters() {
  const formatAmount = (value: number, fractionDigits = 2) =>
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(value)

  const formatDate = (value: string | Date) =>
    new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'short'
    } as Intl.DateTimeFormatOptions).format(new Date(value))

  const formatBudget = (value: number, currency: 'RUB' | 'USD' | 'EUR') => {
    const formatted = new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
    const symbol = currency === 'RUB' ? ' ₽' : currency === 'USD' ? ' $' : ' €'
    return formatted + symbol
  }

  return { formatAmount, formatDate, formatBudget }
}
