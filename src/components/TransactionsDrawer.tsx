import { useEffect, useRef, useState } from 'react'
import { X, Filter } from 'lucide-react'
import { getProfileHistory } from '@/services/trust'
import type { ProfileHistoryResponse, Transaction } from '@/types/trust'

const FILTER_TABS = ['ALL', 'SUCCESS', 'UNSUCCESS'] as const

type FilterTab = (typeof FILTER_TABS)[number]

interface TransactionsDrawerProps {
  userId: string
  open: boolean
  onClose: () => void
}

const filterLabel: Record<FilterTab, string> = {
  ALL: 'All',
  SUCCESS: 'Successful',
  UNSUCCESS: 'Unsuccessful',
}

const statusLabel: Record<Transaction['status'], string> = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
}

export default function TransactionsDrawer({ userId, open, onClose }: TransactionsDrawerProps) {
  const [data, setData] = useState<ProfileHistoryResponse | null>(null)
  const [filter, setFilter] = useState<FilterTab>('ALL')
  const [loading, setLoading] = useState(false)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const previousActiveRef = useRef<Element | null>(null)

  useEffect(() => {
    if (!open) return

    let active = true
    setFilter('ALL')
    setData(null)
    setLoading(true)
    getProfileHistory(userId)
      .then((res) => {
        if (!active) return
        setData(res)
        setCursor(res.nextCursor ?? undefined)
      })
      .finally(() => setLoading(false))

    return () => {
      active = false
    }
  }, [open, userId])

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      previousActiveRef.current = document.activeElement
      closeButtonRef.current?.focus()
    } else {
      if (previousActiveRef.current instanceof HTMLElement) {
        previousActiveRef.current.focus()
      }
      previousActiveRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (event: FocusEvent) => {
      if (!containerRef.current) return
      if (containerRef.current.contains(event.target as Node)) return
      event.preventDefault()
      closeButtonRef.current?.focus()
    }
    document.addEventListener("focus", handler, true)
    return () => document.removeEventListener("focus", handler, true)
  }, [open])

  const filteredTransactions = (txs: Transaction[]) => {
    if (filter === 'ALL') return txs
    if (filter === 'SUCCESS') return txs.filter((t) => t.status === 'SUCCESS')
    return txs.filter((t) => t.status !== 'SUCCESS')
  }

  const loadMore = async () => {
    if (!cursor) return
    setLoading(true)
    const more = await getProfileHistory(userId, cursor)
    setData((prev) =>
      prev
        ? {
            ...prev,
            transactions: [...prev.transactions, ...more.transactions],
            nextCursor: more.nextCursor,
          }
        : more,
    )
    setCursor(more.nextCursor ?? undefined)
    setLoading(false)
  }

  const displayed = data ? filteredTransactions(data.transactions) : []

  return (
    <div aria-hidden={!open} className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Profile transaction history"
        className={`absolute bottom-0 left-0 right-0 mx-auto w-full max-w-2xl rounded-t-2xl border border-black/10 bg-white p-5 shadow-xl transition-transform dark:border-white/10 dark:bg-zinc-950 md:p-6 ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Trust & History</div>
          <button
            ref={closeButtonRef}
            className="rounded-lg p-2 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:bg-white/5 dark:focus-visible:ring-offset-zinc-950"
            onClick={onClose}
            aria-label="Close history"
          >
            <X className="size-5" />
          </button>
        </div>

        {data && (
          <div className="mt-3">
            <div className="text-lg font-semibold">{data.summary.displayName}</div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {data.summary.successfulTransactions}/{data.summary.totalTransactions} successful · {data.summary.averageRating.toFixed(1)}★ ({data.summary.ratingCount})
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <Filter className="size-4" /> Filter
          </span>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-full px-3 py-1.5 text-sm border border-black/10 transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5 ${filter === tab ? 'bg-black/5 dark:bg-white/10' : ''}`}
            >
              {filterLabel[tab]}
            </button>
          ))}
        </div>

        <div className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {!data && !loading && <div className="text-sm text-zinc-500 dark:text-zinc-400">No history available.</div>}
          {data &&
            displayed.map((txn) => (
              <div
                key={txn.id}
                className="rounded-xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{txn.title}</div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      txn.status === 'SUCCESS' ? 'border-emerald-400/30 text-emerald-300' : 'border-rose-400/30 text-rose-300'
                    }`}
                  >
                    {statusLabel[txn.status]}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                  <span>{new Date(txn.date).toLocaleDateString()}</span>
                  <span>with {txn.counterpartName}</span>
                  {typeof txn.ratingGiven === "number" && <span>{txn.ratingGiven}★</span>}
                </div>
                {txn.notes && <div className="mt-1 text-sm text-zinc-300">{txn.notes}</div>}
              </div>
            ))}
          {data && displayed.length === 0 && !loading && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400">No transactions in this filter.</div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{data?.transactions.length ?? 0} transactions loaded</div>
          <button
            type="button"
            disabled={!cursor || loading}
            onClick={loadMore}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm transition hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            {loading ? 'Loading…' : cursor ? 'Load more' : 'End of list'}
          </button>
        </div>
      </div>
    </div>
  )
}
