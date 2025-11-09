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
  console.log(`[getOrCreateDM] Requesting DM thread for userId: ${userId}`)
  
  try {
    // Try to get existing thread from backend
    const existing = await fetchJSON<{ threadId: string; userId: string }>(`${API_BASE}/dm/${userId}`)
    console.log(`[getOrCreateDM] Found existing thread:`, existing)
    // Always use the userId we passed in, not the one from the response (response should match, but be safe)
    const finalUserId = existing.userId && existing.userId === userId ? existing.userId : userId
    return { threadId: existing.threadId, userId: finalUserId }
  } catch (error) {
    console.log(`[getOrCreateDM] Thread not found, creating new one for userId: ${userId}`)
    // If thread doesn't exist, try to create it
    try {
      const created = await fetchJSON<{ threadId: string; userId: string }>(`${API_BASE}/dm/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      console.log(`[getOrCreateDM] Created new thread:`, created)
      // Always use the userId we passed in
      const finalUserId = created.userId && created.userId === userId ? created.userId : userId
      return { threadId: created.threadId, userId: finalUserId }
    } catch (createError) {
      console.error(`[getOrCreateDM] Failed to create thread:`, createError)
      // Fallback: create deterministic thread ID based on userId
      // This ensures same userId always gets same threadId
      const currentUserId = localStorage.getItem('userId') || 'current_user'
      // Create a deterministic hash from both user IDs (sorted to ensure consistency)
      const userPair = [currentUserId, userId].sort().join('_')
      const hash = [...userPair].reduce((acc, char) => ((acc * 31) ^ char.charCodeAt(0)) >>> 0, 7).toString(36)
      console.log(`[getOrCreateDM] Using fallback thread ID for userId: ${userId}`)
      return { threadId: `dm_${hash}`, userId }
    }
  }
}

