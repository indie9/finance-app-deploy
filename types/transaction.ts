export interface Transaction {
  id: string
  user_id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string
  description: string
}

/** Тело запроса для создания транзакции (без id и user_id). */
export interface TransactionCreatePayload {
  amount: number
  type: 'income' | 'expense'
  category: string
  date?: string
  description?: string
}

/** Тело запроса для обновления транзакции (все поля опциональны). */
export interface TransactionUpdatePayload {
  amount?: number
  type?: 'income' | 'expense'
  category?: string
  date?: string
  description?: string
}
