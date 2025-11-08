export type TransactionStatus = "SUCCESS" | "FAILED" | "CANCELLED"

export interface Transaction {
  id: string
  title: string
  counterpartName: string
  date: string // ISO
  status: TransactionStatus
  ratingGiven?: number
  notes?: string
}

export interface ProfileTrustSummary {
  userId: string
  displayName: string
  avatarUrl?: string
  totalTransactions: number
  successfulTransactions: number
  averageRating: number
  ratingCount: number
}

export interface ProfileHistoryResponse {
  summary: ProfileTrustSummary
  transactions: Transaction[]
  nextCursor?: string | null
}

