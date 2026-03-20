export interface Budget {
  id: string
  user_id: string
  category: string
  amount: number
  period: string
  created_at?: string
}

export interface BudgetCreatePayload {
  category: string
  amount: number
  period?: string
}

export interface BudgetUpdatePayload {
  category?: string
  amount?: number
  period?: string
}
