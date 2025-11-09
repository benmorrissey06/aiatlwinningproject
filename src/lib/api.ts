// Type definitions
export interface CampusUser {
  id: string
  name: string
  major: string
  dorm: string
  rating: number
  verified: boolean
  trustScore: number
  pastTrades: number
  badges: string[]
}

export interface FlashRequest {
  id: string
  text: string
  category: string
  urgency: number
  status: 'active' | 'fulfilled' | 'cancelled'
  userId: string
  createdAt: string
}

export interface Match {
  user: CampusUser
  likelihood: number
  distanceMin: number
  sharedTraits: string[]
  debug?: any
}

export interface Listing {
  id: string
  title: string
  category: string
  price: string
  photo: string
  owner: CampusUser
  lastActive: string
  condition?: string
  description?: string
  location?: string
}

export interface Flag {
  id: string
  reason: string
  snippet: string
  userId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  status: 'pending' | 'resolved' | 'dismissed'
}

// Use Vite proxy in development, or direct URL in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'http://127.0.0.1:8000')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Get access token from localStorage if available
  const accessToken = localStorage.getItem('accessToken')
  
  // Build headers object
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  // Add existing headers from init if any
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        headers[key] = value
      })
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([key, value]) => {
        headers[key] = value
      })
    } else {
      Object.assign(headers, init.headers)
    }
  }
  
  // Add Authorization header if token is available
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }
  
  const url = `${API_BASE_URL}${path}`
  console.log(`[API] Making request to: ${url}`, { method: init?.method || 'GET', headers })
  
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      headers,
    })
  } catch (fetchError: any) {
    // Handle network errors (Failed to fetch)
    console.error(`[API] Network error fetching ${url}:`, fetchError)
    const errorMessage = fetchError?.message || 'Network error'
    
    // Provide more specific error messages
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      throw new Error(
        `Cannot connect to backend server at ${API_BASE_URL}. ` +
        `Please ensure the backend is running on port 8000. ` +
        `Error: ${errorMessage}`
      )
    } else if (errorMessage.includes('CORS')) {
      throw new Error(
        `CORS error: The backend server may not be configured to allow requests from the frontend. ` +
        `Please check CORS settings. Error: ${errorMessage}`
      )
    } else {
      throw new Error(`Network request failed: ${errorMessage}`)
    }
  }

  if (!response.ok) {
    let detail: unknown
    let errorMessage = `API request failed (${response.status} ${response.statusText})`
    try {
      const jsonDetail = await response.json()
      detail = jsonDetail
      // Try to extract a meaningful error message
      if (jsonDetail && typeof jsonDetail === 'object') {
        if ('detail' in jsonDetail) {
          const detailValue = jsonDetail.detail
          // Handle Pydantic validation errors (array of error objects)
          if (Array.isArray(detailValue) && detailValue.length > 0) {
            // Extract the first error message
            const firstError = detailValue[0]
            if (typeof firstError === 'object' && firstError !== null) {
              if ('msg' in firstError) {
                errorMessage = String(firstError.msg)
                // Add location info if available
                if ('loc' in firstError && Array.isArray(firstError.loc)) {
                  errorMessage += ` (${firstError.loc.join(' -> ')})`
                }
              } else if ('message' in firstError) {
                errorMessage = String(firstError.message)
              } else {
                errorMessage = JSON.stringify(firstError)
              }
            } else {
              errorMessage = String(firstError)
            }
          } else if (typeof detailValue === 'string') {
            errorMessage = detailValue
          } else if (typeof detailValue === 'object' && detailValue !== null) {
            // Try to extract message from nested object
            if ('message' in detailValue) {
              errorMessage = String(detailValue.message)
            } else {
              errorMessage = JSON.stringify(detailValue)
            }
          } else {
            errorMessage = String(detailValue)
          }
        } else if ('message' in jsonDetail) {
          errorMessage = String(jsonDetail.message)
        } else if ('error' in jsonDetail) {
          errorMessage = String(jsonDetail.error)
        } else {
          errorMessage = JSON.stringify(jsonDetail)
        }
      } else {
        errorMessage = String(jsonDetail)
      }
    } catch {
      try {
        detail = await response.text()
        errorMessage = String(detail) || errorMessage
      } catch {
        errorMessage = `HTTP ${response.status} ${response.statusText}`
      }
    }
    // Create error with proper message
    const error = new Error(errorMessage)
    // Attach status code and detail to error for better handling
    ;(error as any).status = response.status
    ;(error as any).statusText = response.statusText
    ;(error as any).detail = detail
    ;(error as any).response = {
      status: response.status,
      statusText: response.statusText,
      data: detail,
    }
    throw error
  }

  return response.json() as Promise<T>
}

// All mock data removed - using backend API only

type ListingsFilters = {
  search?: string
  category?: string
  priceMax?: number
  verifiedOnly?: boolean
}

// API functions - all calls go to backend
export const api = {
  createFlashRequest: async (
    payload: { text: string; metadata?: Record<string, unknown> },
  ): Promise<{ success: boolean; id: string; data: any }> => {
    const body = JSON.stringify({
      text: payload.text,
      metadata: payload.metadata ?? {},
    })
    
    try {
      const data = await request<{ success: boolean; requestId: string; [key: string]: unknown }>(
        '/api/flash-requests',
        {
          method: 'POST',
          body,
        },
      )

      // Handle response - backend returns requestId in the response
      const requestId = data.requestId || (data as any).id
      
      if (!requestId) {
        console.error("Server response missing requestId:", data)
        throw new Error("Server response missing request ID. Please try again.")
      }

      return {
        success: Boolean(data?.success),
        id: requestId,
        data,
      }
    } catch (error: any) {
      console.error("createFlashRequest API error:", error)
      // Re-throw with more context for better error messages
      if (error instanceof Error) {
        throw error
      } else {
        const errorMessage = error?.message || error?.detail || "Failed to create flash request"
        throw new Error(errorMessage)
      }
    }
  },

  getSmartMatches: async (requestId: string): Promise<{ success: boolean; requestId: string; requestData: any; matches: Match[]; debug?: any }> => {
    const response = await request<{
      success: boolean
      requestId: string
      request: any
      matches: Array<Match & { debug?: any }>
      debug?: any
    }>(`/api/flash-requests/${requestId}/matches`)

    return {
      success: Boolean(response?.success),
      requestId: response.requestId,
      requestData: response.request,
      matches: response.matches.map((match) => ({
        user: match.user,
        likelihood: match.likelihood,
        distanceMin: match.distanceMin,
        sharedTraits: match.sharedTraits,
        debug: match.debug,
      })),
      debug: response.debug,
    }
  },

  sendPings: async (requestId: string, matchIds: string[], broadcastType?: 'narrow' | 'wide'): Promise<{ success: boolean; pinged: number; broadcastType?: string }> => {
    const data = await request<{
      success: boolean
      pinged: number
      broadcastType?: string
    }>(`/api/flash-requests/${requestId}/pings`, {
      method: 'POST',
      body: JSON.stringify({ matchIds, broadcastType }),
    })
    return data
  },

  searchListings: async (filters: ListingsFilters = {}): Promise<{ listings: Listing[] }> => {
    const { search = '', category, priceMax, verifiedOnly } = filters

    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (category && category !== 'All') params.append('category', category)
      if (priceMax !== undefined) params.append('priceMax', priceMax.toString())
      if (verifiedOnly) params.append('verifiedOnly', 'true')

      const response = await request<{
        success: boolean
        listings: Listing[]
        total: number
      }>(`/api/listings?${params.toString()}`)

      return {
        listings: response.listings || [],
      }
    } catch (error) {
      console.error('Error fetching listings from backend:', error)
      // Return empty array if backend is unavailable
      return {
        listings: [],
      }
    }
  },

  getMessages: async (): Promise<{ success: boolean; threads: any[] }> => {
    try {
      // Try to fetch from backend first
      const response = await request<{ success: boolean; threads: any[] }>('/api/messages')
      if (response.success && response.threads) {
        console.log('[api.getMessages] Fetched threads from backend:', response.threads)
        return response
      }
    } catch (error) {
      console.error('[api.getMessages] Failed to fetch from backend, using empty list:', error)
    }
    // Return empty list instead of mock data to avoid confusion
    return {
      success: true,
      threads: [],
    }
  },

  getThreadMessages: async (threadId: string): Promise<{ success: boolean; messages: any[] }> => {
    try {
      console.log(`[api.getThreadMessages] Fetching messages for threadId: ${threadId}`)
      const response = await request<{ success: boolean; messages: any[] }>(`/api/messages/${threadId}`)
      console.log(`[api.getThreadMessages] Received ${response.messages?.length || 0} messages`)
      
      // Convert ISO timestamp to readable format and ensure all required fields
      const messages = (response.messages || []).map(msg => ({
        id: msg.id || msg._id || Math.random().toString(36),
        senderId: msg.senderId || msg.sender_id || 'unknown',
        text: msg.text || '',
        timestamp: msg.timestamp 
          ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Just now',
        isOwn: msg.isOwn !== undefined ? msg.isOwn : false,
      }))
      
      console.log(`[api.getThreadMessages] Processed ${messages.length} messages`)
      return {
        success: true,
        messages,
      }
    } catch (error) {
      console.error('[api.getThreadMessages] ❌ Error fetching thread messages from backend:', error)
      // Return empty array if backend is unavailable
      return {
        success: false,
        messages: [],
      }
    }
  },

  sendMessage: async (
     threadId: string,
     text: string,
   ): Promise<{ success: boolean; messageId: string; text?: string }> => {
    try {
      const currentUserId = localStorage.getItem('userId') || 'current_user'
      console.log(`[api.sendMessage] Sending message to thread ${threadId}: "${text}"`)
      
      const response = await request<{ success: boolean; messageId: string; text?: string }>(`/api/messages/${threadId}`, {
        method: 'POST',
        body: JSON.stringify({
          text,
          senderId: currentUserId,
        }),
      })
      
      console.log(`[api.sendMessage] ✅ Backend response:`, response)
      
      // Ensure response has required fields
      if (response && (response.success || response.messageId)) {
        return {
          success: response.success !== false, // Default to true if not explicitly false
          messageId: response.messageId || '',
          text: response.text || text, // Use original text if response doesn't have it
        }
      }
      
      // If response doesn't have expected structure, but no error was thrown, assume success
      console.warn('[api.sendMessage] Response structure unexpected, but assuming success:', response)
      return {
        success: true,
        messageId: (response as any).messageId || 'unknown',
        text: text,
      }
    } catch (error) {
      console.error('[api.sendMessage] ❌ Error sending message to backend:', error)
      
      // Check if error is actually a success response that was mis-parsed
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status
        // If status is 200-299, the message was actually sent successfully
        if (status >= 200 && status < 300) {
          console.log('[api.sendMessage] Error has success status, message was sent successfully')
          // Try to extract response data from error
          const detail = (error as any).detail
          if (detail && typeof detail === 'object' && 'messageId' in detail) {
            return {
              success: true,
              messageId: detail.messageId || '',
              text: detail.text || text,
            }
          }
        }
      }
      
      // Don't return fake success - throw error so caller can handle it
      throw error
    }
  },

  getProfile: async (userId?: string): Promise<{ success: boolean; user: CampusUser }> => {
    if (!userId) {
      throw new Error('UserId is required to fetch profile')
    }
    
    try {
      const response = await request<{ user: any }>(`/api/users/${userId}/profile`)
      // Map backend response to CampusUser format
      const user: CampusUser = {
        id: response.user.id,
        name: response.user.name || 'User',
        major: response.user.major || response.user.inferredMajor || 'Undeclared',
        dorm: response.user.dorm || response.user.location || 'Not specified',
        verified: response.user.verified || false,
        trustScore: response.user.trustScore || 70,
        rating: response.user.rating || 0,
        pastTrades: response.user.pastTrades || 0,
        badges: response.user.badges || [],
      }
      return {
        success: true,
        user,
      }
    } catch (error) {
      console.error('Error fetching user profile from backend:', error)
      // Return a default user object on error
      throw new Error(`Failed to fetch user profile for userId: ${userId}`)
    }
  },

  updateProfile: async (_userId: string, _data: Partial<CampusUser>): Promise<{ success: boolean }> => {
    // TODO: Implement profile update endpoint
    throw new Error('Profile update not yet implemented')
  },

  getSafetyInfo: async (): Promise<{ success: boolean; info: any }> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return {
      success: true,
      info: {
        verification: 'School email required',
        privateComms: 'No personal info sharing',
        moderation: 'AI + Human review',
      },
    }
  },

  getFlags: async (): Promise<{ success: boolean; flags: Flag[] }> => {
    try {
      const response = await request<{ success: boolean; flags: Flag[] }>('/api/flags')
      return response
    } catch (error) {
      console.error('Error fetching flags from backend:', error)
      // Return empty array if backend is unavailable
      return {
        success: true,
        flags: [],
      }
    }
  },

  resolveFlag: async (flagId: string, action: 'resolve' | 'dismiss'): Promise<{ success: boolean }> => {
    try {
      const response = await request<{ success: boolean }>(`/api/flags/${flagId}`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      })
      return response
    } catch (error) {
      console.error('Error resolving flag:', error)
      throw new Error(`Failed to ${action} flag: ${flagId}`)
    }
  },

  // Legacy aliases for backward compatibility
  getListings: async (filters: any) => api.searchListings(filters),
  pingMatches: async (requestId: string, matchIds: string[], broadcastType?: 'narrow' | 'wide') => 
    api.sendPings(requestId, matchIds, broadcastType),
  submitRating: async (_threadId: string, _rating: number, _comment: string): Promise<{ success: boolean }> => {
    // TODO: Implement rating submission endpoint
    throw new Error('Rating submission not yet implemented')
  },

  seedProfiles: async (limit = 150) => {
    return request<{ success: boolean; loaded: number; totalProfiles: number }>(
      `/api/profiles/seed?limit=${limit}`,
      {
        method: 'POST',
      },
    )
  },
}
