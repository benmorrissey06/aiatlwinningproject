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
}

export interface Listing {
  id: string
  title: string
  category: string
  price: string
  photo: string
  owner: CampusUser
  lastActive: string
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

// Mock seed data
const mockUsers: CampusUser[] = [
  { id: '1', name: 'Alex Chen', major: 'Computer Science', dorm: 'East Campus - Baker House', rating: 4.9, verified: true, trustScore: 95, pastTrades: 15, badges: ['Verified Student', 'Top Helper'] },
  { id: '2', name: 'Jordan Smith', major: 'Biology', dorm: 'West Campus - Random Hall', rating: 4.8, verified: true, trustScore: 92, pastTrades: 22, badges: ['Verified Student', 'Campus Leader'] },
  { id: '3', name: 'Taylor Johnson', major: 'Mathematics', dorm: 'North Campus - MacGregor House', rating: 4.7, verified: true, trustScore: 88, pastTrades: 10, badges: ['Verified Student'] },
  { id: '4', name: 'Sam Williams', major: 'Physics', dorm: 'Central Campus - Next House', rating: 4.6, verified: true, trustScore: 85, pastTrades: 8, badges: ['Verified Student'] },
  { id: '5', name: 'Morgan Davis', major: 'Engineering', dorm: 'East Campus - Simmons Hall', rating: 4.9, verified: true, trustScore: 93, pastTrades: 18, badges: ['Verified Student', 'Top Helper'] },
  { id: '6', name: 'Casey Brown', major: 'Chemistry', dorm: 'West Campus - New House', rating: 4.5, verified: false, trustScore: 82, pastTrades: 5, badges: [] },
  { id: '7', name: 'Riley Wilson', major: 'Economics', dorm: 'South Campus - Burton Conner', rating: 4.8, verified: true, trustScore: 90, pastTrades: 12, badges: ['Verified Student'] },
  { id: '8', name: 'Avery Martinez', major: 'Psychology', dorm: 'North Campus - Maseeh Hall', rating: 4.7, verified: true, trustScore: 87, pastTrades: 9, badges: ['Verified Student'] },
  { id: '9', name: 'Quinn Anderson', major: 'Mechanical Engineering', dorm: 'East Campus - McCormick Hall', rating: 4.4, verified: false, trustScore: 78, pastTrades: 3, badges: [] },
  { id: '10', name: 'Sage Thompson', major: 'Architecture', dorm: 'West Campus - East Campus', rating: 4.9, verified: true, trustScore: 94, pastTrades: 20, badges: ['Verified Student', 'Top Helper'] },
]

const mockListings: Listing[] = [
  { id: '1', title: 'Calculus Textbook - 3rd Edition', category: 'Textbooks', price: '$25', photo: '📚', owner: mockUsers[0], lastActive: '2024-01-15T10:30:00Z' },
  { id: '2', title: 'MacBook Pro Charger', category: 'Electronics', price: '$15', photo: '🔌', owner: mockUsers[1], lastActive: '2024-01-15T09:15:00Z' },
  { id: '3', title: 'Winter Jacket - Size M', category: 'Clothing', price: '$30', photo: '🧥', owner: mockUsers[2], lastActive: '2024-01-14T16:45:00Z' },
  { id: '4', title: 'Organic Chemistry Lab Manual', category: 'Textbooks', price: '$20', photo: '📖', owner: mockUsers[3], lastActive: '2024-01-14T14:20:00Z' },
  { id: '5', title: 'Wireless Mouse', category: 'Electronics', price: '$10', photo: '🖱️', owner: mockUsers[4], lastActive: '2024-01-14T11:00:00Z' },
  { id: '6', title: 'Running Shoes - Size 9', category: 'Clothing', price: '$35', photo: '👟', owner: mockUsers[5], lastActive: '2024-01-13T18:30:00Z' },
  { id: '7', title: 'Physics Textbook Bundle', category: 'Textbooks', price: '$40', photo: '📘', owner: mockUsers[6], lastActive: '2024-01-13T15:10:00Z' },
  { id: '8', title: 'USB-C Hub', category: 'Electronics', price: '$18', photo: '🔗', owner: mockUsers[7], lastActive: '2024-01-12T20:00:00Z' },
  { id: '9', title: 'Desk Lamp', category: 'Furniture', price: '$12', photo: '💡', owner: mockUsers[8], lastActive: '2024-01-12T13:25:00Z' },
  { id: '10', title: 'Coffee Maker', category: 'Electronics', price: '$25', photo: '☕', owner: mockUsers[9], lastActive: '2024-01-11T19:45:00Z' },
  { id: '11', title: 'Linear Algebra Textbook', category: 'Textbooks', price: '$28', photo: '📗', owner: mockUsers[0], lastActive: '2024-01-11T16:20:00Z' },
  { id: '12', title: 'Backpack - Black', category: 'Clothing', price: '$22', photo: '🎒', owner: mockUsers[1], lastActive: '2024-01-10T21:30:00Z' },
  { id: '13', title: 'Laptop Stand', category: 'Furniture', price: '$15', photo: '📱', owner: mockUsers[2], lastActive: '2024-01-10T14:15:00Z' },
  { id: '14', title: 'Statistics Textbook', category: 'Textbooks', price: '$32', photo: '📊', owner: mockUsers[3], lastActive: '2024-01-09T17:50:00Z' },
  { id: '15', title: 'Phone Charger Cable', category: 'Electronics', price: '$8', photo: '🔋', owner: mockUsers[4], lastActive: '2024-01-09T12:00:00Z' },
  { id: '16', title: 'Hoodie - Size L', category: 'Clothing', price: '$28', photo: '👕', owner: mockUsers[5], lastActive: '2024-01-08T19:25:00Z' },
  { id: '17', title: 'Study Desk', category: 'Furniture', price: '$45', photo: '🪑', owner: mockUsers[6], lastActive: '2024-01-08T10:40:00Z' },
  { id: '18', title: 'Biology Lab Kit', category: 'Textbooks', price: '$35', photo: '🧪', owner: mockUsers[7], lastActive: '2024-01-07T15:55:00Z' },
  { id: '19', title: 'Headphones', category: 'Electronics', price: '$30', photo: '🎧', owner: mockUsers[8], lastActive: '2024-01-07T11:20:00Z' },
  { id: '20', title: 'Jeans - Size 32', category: 'Clothing', price: '$24', photo: '👖', owner: mockUsers[9], lastActive: '2024-01-06T18:10:00Z' },
]

const mockFlags: Flag[] = [
  { id: '1', reason: 'Inappropriate language', snippet: 'User used offensive language in request', userId: '6', severity: 'medium', createdAt: '2024-01-15T08:00:00Z', status: 'pending' },
  { id: '2', reason: 'Suspicious behavior', snippet: 'Multiple requests from same user in short time', userId: '9', severity: 'high', createdAt: '2024-01-14T16:30:00Z', status: 'pending' },
  { id: '3', reason: 'Prohibited item', snippet: 'User attempted to list prohibited item', userId: '6', severity: 'critical', createdAt: '2024-01-14T10:15:00Z', status: 'resolved' },
  { id: '4', reason: 'Fake listing', snippet: 'Listing appears to be fraudulent', userId: '9', severity: 'high', createdAt: '2024-01-13T14:20:00Z', status: 'pending' },
  { id: '5', reason: 'Harassment', snippet: 'User reported for harassment', userId: '6', severity: 'critical', createdAt: '2024-01-12T09:45:00Z', status: 'pending' },
]

type ListingsFilters = {
  search?: string
  category?: string
  priceMax?: number
  verifiedOnly?: boolean
}

// Mock API functions
export const api = {
  createFlashRequest: async (data: any): Promise<{ success: boolean; id: string; data: any }> => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const requestId = Math.random().toString(36).substr(2, 9)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(`flashRequest_${requestId}`, JSON.stringify(data))
    }
    
    return {
      success: true,
      id: requestId,
      data,
    }
  },

  getSmartMatches: async (requestId: string): Promise<{ success: boolean; requestId: string; requestData: any; matches: Match[] }> => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    let requestData = null
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`flashRequest_${requestId}`)
      if (stored) {
        requestData = JSON.parse(stored)
      }
    }
    
    const matches: Match[] = mockUsers.slice(0, 6).map((user, index) => ({
      user,
      likelihood: 92 - index * 3,
      distanceMin: 0.3 + index * 0.1,
      sharedTraits: ['Same major', 'Nearby dorm', 'High rating'],
    }))
    
    return {
      success: true,
      requestId,
      requestData: requestData || {
        description: 'Sample request description',
        category: 'Textbooks',
        urgency: 1,
        location: 'Student Center',
        requireCheckIn: false,
      },
      matches,
    }
  },

  sendPings: async (requestId: string, matchIds: string[], broadcastType?: 'narrow' | 'wide'): Promise<{ success: boolean; pinged: number; broadcastType?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return {
      success: true,
      pinged: matchIds.length,
      broadcastType,
    }
  },

  searchListings: async (filters: ListingsFilters = {}) => {
    const { search = '', category, priceMax, verifiedOnly } = filters

    return mockListings.filter((listing) => {
      if (category && listing.category !== category) return false
      if (verifiedOnly && !listing.owner.verified) return false
      if (search && !listing.title.toLowerCase().includes(search.toLowerCase())) return false
      if (priceMax !== undefined) {
        const numericPrice = Number(listing.price.replace(/[^0-9.]/g, ''))
        if (!Number.isNaN(numericPrice) && numericPrice > priceMax) return false
      }
      return true
    })
  },

  getMessages: async (): Promise<{ success: boolean; threads: any[] }> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    return {
      success: true,
      threads: [
        {
          id: '1',
          userId: 'user1',
          userName: mockUsers[0].name,
          lastMessage: 'On my way!',
          lastMessageTime: '2 min ago',
          unread: 2,
          avatar: '👤',
        },
        {
          id: '2',
          userId: 'user2',
          userName: mockUsers[1].name,
          lastMessage: 'See you at the library lobby',
          lastMessageTime: '15 min ago',
          unread: 0,
          avatar: '👤',
        },
        {
          id: '3',
          userId: 'user3',
          userName: mockUsers[2].name,
          lastMessage: 'Perfect, thanks!',
          lastMessageTime: '1 hour ago',
          unread: 0,
          avatar: '👤',
        },
      ],
    }
  },

  getThreadMessages: async (threadId: string): Promise<{ success: boolean; messages: any[] }> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    const mockMessages: Record<string, any[]> = {
      '1': [
        { id: '1', senderId: 'user1', text: 'Hey! I have the textbook you need.', timestamp: '10:30 AM', isOwn: false },
        { id: '2', senderId: 'me', text: 'Great! Where can we meet?', timestamp: '10:32 AM', isOwn: true },
        { id: '3', senderId: 'user1', text: 'Student Center work?', timestamp: '10:33 AM', isOwn: false },
        { id: '4', senderId: 'me', text: 'Perfect, see you there!', timestamp: '10:34 AM', isOwn: true },
        { id: '5', senderId: 'user1', text: 'On my way!', timestamp: '10:40 AM', isOwn: false },
      ],
      '2': [
        { id: '1', senderId: 'user2', text: 'I can help with that charger', timestamp: '9:15 AM', isOwn: false },
        { id: '2', senderId: 'me', text: 'Awesome! When are you available?', timestamp: '9:20 AM', isOwn: true },
        { id: '3', senderId: 'user2', text: 'See you at the library lobby', timestamp: '9:25 AM', isOwn: false },
      ],
      '3': [
        { id: '1', senderId: 'user3', text: 'Thanks for the jacket!', timestamp: '8:00 AM', isOwn: false },
        { id: '2', senderId: 'me', text: 'Perfect, thanks!', timestamp: '8:05 AM', isOwn: true },
      ],
    }
    
    return {
      success: true,
      messages: mockMessages[threadId] || [],
    }
  },

  sendMessage: async (
     threadId: string,
     text: string,
   ): Promise<{ success: boolean; messageId: string }> => {
    void threadId
    void text
    await new Promise((resolve) => setTimeout(resolve, 200))
    return { success: true, messageId: Math.random().toString(36).substr(2, 9) }
  },

  getProfile: async (userId?: string): Promise<{ success: boolean; user: CampusUser }> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return {
      success: true,
      user: userId ? mockUsers.find(u => u.id === userId) || mockUsers[0] : mockUsers[0],
    }
  },

  updateProfile: async (userId: string, data: Partial<CampusUser>): Promise<{ success: boolean }> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { success: true }
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
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      success: true,
      flags: mockFlags,
    }
  },

  resolveFlag: async (flagId: string, action: 'resolve' | 'dismiss'): Promise<{ success: boolean }> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const flag = mockFlags.find(f => f.id === flagId)
    if (flag) {
      flag.status = action === 'resolve' ? 'resolved' : 'dismissed'
    }
    return { success: true }
  },

  // Legacy aliases for backward compatibility
  getListings: async (filters: any) => api.searchListings(filters),
  pingMatches: async (requestId: string, matchIds: string[], broadcastType?: 'narrow' | 'wide') => 
    api.sendPings(requestId, matchIds, broadcastType),
  submitRating: async (threadId: string, rating: number, comment: string): Promise<{ success: boolean }> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { success: true }
  },
}
