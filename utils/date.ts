/**
 * Утилиты для дат (работают на сервере и клиенте).
 */
import { format as formatDateFns, parseISO, addDays, isValid } from 'date-fns'
import { ru } from 'date-fns/locale'

/** Первый день месяца YYYY-MM-DD */
export function getStartOfMonth(year: number, month: number): string {
  const d = new Date(year, month - 1, 1)
  return formatDateFns(d, 'yyyy-MM-dd')
}

/** Последний день месяца YYYY-MM-DD */
export function getEndOfMonth(year: number, month: number): string {
  const d = new Date(year, month, 0)
  return formatDateFns(d, 'yyyy-MM-dd')
}

/** Для ГГГГ-ММ возвращает { from, to } */
export function getMonthRange(monthStr: string): { from: string; to: string } {
  const parts = monthStr.split('-').map(Number)
  const y = parts[0] ?? 0
  const m = parts[1] ?? 1
  return {
    from: getStartOfMonth(y, m),
    to: getEndOfMonth(y, m),
  }
}

/** Добавить дни к YYYY-MM-DD */
export function addDaysToDate(dateStr: string, delta: number): string {
  const d = parseISO(dateStr + 'T12:00:00')
  return formatDateFns(addDays(d, delta), 'yyyy-MM-dd')
}

/** Форматирование даты (ru-RU) */
export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? parseISO(value) : value
  if (!isValid(d)) return ''
  return formatDateFns(d, 'dd.MM.yyyy', { locale: ru })
}
