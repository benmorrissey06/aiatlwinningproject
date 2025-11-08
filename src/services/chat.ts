export interface DMThread {
  threadId: string
  userId: string
}

const API_BASE = '/api'

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function getOrCreateDM(userId: string): Promise<DMThread> {
  try {
    const existing = await fetchJSON<{ threadId: string }>(`${API_BASE}/dm/${userId}`)
    return { threadId: existing.threadId, userId }
  } catch {
    const hash = [...userId].reduce((acc, char) => ((acc * 31) ^ char.charCodeAt(0)) >>> 0, 7).toString(36)
    return { threadId: `dm_${hash}`, userId }
  }
}

