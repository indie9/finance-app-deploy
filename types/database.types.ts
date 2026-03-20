/**
 * Типы для Supabase Database.
 * Можно перегенерировать: supabase gen types typescript --local > types/database.types.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          date: string
          description: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          date?: string
          description?: string
        }
        Update: Partial<{
          amount: number
          type: 'income' | 'expense'
          category: string
          date: string
          description: string
        }>
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category: string
          amount: number
          period: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          amount: number
          period?: string
          created_at?: string
        }
        Update: Partial<{
          category: string
          amount: number
          period: string
          created_at: string
        }>
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          currency: string | null
          monthly_budget: number | null
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          currency?: string | null
          monthly_budget?: number | null
          updated_at?: string
        }
        Update: Partial<{
          full_name: string | null
          currency: string | null
          monthly_budget: number | null
          updated_at: string
        }>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
