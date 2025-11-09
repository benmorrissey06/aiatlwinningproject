import type { ProfileHistoryResponse, ProfileTrustSummary, Transaction } from '@/types/trust'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export async function getProfileHistory(userId: string, cursor?: string): Promise<ProfileHistoryResponse> {
  const url = new URL(`/api/profiles/${userId}/history`, API_BASE_URL)
  if (cursor) {
    url.searchParams.set('cursor', cursor)
  }

  let response: Response
  try {
    response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Failed to reach profile history endpoint, falling back to mock data.', error)
    return mockProfileHistory(userId, cursor)
  }

  if (response.ok) {
    return response.json() as Promise<ProfileHistoryResponse>
  }

  if (response.status === 404) {
    return mockProfileHistory(userId, cursor)
  }

  const detail = await response.text()
  throw new Error(`History request failed (${response.status} ${response.statusText}): ${detail}`)
}

export async function getProfileSummary(userId: string): Promise<ProfileTrustSummary> {
  const history = await getProfileHistory(userId)
  return history.summary
}

// --- Mock fallback ---
function rng(seed: number) {
  let t = seed >>> 0
  return () => ((t = (t * 1664525 + 1013904223) >>> 0) / 2 ** 32)
}

function mkDate(daysAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

function calcSummary(all: Transaction[]) {
  const total = all.length
  const successes = all.filter((t) => t.status === 'SUCCESS')
  const successfulTransactions = successes.length
  const ratings = successes
    .map((t) => t.ratingGiven ?? 0)
    .filter((n: number) => n > 0)
  const averageRating = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0
  return {
    total,
    successfulTransactions,
    ratingCount: ratings.length,
    averageRating: Number(averageRating.toFixed(2)),
  }
}

function makeBatch(userId: string, startIdx: number, count: number): Transaction[] {
  const random = rng(startIdx + userId.length)
  const titles = ['Textbook loan', 'Snack delivery', 'Phone charger', 'Umbrella swap', 'Lab goggles']
  const counterparts = ['AL', 'JB', 'KC', 'MT', 'ZZ']

  return Array.from({ length: count }).map((_, idx) => {
    const ok = random() > 0.18
    const rating = ok ? Math.max(1, Math.round(random() * 5)) : undefined
    const base: Transaction = {
      id: `${userId}-${startIdx + idx}`,
      title: titles[Math.floor(random() * titles.length)],
      counterpartName: counterparts[Math.floor(random() * counterparts.length)],
      date: mkDate(Math.floor(random() * 120)),
      status: ok ? 'SUCCESS' : random() > 0.6 ? 'CANCELLED' : 'FAILED',
      ratingGiven: rating,
      notes: ok ? undefined : 'No-show / timing mismatch',
    }
    return base
  })
}

async function mockProfileHistory(userId: string, cursor?: string): Promise<ProfileHistoryResponse> {
  const start = cursor ? parseInt(cursor, 10) : 0
  const batch = makeBatch(userId, start, 10)
  const historyPool = [...makeBatch(userId, 0, 20), ...batch]
  const { total, successfulTransactions, ratingCount, averageRating } = calcSummary(historyPool)

  return {
    summary: {
      userId,
      displayName: `User ${userId.slice(0, 4).toUpperCase()}`,
      avatarUrl: undefined,
      totalTransactions: total + 20,
      successfulTransactions,
      averageRating,
      ratingCount,
    },
    transactions: batch.sort((a, b) => b.date.localeCompare(a.date)),
    nextCursor: start + 10 >= 40 ? null : String(start + 10),
  }
}

