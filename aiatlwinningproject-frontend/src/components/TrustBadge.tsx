import { Star, CheckCircle, History } from 'lucide-react'
import type { ProfileTrustSummary } from '@/types/trust'
import { cn } from '@/lib/utils'

interface TrustBadgeProps {
  summary: ProfileTrustSummary
  onOpenHistory?: () => void
  className?: string
}

export default function TrustBadge({ summary, onOpenHistory, className }: TrustBadgeProps) {
  const successRate = summary.totalTransactions
    ? Math.round((summary.successfulTransactions / summary.totalTransactions) * 100)
    : 0

  const tooltip = `${summary.averageRating.toFixed(1)}★ • ${summary.ratingCount} ratings • ${summary.successfulTransactions}/${summary.totalTransactions} successful`

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <span
        className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-neutral-700 dark:border-white/10 dark:bg-white/10 dark:text-white/90"
        title={tooltip}
      >
        <Star className="size-3.5 text-yellow-400" />
        <span className="font-medium">{summary.averageRating.toFixed(1)}</span>
        <span className="text-zinc-500 dark:text-zinc-300">({summary.ratingCount})</span>
      </span>
      <span
        className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-neutral-700 dark:border-white/10 dark:bg-white/10 dark:text-white/90"
        title={`Successful transactions: ${summary.successfulTransactions}/${summary.totalTransactions}`}
      >
        <CheckCircle className="size-3.5 text-emerald-400" />
        {successRate}% success
      </span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onOpenHistory?.()
        }}
        className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-neutral-700 transition hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/10 dark:text-white/90 dark:hover:bg-white/20 dark:focus-visible:ring-offset-zinc-900"
      >
        <History className="size-3.5 text-fuchsia-400" />
        History
      </button>
    </div>
  )
}
