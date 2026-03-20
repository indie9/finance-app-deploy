import Papa from 'papaparse'
import type { Transaction } from '~/types/transaction'

type RawCsvRow = {
  date?: string
  description?: string
  category?: string
  type?: string
  amount?: string
}

export type CsvParseResult = {
  transactions: Array<{
    rowIndex: number
    tx: Transaction
  }>
  invalidRows: Array<{
    rowIndex: number
    reason: string
    row: RawCsvRow
  }>
  totalRows: number
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/_/g, '')
}

function mapRowToRaw(row: Record<string, unknown>): RawCsvRow {
  const entries = Object.entries(row)

  const normalized: Record<string, string> = {}
  for (const [k, v] of entries) {
    if (v == null) continue
    normalized[normalizeHeader(String(k))] = String(v).trim()
  }

  const pick = (candidates: string[]) => {
    for (const c of candidates) {
      const key = normalizeHeader(c)
      if (normalized[key]) return normalized[key]
    }
    return undefined
  }

  return {
    date: pick(['date', 'дата', 'операцдат', 'датаоперации']),
    description: pick(['description', 'описание', 'описан', 'комментарий', 'comment']),
    category: pick(['category', 'категория', 'категор', 'categoryname']),
    type: pick(['type', 'тип', 'категориятип']),
    amount: pick(['amount', 'сумма', 'сум', 'количество', 'value']),
  }
}

function parseDateToIso(dateStr: string): string | null {
  const s = dateStr.trim()
  if (!s) return null

  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // DD.MM.YYYY
  const mDot = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (mDot) {
    const day = mDot[1]
    const month = mDot[2]
    const year = mDot[3]
    return `${year}-${month}-${day}`
  }

  // DD/MM/YYYY
  const mSlash = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (mSlash) {
    const day = mSlash[1]
    const month = mSlash[2]
    const year = mSlash[3]
    return `${year}-${month}-${day}`
  }

  return null
}

function parseAmountToNumber(amountStr: string): number | null {
  let s = amountStr.trim()
  if (!s) return null

  // remove spaces as thousands separator
  s = s.replace(/\s+/g, '')
  // allow comma decimal separator
  s = s.replace(/,/g, '.')

  // keep only valid numeric chars
  // (allows leading +/-, decimals and digits)
  s = s.replace(/[^0-9+\-\.]/g, '')

  const n = Number(s)
  if (!Number.isFinite(n)) return null
  if (n <= 0) return null
  return n
}

function normalizeType(typeStr: string): Transaction['type'] | null {
  const s = typeStr.trim().toLowerCase()
  if (!s) return null

  if (s === 'income' || s === 'in' || s === 'доход' || s === 'доходы') return 'income'
  if (s === 'expense' || s === 'out' || s === 'расход' || s === 'расходы') return 'expense'

  return null
}

function normalizeCsvRow(raw: RawCsvRow, rowIndex: number): { tx: Transaction | null; reason?: string } {
  const dateIso = raw.date ? parseDateToIso(raw.date) : null
  if (!dateIso) return { tx: null, reason: 'Некорректная дата' }

  const amount = raw.amount ? parseAmountToNumber(raw.amount) : null
  if (amount == null) return { tx: null, reason: 'Некорректная сумма' }

  const type = raw.type ? normalizeType(raw.type) : null
  if (!type) return { tx: null, reason: 'Неизвестный тип' }

  const category = raw.category?.trim() ?? ''
  if (!category) return { tx: null, reason: 'Пустая категория' }

  const description = raw.description?.trim() ?? ''

  return {
    tx: {
      id: `import-${rowIndex}`,
      user_id: 'import-user',
      amount,
      type,
      category,
      date: dateIso,
      description,
    },
  }
}

function parseCsvTextInternal(csvText: string): CsvParseResult {
  // Пытаемся распарсить универсально: Papa поддержит и ',' и ';' благодаря пробам.
  const candidatesDelimiters: Array<',' | ';'> = [',', ';']

  let parseResult: Papa.ParseResult<unknown> | null = null
  let bestScore = -1

  for (const delimiter of candidatesDelimiters) {
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      delimiter,
    })

    const fields = (result.meta?.fields ?? []) as string[]
    const normalizedFields = fields.map(normalizeHeader)
    const required = [
      normalizeHeader('date'),
      normalizeHeader('дата'),
      normalizeHeader('description'),
      normalizeHeader('описание'),
      normalizeHeader('category'),
      normalizeHeader('категория'),
      normalizeHeader('type'),
      normalizeHeader('тип'),
      normalizeHeader('amount'),
      normalizeHeader('сумма'),
    ]

    const score = required.reduce((acc, key) => (normalizedFields.includes(key) ? acc + 1 : acc), 0)

    if (score > bestScore) {
      bestScore = score
      parseResult = result
    }
  }

  if (!parseResult) return { transactions: [], invalidRows: [], totalRows: 0 }

  const invalidRows: CsvParseResult['invalidRows'] = []
  const transactions: CsvParseResult['transactions'] = []

  const rows = parseResult.data

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as Record<string, unknown>
    const raw = mapRowToRaw(row)
    const normalized = normalizeCsvRow(raw, i)
    if (!normalized.tx) {
      invalidRows.push({ rowIndex: i, reason: normalized.reason ?? 'Некорректная строка', row: raw })
      continue
    }
    transactions.push({ rowIndex: i, tx: normalized.tx })
  }

  return { transactions, invalidRows, totalRows: rows.length }
}

export async function parseTransactionsCsvFile(file: File): Promise<CsvParseResult> {
  const csvText = await file.text()
  return parseCsvTextInternal(csvText)
}

export function parseTransactionsCsvText(csvText: string): CsvParseResult {
  return parseCsvTextInternal(csvText)
}

