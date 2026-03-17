import { defineStore } from 'pinia'
import type { Transaction } from '~/types/transaction'

export const useTransactionStore = defineStore('transaction', {
  state: () => ({
    transactions: [] as Transaction[]
  }),

  getters: {
    incomeTransactions: (state) =>
      state.transactions.filter((t) => t.type === 'income'),
    expenseTransactions: (state) =>
      state.transactions.filter((t) => t.type === 'expense'),
    totalBalance: (state) =>
      state.transactions.reduce(
        (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
        0
      )
  },

  actions: {
    setTransactions(list: Transaction[]) {
      this.transactions = list
    },

    addTransaction(transaction: Transaction) {
      this.transactions.push(transaction)
    },

    clearTransactions() {
      this.transactions = []
    }
  }
})
