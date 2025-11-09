import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import { 
  Send, 
  MessageSquare, 
  Shield, 
  CheckCircle2, 
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { getOrCreateDM } from '@/services/chat'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Thread {
  id: string
  userId: string
  userName: string
  lastMessage: string
  lastMessageTime: string
  unread: number
  avatar: string
}

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: string
  isOwn: boolean
}

const smartReplies = [
  "On my way",
  "At the library lobby",
  "Running 5 min late",
  "Here now",
  "See you there",
  "Thanks!",
]

export function MessagesChatPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  // Restore threads, selectedThread, and selectedUserId from sessionStorage on mount
  const [threads, setThreads] = useState<Thread[]>(() => {
    try {
      const stored = sessionStorage.getItem('messages_threads')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`[MessagesChatPage] Restored ${parsed.length} threads from sessionStorage`)
          return parsed
        }
      }
    } catch (e) {
      console.warn('[MessagesChatPage] Failed to restore threads from sessionStorage:', e)
    }
    return []
  })
  
  const [selectedThread, setSelectedThread] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('messages_selectedThread') || null
    } catch (e) {
      return null
    }
  })
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('messages_selectedUserId') || null
    } catch (e) {
      return null
    }
  })
  const [messages, setMessages] = useState<Message[]>([])
  
  // Sync messages to sessionStorage whenever they change AND we have a selected thread
  useEffect(() => {
    if (selectedThread) {
      try {
        if (messages.length > 0) {
          sessionStorage.setItem(`messages_${selectedThread}`, JSON.stringify(messages))
          console.log(`[MessagesChatPage] Saved ${messages.length} messages to sessionStorage for thread ${selectedThread}`)
        } else {
          // Clear sessionStorage if messages are empty
          sessionStorage.removeItem(`messages_${selectedThread}`)
        }
      } catch (e) {
        console.warn('[MessagesChatPage] Failed to save messages to sessionStorage:', e)
      }
    }
  }, [messages, selectedThread])
  
  // Restore messages from sessionStorage when thread is selected
  useEffect(() => {
    if (selectedThread) {
      try {
        const stored = sessionStorage.getItem(`messages_${selectedThread}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.length > 0 && Array.isArray(parsed)) {
            console.log(`[MessagesChatPage] Restored ${parsed.length} messages from sessionStorage for thread ${selectedThread}`)
            // Only restore if we don't already have messages (avoid overwriting fresh data)
            setMessages(prevMessages => {
              if (prevMessages.length === 0) {
                return parsed
              }
              // Merge: prefer existing messages but add any from storage that aren't present
              const existingIds = new Set(prevMessages.map(m => m.id))
              const newMessages = parsed.filter((m: Message) => !existingIds.has(m.id))
              return [...prevMessages, ...newMessages]
            })
          }
        }
      } catch (e) {
        console.warn('[MessagesChatPage] Failed to restore messages from sessionStorage:', e)
      }
    } else {
      // Clear messages when no thread is selected
      setMessages([])
    }
  }, [selectedThread])
  const [newMessage, setNewMessage] = useState('')
  const [ratingModalOpen, setRatingModalOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [loadingThread, setLoadingThread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const threadsLoadedRef = useRef(false)
  const [currentSellerName, setCurrentSellerName] = useState<string | null>(null)

  // Get thread ID from URL params or navigation state
  const threadIdFromUrl = searchParams.get('thread')
  const navigationState = location.state as { openThread?: string; userId?: string; displayName?: string } | null
  const threadIdFromState = navigationState?.openThread
  const userIdFromState = navigationState?.userId
  const displayNameFromState = navigationState?.displayName

  // Define loadThreads function FIRST
  const loadThreads = useCallback(async () => {
    try {
      console.log('[loadThreads] Loading threads from backend...')
      const result = await api.getMessages()
      const loadedThreads = result.threads || []
      console.log(`[loadThreads] ✅ Loaded ${loadedThreads.length} threads from backend`)
      
      // Merge with existing threads from sessionStorage to preserve any that might not be in backend yet
      setThreads(prevThreads => {
        // Create a map of existing threads by ID for quick lookup
        const existingThreadsMap = new Map(prevThreads.map(t => [t.id, t]))
        
        // Add or update threads from backend
        loadedThreads.forEach(thread => {
          existingThreadsMap.set(thread.id, thread)
        })
        
        // Convert back to array and preserve order (backend threads first, then existing)
        const mergedThreads = Array.from(existingThreadsMap.values())
        
        // Sort by updated_at or lastMessageTime if available, newest first
        mergedThreads.sort((a, b) => {
          const timeA = a.lastMessageTime || ''
          const timeB = b.lastMessageTime || ''
          return timeB.localeCompare(timeA)
        })
        
        console.log(`[loadThreads] Merged ${prevThreads.length} existing + ${loadedThreads.length} backend = ${mergedThreads.length} total threads`)
        
        // Save to sessionStorage
        try {
          sessionStorage.setItem('messages_threads', JSON.stringify(mergedThreads))
          console.log(`[loadThreads] Saved ${mergedThreads.length} threads to sessionStorage`)
        } catch (e) {
          console.warn('[loadThreads] Failed to save threads to sessionStorage:', e)
        }
        
        return mergedThreads
      })
      
      threadsLoadedRef.current = true
    } catch (error) {
      console.error('[loadThreads] ❌ Failed to load threads:', error)
      // Don't clear existing threads on error - keep what we have in sessionStorage
      threadsLoadedRef.current = true
    }
  }, [])

  // Define loadMessages function SECOND (before any useEffect uses it)
  const loadMessages = useCallback(async (threadId: string, expectedUserId: string | null, preserveExisting: boolean = false) => {
    if (!threadId) {
      console.warn('[loadMessages] No threadId provided')
      if (!preserveExisting) {
        setMessages([])
      }
      return
    }
    
    console.log(`[loadMessages] 📥 Loading messages for threadId: ${threadId}, expectedUserId: ${expectedUserId}, preserveExisting: ${preserveExisting}`)
    
    try {
      // Load messages directly from backend
      const result = await api.getThreadMessages(threadId)
      const loadedMessages = result.messages || []
      console.log(`[loadMessages] ✅ Loaded ${loadedMessages.length} messages from backend`)
      
      if (loadedMessages.length > 0) {
        console.log(`[loadMessages] First message:`, loadedMessages[0])
        console.log(`[loadMessages] Last message:`, loadedMessages[loadedMessages.length - 1])
        
        // CRITICAL: Use functional update to merge with existing optimistic messages
        setMessages(prevMessages => {
          // Get any optimistic messages that aren't in the loaded messages
          // Match by text content (exact or trimmed)
          const optimisticMessages = prevMessages.filter(m => {
            if (!m.id.startsWith('temp-')) return false
            // Check if this optimistic message matches any loaded message
            const hasMatch = loadedMessages.some(loaded => {
              // Exact text match
              if (loaded.text === m.text) return true
              // Trimmed text match (handle whitespace differences)
              if (loaded.text.trim() === m.text.trim()) return true
              return false
            })
            return !hasMatch // Keep optimistic messages that don't have a match
          })
          
          // Combine: backend messages first, then optimistic messages
          // This ensures backend messages (with real IDs) are preferred
          const allMessages = [...loadedMessages]
          
          // Add optimistic messages that don't match
          optimisticMessages.forEach(optMsg => {
            // Only add if not already in the list
            if (!allMessages.some(m => m.text.trim() === optMsg.text.trim())) {
              allMessages.push(optMsg)
            }
          })
          
          // Sort by a stable order (use index in array as fallback for messages without timestamp)
          const sortedMessages = allMessages.sort((a, b) => {
            // Try to use timestamp if available
            if (a.timestamp && b.timestamp) {
              return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            }
            // If no timestamp, maintain relative order (backend messages first)
            return 0
          })
          
          console.log(`[loadMessages] Merged ${loadedMessages.length} loaded + ${optimisticMessages.length} optimistic = ${sortedMessages.length} total messages`)
          
          return sortedMessages
        })
      } else {
        // If no messages loaded from backend, only clear if not preserving existing
        if (!preserveExisting) {
          console.warn(`[loadMessages] ⚠️ No messages loaded from backend`)
          // Use functional update to keep optimistic messages
          setMessages(prevMessages => {
            // Keep optimistic messages even if backend returned nothing
            const optimisticMessages = prevMessages.filter(m => m.id.startsWith('temp-'))
            if (optimisticMessages.length > 0) {
              console.log(`[loadMessages] Keeping ${optimisticMessages.length} optimistic messages`)
              return optimisticMessages
            }
            return []
          })
        } else {
          console.log(`[loadMessages] ⚠️ No messages loaded, but preserving existing messages`)
          // Keep existing messages if preserveExisting is true
        }
      }
      
      // Update selectedUserId if provided
      if (expectedUserId) {
        setSelectedUserId(expectedUserId)
      }
    } catch (error) {
      console.error('[loadMessages] ❌ Failed to load messages:', error)
      // CRITICAL: NEVER clear messages on error - always preserve what we have
      // This ensures messages stay visible even if backend is temporarily unavailable
      console.log('[loadMessages] ⚠️ Error loading messages, preserving ALL existing messages')
      // Don't modify messages state at all - keep everything as-is
      // The existing messages (both optimistic and real) should remain visible
    }
  }, [])

  const handleCreateThreadForUser = useCallback(async (userId: string, expectedThreadId?: string) => {
    if (!userId) {
      console.error(`[handleCreateThreadForUser] ❌ No userId provided!`)
      toast.error('Unable to create message thread: No user ID provided')
      return
    }
    
    if (loadingThread) {
      console.log(`[handleCreateThreadForUser] ⏳ Already loading thread, skipping`)
      return
    }

    console.log(`[handleCreateThreadForUser] 🚀 Creating/finding thread for seller userId: ${userId}`)
    setLoadingThread(true)
    
    try {
      // Step 1: Get or create thread from backend
      const thread = await getOrCreateDM(userId)
      console.log(`[handleCreateThreadForUser] ✅ Backend returned thread:`, thread)
      
      // Step 2: Reload threads list to get the latest data
       const result = await api.getMessages()
      console.log(`[handleCreateThreadForUser] 📋 Reloaded threads:`, result.threads.map(t => ({ 
        id: t.id, 
        userId: t.userId, 
        userName: t.userName 
      })))
      
       // Merge with existing threads (from sessionStorage) instead of replacing
      setThreads(prevThreads => {
        // Create a map of existing threads by ID
        const threadsMap = new Map(prevThreads.map(t => [t.id, t]))
        
        // Update or add threads from backend
        result.threads.forEach(thread => {
          threadsMap.set(thread.id, thread)
        })
        
        // Convert back to array and sort by lastMessageTime (newest first)
        const mergedThreads = Array.from(threadsMap.values()).sort((a, b) => {
          const timeA = a.lastMessageTime || ''
          const timeB = b.lastMessageTime || ''
          return timeB.localeCompare(timeA)
        })
        
        // Save to sessionStorage
        try {
          sessionStorage.setItem('messages_threads', JSON.stringify(mergedThreads))
          console.log(`[handleCreateThreadForUser] Saved ${mergedThreads.length} threads to sessionStorage`)
        } catch (e) {
          console.warn('[handleCreateThreadForUser] Failed to save threads to sessionStorage:', e)
        }
        
        return mergedThreads
      })
      threadsLoadedRef.current = true
      
      // Now find the thread in the updated state and select it
      // First check if thread exists in backend result
      let foundThread = result.threads.find(t => t.userId === userId || t.id === thread.threadId)
      
      if (foundThread) {
        // Thread found in backend - select it
        console.log(`[handleCreateThreadForUser] ✅ Found thread in backend:`, foundThread.id)
        setSelectedThread(foundThread.id)
        setSelectedUserId(userId)
        setSearchParams({ thread: foundThread.id }, { replace: true })
      } else {
        // Thread not in backend yet - create temporary thread and add it
        console.log(`[handleCreateThreadForUser] ⚠️ Thread not in backend, creating temporary thread`)
        
        // Fetch seller name from API
        let userName = displayNameFromState || 'User'
        try {
          const userProfile = await api.getProfile(userId)
          if (userProfile?.user?.name) {
            userName = userProfile.user.name
            console.log(`[handleCreateThreadForUser] ✅ Fetched seller name: ${userName}`)
       }
     } catch (error) {
          console.warn(`[handleCreateThreadForUser] ⚠️ Could not fetch user name, using: ${userName}`, error)
        }
        
        // Create temporary thread with correct userId
        const tempThread: Thread = {
          id: thread.threadId,
          userId: userId,
          userName: userName,
          lastMessage: 'New conversation',
          lastMessageTime: 'Now',
          unread: 0,
          avatar: '👤',
        }
        
        console.log(`[handleCreateThreadForUser] ✅ Created temp thread:`, tempThread)
        
        // Add thread to list (merge with existing)
        setThreads(prevThreads => {
          // Check if thread already exists
          if (prevThreads.some(t => t.id === thread.threadId)) {
            console.log(`[handleCreateThreadForUser] Thread already exists, updating it`)
            return prevThreads.map(t => 
              t.id === thread.threadId 
                ? { ...t, userId, userName, lastMessage: 'New conversation', lastMessageTime: 'Now' }
                : t
            )
          }
          
          // Add new thread and sort
          const updatedThreads = [...prevThreads, tempThread].sort((a, b) => {
            const timeA = a.lastMessageTime || ''
            const timeB = b.lastMessageTime || ''
            return timeB.localeCompare(timeA)
          })
          
          // Save to sessionStorage
          try {
            sessionStorage.setItem('messages_threads', JSON.stringify(updatedThreads))
            console.log(`[handleCreateThreadForUser] Saved ${updatedThreads.length} threads to sessionStorage`)
          } catch (e) {
            console.warn('[handleCreateThreadForUser] Failed to save threads to sessionStorage:', e)
          }
          
          return updatedThreads
        })
        
        setSelectedThread(thread.threadId)
        setSelectedUserId(userId)
        setSearchParams({ thread: thread.threadId }, { replace: true })
      }
      
      // Clear navigation state
      if (navigationState) {
        navigate(location.pathname + location.search, { replace: true, state: null })
      }
      
      setLoadingThread(false)
    } catch (error) {
      console.error('[handleCreateThreadForUser] ❌ Failed to create thread:', error)
      toast.error(`Failed to create message thread with seller`)
      setLoadingThread(false)
    }
  }, [loadingThread, setSearchParams, navigationState, displayNameFromState, navigate, location.pathname, location.search])

  // Save threads to sessionStorage whenever they change
  useEffect(() => {
    if (threads.length > 0) {
      try {
        sessionStorage.setItem('messages_threads', JSON.stringify(threads))
        console.log(`[MessagesChatPage] Saved ${threads.length} threads to sessionStorage`)
      } catch (e) {
        console.warn('[MessagesChatPage] Failed to save threads to sessionStorage:', e)
      }
    }
  }, [threads])
  
  // Save selectedThread to sessionStorage whenever it changes
  useEffect(() => {
    if (selectedThread) {
      try {
        sessionStorage.setItem('messages_selectedThread', selectedThread)
        console.log(`[MessagesChatPage] Saved selectedThread to sessionStorage: ${selectedThread}`)
      } catch (e) {
        console.warn('[MessagesChatPage] Failed to save selectedThread to sessionStorage:', e)
      }
    } else {
      sessionStorage.removeItem('messages_selectedThread')
    }
  }, [selectedThread])
  
  // Save selectedUserId to sessionStorage whenever it changes
  useEffect(() => {
    if (selectedUserId) {
      try {
        sessionStorage.setItem('messages_selectedUserId', selectedUserId)
        console.log(`[MessagesChatPage] Saved selectedUserId to sessionStorage: ${selectedUserId}`)
      } catch (e) {
        console.warn('[MessagesChatPage] Failed to save selectedUserId to sessionStorage:', e)
      }
    } else {
      sessionStorage.removeItem('messages_selectedUserId')
    }
  }, [selectedUserId])
  
  // Load threads on mount and when navigating to this page
  // Threads are already restored from sessionStorage in the useState initializer
  // This just loads from backend to merge/update with latest data
  useEffect(() => {
    console.log('[MessagesChatPage] Component mounted or location changed, loading threads from backend...')
    
    // Mark as loaded if we already have threads from sessionStorage
    if (threads.length > 0) {
      threadsLoadedRef.current = true
      console.log(`[MessagesChatPage] Already have ${threads.length} threads from sessionStorage, marking as loaded`)
    }
    
    // Load from backend to get the latest data (this will merge with existing threads)
    loadThreads()
  }, [loadThreads, location.pathname])
  
  // CRITICAL: Reload messages from MongoDB when returning to this page with a selected thread
  // This ensures messages persist when navigating away and back
  useEffect(() => {
    // Only reload messages if:
    // 1. Threads are loaded (checked via threads.length > 0 or threadsLoadedRef)
    // 2. We have a selected thread
    // 3. We're on the messages page
    if (threadsLoadedRef.current && selectedThread && location.pathname === '/messages') {
      console.log('[MessagesChatPage] Reloading messages from MongoDB to ensure persistence...')
      
      // Reload from MongoDB to get the latest messages
      // Use preserveExisting=true to keep existing messages if backend fails
      // Messages will be restored from sessionStorage by the useEffect above if needed
      loadMessages(selectedThread, selectedUserId, true).catch(err => {
        console.error('[MessagesChatPage] Failed to reload messages from MongoDB:', err)
        // On error, messages should already be in state from sessionStorage or previous load
        // Don't clear them - they'll be preserved
      })
    }
  }, [location.pathname, selectedThread, selectedUserId, loadMessages, threads.length]) // Use threads.length to detect when threads are loaded
  
  // Also reload threads when window regains focus (user comes back to tab)
  // BUT preserve messages - only reload if we need to update them
  useEffect(() => {
    const handleFocus = () => {
      if (location.pathname === '/messages') {
        console.log('[MessagesChatPage] Window focused on messages page, reloading threads...')
        // Save current selection before reloading
        const currentSelected = selectedThread
        const currentSelectedUserId = selectedUserId
        
        // Reload threads to get updated list
        loadThreads().then(() => {
          // Restore selection after reload
          if (currentSelected) {
            setSelectedThread(currentSelected)
            setSelectedUserId(currentSelectedUserId)
            
            // CRITICAL: Only reload messages if we have a selected thread
            // Use preserveExisting=true to keep current messages if backend fails
            // This ensures messages don't disappear when coming back to the tab
            if (currentSelected) {
              console.log('[MessagesChatPage] Reloading messages on focus to get latest from backend...')
              loadMessages(currentSelected, currentSelectedUserId, true).catch(err => {
                console.error('[MessagesChatPage] Failed to reload messages on focus:', err)
                // Error is handled in loadMessages with preserveExisting=true
              })
            }
          }
        })
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [loadThreads, location.pathname, selectedThread, selectedUserId, loadMessages])

  // Handle thread selection from URL params or navigation state
  useEffect(() => {
    if (!threadsLoadedRef.current) {
      console.log('[MessagesChatPage] ⏳ Threads not loaded yet, waiting...')
      return
    }

    const targetThreadId = threadIdFromUrl || threadIdFromState
    const targetUserId = userIdFromState

    console.log('[MessagesChatPage] 🔍 Thread selection effect:', { 
      targetThreadId, 
      targetUserId, 
      displayName: displayNameFromState,
      threadsCount: threads.length, 
      selectedThread,
      selectedUserId,
      threads: threads.map(t => ({ id: t.id, userId: t.userId, userName: t.userName }))
    })

    // PRIORITY 1: If we have a userId from navigation state, use it (highest priority)
    // This is the seller the user clicked on - we MUST find or create a thread for this user
    if (targetUserId) {
      console.log(`[MessagesChatPage] 🎯 PRIORITY 1: Processing seller userId from navigation: ${targetUserId} (${displayNameFromState || 'unknown'})`)
      
      // First, try to find existing thread by EXACT userId match
      const threadByUserId = threads.find(t => {
        const matches = t.userId === targetUserId
        if (matches) {
          console.log(`[MessagesChatPage] ✅ Found thread ${t.id} for userId ${targetUserId}`)
        }
        return matches
      })
      
      if (threadByUserId) {
        // Thread exists - select it
        console.log(`[MessagesChatPage] ✅ FOUND existing thread:`, {
          threadId: threadByUserId.id,
          userId: threadByUserId.userId,
          userName: threadByUserId.userName
        })
        
        if (selectedThread !== threadByUserId.id || selectedUserId !== targetUserId) {
          console.log(`[MessagesChatPage] 📌 Selecting existing thread: ${threadByUserId.id}`)
          // CRITICAL: Set both thread and userId to prevent seller from disappearing
          setSelectedThread(threadByUserId.id)
          setSelectedUserId(targetUserId)
          setSearchParams({ thread: threadByUserId.id }, { replace: true })
          
          // Clear navigation state after processing
          if (navigationState) {
            navigate(location.pathname + location.search, { replace: true, state: null })
          }
        }
        return
      }
      
      // Thread doesn't exist - create it NOW
      console.log(`[MessagesChatPage] 🆕 Thread NOT found for userId ${targetUserId}, creating new thread...`)
      if (!loadingThread) {
        handleCreateThreadForUser(targetUserId, targetThreadId || undefined)
      } else {
        console.log(`[MessagesChatPage] ⏳ Already creating thread, waiting...`)
      }
      return
    }

    // PRIORITY 2: If we have a threadId but no userId, try to find it
    if (targetThreadId && !targetUserId) {
      console.log(`[MessagesChatPage] PRIORITY 2: Processing threadId from URL/state: ${targetThreadId}`)
      const thread = threads.find(t => t.id === targetThreadId)
      if (thread) {
        console.log(`[MessagesChatPage] Found thread by ID:`, thread)
        if (selectedThread !== thread.id) {
          setSelectedThread(thread.id)
          setSelectedUserId(thread.userId)
          setSearchParams({ thread: thread.id }, { replace: true })
          // Clear navigation state after processing
          if (location.state) {
            navigate(location.pathname + location.search, { replace: true, state: {} })
          }
        }
        return
      } else {
        console.warn(`[MessagesChatPage] Thread ${targetThreadId} not found in threads list`)
        // Thread ID provided but not found - clear it from URL
        setSearchParams({}, { replace: true })
      }
    }

    // PRIORITY 3: No specific thread requested - DO NOT default to first thread
    // Only select first thread if user manually navigated to /messages without any state
    if (!selectedThread && threads.length > 0 && !targetUserId && !targetThreadId) {
      console.log('[MessagesChatPage] PRIORITY 3: No specific thread requested, but NOT selecting first thread to avoid showing wrong seller')
      // DON'T auto-select - let user choose
    }
  }, [threads, threadIdFromUrl, threadIdFromState, userIdFromState, selectedThread, selectedUserId, setSearchParams, handleCreateThreadForUser, loadingThread, navigationState, navigate, displayNameFromState])

  // Load messages when thread changes
  // CRITICAL: This is the main effect that loads messages when a thread is selected
  useEffect(() => {
    if (!selectedThread) {
      console.log('[MessagesChatPage] No thread selected, clearing messages')
      setMessages([])
      return
    }

    console.log(`[MessagesChatPage] 🔄 Thread selected: ${selectedThread}, userId: ${selectedUserId}`)
    
    // Load messages from backend - this will merge with any optimistic messages
    // Use preserveExisting=false to replace with backend data, but loadMessages will keep optimistic messages
    loadMessages(selectedThread, selectedUserId, false)
  }, [selectedThread, selectedUserId, loadMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])


  const handleThreadSelect = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId)
    if (!thread) {
      console.warn(`Thread ${threadId} not found`)
      return
    }

    // Clear messages immediately when switching threads
    setMessages([])
    setSelectedThread(threadId)
    setSelectedUserId(thread.userId)
    
    // Update URL to reflect selected thread
    setSearchParams({ thread: threadId }, { replace: true })
    
    // Clear navigation state if present
    if (location.state) {
      navigate(location.pathname + location.search, { replace: true, state: {} })
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) {
      console.warn('[handleSendMessage] Cannot send: no message or thread selected')
      return
    }

    const messageText = newMessage.trim()
    const currentThreadId = selectedThread
    const currentUserId = selectedUserId
    
    // Get current user ID from localStorage for optimistic update
    const currentUser = localStorage.getItem('userId') || 'current_user'
    
    // Optimistically add message to UI immediately (before backend confirms)
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUser,
      text: messageText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      }
    
    // Add optimistic message to current messages
    setMessages(prevMessages => [...prevMessages, optimisticMessage])
    
    // Clear input immediately for better UX
      setNewMessage('')

    try {
      console.log(`[handleSendMessage] 📤 Sending message: "${messageText}" to thread: ${currentThreadId}`)
      
      // Send message to backend (saves to MongoDB)
      const result = await api.sendMessage(currentThreadId, messageText)
      console.log(`[handleSendMessage] ✅ Message sent successfully:`, result)
      
      // Verify the backend received our message text
      if (result.text && result.text !== messageText) {
        console.warn(`[handleSendMessage] ⚠️ Message text mismatch! Sent: "${messageText}", Received: "${result.text}"`)
      }
      
      // Wait a bit for MongoDB to persist the message
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Reload messages from backend to get the persisted message
      // Use preserveExisting=true to ensure we don't clear existing messages
      console.log(`[handleSendMessage] Reloading messages for thread: ${currentThreadId}`)
      
      try {
        await loadMessages(currentThreadId, currentUserId, true) // PRESERVE existing messages
        console.log(`[handleSendMessage] ✅ First reload completed`)
      } catch (err) {
        console.error(`[handleSendMessage] First reload failed (non-critical):`, err)
        // Don't throw - message was already sent successfully
      }
      
      // Do a second reload after a longer delay to ensure MongoDB has persisted
      // This ensures we get the real message from the database
      setTimeout(async () => {
        console.log(`[handleSendMessage] Second reload after 2 seconds to ensure message is persisted...`)
        try {
          await loadMessages(currentThreadId, currentUserId, true) // PRESERVE existing messages
          console.log(`[handleSendMessage] ✅ Second reload completed`)
        } catch (err) {
          console.error(`[handleSendMessage] Second reload failed (non-critical):`, err)
          // Don't throw - message was already sent successfully
        }
      }, 2000)
      
      // Reload threads to update last message preview (but PRESERVE selected thread and userId)
      console.log(`[handleSendMessage] Reloading threads to update preview`)
      const threadsResult = await api.getMessages()
      const updatedThreads = threadsResult.threads || []
      
      // CRITICAL: Preserve selected thread and userId - NEVER clear them
      // Update threads list but keep current selection
      setThreads(prevThreads => {
        // Create a map of existing threads for quick lookup
        const threadsMap = new Map(prevThreads.map(t => [t.id, t]))
        
        // Update or add threads from backend
        updatedThreads.forEach(thread => {
          threadsMap.set(thread.id, thread)
        })
        
        // Ensure current thread is in the list with updated last message
        const currentThreadInMap = threadsMap.get(currentThreadId)
        if (currentThreadInMap) {
          // Update the last message for the current thread
          threadsMap.set(currentThreadId, {
            ...currentThreadInMap,
            lastMessage: messageText,
            lastMessageTime: 'Just now'
          })
        } else {
          // If current thread is not in the list, find it from previous threads and add it
          const prevThread = prevThreads.find(t => t.id === currentThreadId)
          if (prevThread) {
            threadsMap.set(currentThreadId, {
              ...prevThread,
              lastMessage: messageText,
              lastMessageTime: 'Just now'
            })
          }
        }
        
        // Convert back to array and sort by lastMessageTime (newest first)
        const mergedThreads = Array.from(threadsMap.values()).sort((a, b) => {
          const timeA = a.lastMessageTime || ''
          const timeB = b.lastMessageTime || ''
          return timeB.localeCompare(timeA)
        })
        
        // Save to sessionStorage immediately
        try {
          sessionStorage.setItem('messages_threads', JSON.stringify(mergedThreads))
          console.log(`[handleSendMessage] Saved ${mergedThreads.length} threads to sessionStorage`)
        } catch (e) {
          console.warn('[handleSendMessage] Failed to save threads to sessionStorage:', e)
        }
        
        return mergedThreads
      })
      
      // CRITICAL: Always preserve selectedThread and selectedUserId - never clear them
      // Even if thread is not in the list, keep the selection so seller doesn't disappear
      if (!selectedThread || selectedThread !== currentThreadId) {
        setSelectedThread(currentThreadId)
      }
      if (!selectedUserId || selectedUserId !== currentUserId) {
        setSelectedUserId(currentUserId)
      }
      
      toast.success('Message sent', {
        description: 'Your message has been delivered',
      })
    } catch (error) {
      console.error('[handleSendMessage] ❌ Failed to send message:', error)
      
      // Extract error message for better debugging - handle all error types
      let errorMessage = 'Unknown error'
      let errorDetail: any = null
      
      // First, try to get error from Error object
      if (error instanceof Error) {
        errorMessage = error.message || 'Unknown error'
        // Check if error has additional properties
        errorDetail = (error as any).detail || (error as any).response || error
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object') {
        errorDetail = error
        // Try multiple ways to extract error message
        if ('detail' in error) {
          const detail = error.detail
          if (typeof detail === 'string') {
            errorMessage = detail
          } else if (typeof detail === 'object' && detail !== null) {
            // Handle nested detail object
            if ('message' in detail) {
              errorMessage = String(detail.message)
            } else if ('error' in detail) {
              errorMessage = String(detail.error)
            } else {
              try {
                errorMessage = JSON.stringify(detail)
              } catch {
                errorMessage = 'Error occurred (see console for details)'
              }
            }
          } else {
            errorMessage = String(detail)
          }
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message
        } else if ('error' in error) {
          const err = error.error
          if (typeof err === 'string') {
            errorMessage = err
          } else if (typeof err === 'object' && err !== null) {
            if ('message' in err) {
              errorMessage = String(err.message)
            } else {
              try {
                errorMessage = JSON.stringify(err)
              } catch {
                errorMessage = 'Error occurred (see console for details)'
              }
            }
          } else {
            errorMessage = String(err)
          }
        } else if ('response' in error) {
          // Handle axios-like error response
          const response = (error as any).response
          if (response && response.data) {
            if (typeof response.data === 'string') {
              errorMessage = response.data
            } else if (response.data.detail) {
              errorMessage = String(response.data.detail)
            } else if (response.data.message) {
              errorMessage = String(response.data.message)
            } else {
              try {
                errorMessage = JSON.stringify(response.data)
              } catch {
                errorMessage = `HTTP ${response.status || 'Unknown'} error`
              }
            }
          } else {
            errorMessage = `HTTP ${response?.status || 'Unknown'} error`
          }
        } else {
          // Last resort: try to stringify, but handle circular references
          try {
            const stringified = JSON.stringify(error, null, 2)
            // If it's a very long string, truncate it
            if (stringified.length > 200) {
              errorMessage = stringified.substring(0, 200) + '...'
            } else {
              errorMessage = stringified
            }
          } catch (e) {
            // If stringify fails, try toString
            try {
              errorMessage = error.toString()
            } catch {
              errorMessage = 'Error occurred (unable to parse error details)'
            }
          }
        }
      } else {
        errorMessage = String(error)
      }
      
      // Clean up error message - remove common prefixes that aren't helpful
      errorMessage = errorMessage.replace(/^Error: /, '').replace(/^API request failed.*?: /, '')
      
      console.error('[handleSendMessage] Error details:', errorMessage)
      console.error('[handleSendMessage] Full error object:', errorDetail || error)
      
      // DON'T remove the optimistic message immediately - keep it visible
      // The user should see their message even if sending failed temporarily
      // Only remove it if we're certain it won't be sent
      
      // Restore message text in input so user can retry
      setNewMessage(messageText)
      
      // Show more detailed error message with retry option
      const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')
      const isThreadNotFound = errorMessage.includes('Thread not found') || errorMessage.includes('404')
      
      // Determine if this is actually a success (message sent but error in response parsing)
      // Check if error message suggests the message was actually sent
      const isActuallySuccess = errorMessage.includes('success') && errorMessage.includes('true')
      
      if (isActuallySuccess) {
        // Message was actually sent successfully, just error in response parsing
        console.log('[handleSendMessage] Message sent successfully (error was in response parsing)')
        toast.success('Message sent', {
          description: 'Your message has been delivered',
        })
        // Reload messages to get the persisted message
        setTimeout(async () => {
          try {
            await loadMessages(currentThreadId, currentUserId, true)
          } catch (err) {
            console.error('[handleSendMessage] Failed to reload after success:', err)
          }
        }, 500)
      } else {
        // Real error - show error message
        // Ensure errorMessage is a clean string (not "[object Object]")
        let displayMessage = errorMessage
        if (displayMessage.includes('[object Object]') || displayMessage === 'object Object') {
          // If we still got [object Object], try to extract from errorDetail
          if (errorDetail) {
            try {
              if (typeof errorDetail === 'object') {
                if ('detail' in errorDetail && typeof errorDetail.detail === 'string') {
                  displayMessage = errorDetail.detail
                } else if ('message' in errorDetail && typeof errorDetail.message === 'string') {
                  displayMessage = errorDetail.message
                } else {
                  displayMessage = JSON.stringify(errorDetail, null, 2).substring(0, 150)
                }
              } else {
                displayMessage = String(errorDetail)
              }
            } catch {
              displayMessage = 'Failed to send message. Please try again.'
            }
          } else {
            displayMessage = 'Failed to send message. Please try again.'
          }
        }
        
        // Clean up the display message
        displayMessage = displayMessage.trim()
        if (displayMessage.length > 150) {
          displayMessage = displayMessage.substring(0, 150) + '...'
        }
        
      toast.error('Failed to send message', {
          description: isThreadNotFound
            ? 'Conversation not found. Please refresh and try again.'
            : isNetworkError
            ? 'Network error. Check your connection and try again.'
            : displayMessage.includes('participant')
            ? 'You are not a participant in this conversation.'
            : displayMessage.includes('400') || displayMessage.includes('Bad Request')
            ? 'Invalid message. Please check your message and try again.'
            : displayMessage.includes('500') || displayMessage.includes('Internal Server Error')
            ? 'Server error. Please try again later.'
            : displayMessage || 'Please try again',
          duration: 5000, // Show error longer
        })
        
        // Keep the optimistic message visible - don't remove it automatically
        // The user can see their message and decide to retry
        // Only remove if they explicitly send a new message or refresh
        console.log('[handleSendMessage] Keeping optimistic message visible for user to see')
      }
    }
  }

  const handleSmartReply = (reply: string) => {
    setNewMessage(reply)
    toast.info('Quick reply selected', {
      description: 'You can edit before sending',
    })
  }

  const handleConfirmExchange = () => {
    setRatingModalOpen(true)
  }

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    try {
      await api.submitRating(selectedThread!, rating, ratingComment)
      toast.success('Rating submitted!')
      setRatingModalOpen(false)
      setRating(0)
      setRatingComment('')
    } catch (error) {
      toast.error('Failed to submit rating')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // CRITICAL: Find thread by selectedThread ID, but prioritize selectedUserId if available
  const selectedThreadData = selectedThread 
    ? threads.find(t => {
        // First try to find by thread ID and userId match
        if (t.id === selectedThread && selectedUserId && t.userId === selectedUserId) {
          return true
        }
        // If no userId specified, just match by thread ID
        if (t.id === selectedThread && !selectedUserId) {
          return true
        }
        // If userId is specified but thread doesn't match, don't return it
        if (selectedUserId && t.userId !== selectedUserId) {
          return false
        }
        return false
      })
    : null

  // Log thread data for debugging
  useEffect(() => {
    if (selectedThread) {
      console.log('[MessagesChatPage] Selected thread data:', {
        selectedThread,
        selectedUserId,
        threadData: selectedThreadData,
        allThreads: threads.map(t => ({ id: t.id, userId: t.userId, userName: t.userName }))
      })
    }
  }, [selectedThread, selectedUserId, selectedThreadData, threads])

  // Fetch seller name when selectedUserId changes - PRESERVE name even during reloads
  useEffect(() => {
    if (selectedUserId) {
      // Priority 1: Use thread data if it matches and has a name
      if (selectedThreadData && selectedThreadData.userId === selectedUserId && selectedThreadData.userName) {
        const threadName = selectedThreadData.userName
        setCurrentSellerName(threadName)
        console.log(`[MessagesChatPage] Using name from thread data: ${threadName}`)
        return // Don't fetch if we have a good name
      }
      
      // Priority 2: Keep existing name if we have one (don't clear it)
      if (currentSellerName && currentSellerName !== 'User' && currentSellerName !== 'Loading...') {
        console.log(`[MessagesChatPage] Keeping existing seller name: ${currentSellerName}`)
        return
      }
      
      // Priority 3: Fetch user profile only if we don't have a name yet
      console.log(`[MessagesChatPage] Fetching user profile for userId: ${selectedUserId}`)
      api.getProfile(selectedUserId)
        .then(profile => {
          if (profile && profile.user && profile.user.name) {
            const userName = profile.user.name
            setCurrentSellerName(userName)
            console.log(`[MessagesChatPage] ✅ Fetched seller name: ${userName}`)
          } else {
            // Keep existing name or use fallback
            if (!currentSellerName) {
              setCurrentSellerName(selectedThreadData?.userName || 'User')
            }
          }
        })
        .catch(error => {
          console.error(`[MessagesChatPage] ❌ Error fetching user profile:`, error)
          // Don't clear name on error - keep what we have
          if (!currentSellerName) {
            setCurrentSellerName(selectedThreadData?.userName || 'User')
          }
        })
    } else if (!selectedThread) {
      // Only clear if we don't have a thread selected
      setCurrentSellerName(null)
    }
  }, [selectedUserId, selectedThreadData, selectedThread])

  // Verify selected thread data matches the selected user
  useEffect(() => {
    if (selectedThread && selectedUserId) {
      // If we have a selectedUserId (the seller we want), make sure the thread matches
      if (selectedThreadData) {
        if (selectedThreadData.userId !== selectedUserId) {
          console.warn(`[MessagesChatPage] ⚠️ Thread-user mismatch! Thread has userId ${selectedThreadData.userId}, but we want ${selectedUserId}`)
          // Try to find the correct thread
          const correctThread = threads.find(t => t.userId === selectedUserId)
          if (correctThread) {
            console.log(`[MessagesChatPage] ✅ Found correct thread: ${correctThread.id}`)
            setSelectedThread(correctThread.id)
          } else {
            console.warn(`[MessagesChatPage] ❌ Correct thread not found, may need to create it`)
          }
        } else {
          console.log(`[MessagesChatPage] ✅ Thread matches selectedUserId: ${selectedUserId}`)
        }
      } else {
        console.warn(`[MessagesChatPage] ⚠️ Selected thread ${selectedThread} not found in threads list`)
      }
    }
  }, [selectedThread, selectedThreadData, selectedUserId, threads])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      {/* Safety Tips Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4 shadow-md"
      >
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Safety Tips
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Meet in public spaces, during daylight hours, and bring a valid ID. 
              Trust your instincts and report any suspicious activity.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)]">
        {/* Left Panel - Thread List */}
        <div className="lg:w-1/3 flex flex-col border border-border rounded-2xl bg-card overflow-hidden shadow-md">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg xl:text-xl font-semibold">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => handleThreadSelect(thread.id)}
                className={cn(
                  "w-full p-4 text-left border-b border-border hover:bg-accent transition-colors",
                  selectedThread === thread.id && "bg-accent"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                    {thread.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">{thread.userName}</h3>
                      {thread.unread > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                          {thread.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {thread.lastMessage}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {thread.lastMessageTime}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel - Chat Pane */}
        <div className="lg:w-2/3 flex flex-col border border-border rounded-2xl bg-card overflow-hidden shadow-md">
          {selectedThread ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">
                    {selectedThreadData?.avatar || '👤'}
                  </div>
                  <div>
                    <h3 className="text-lg xl:text-xl font-semibold">
                      {currentSellerName || selectedThreadData?.userName || 'User'}
                    </h3>
                    <p className="text-xs text-muted-foreground">Active now</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleConfirmExchange}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Exchange Done
                </Button>
              </div>

              {/* Rating Modal */}
              <Dialog open={ratingModalOpen} onOpenChange={setRatingModalOpen}>
                <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rate Your Exchange</DialogTitle>
                      <DialogDescription>
                        How was your experience with {currentSellerName || selectedThreadData?.userName || 'this user'}?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Star Rating */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className={cn(
                                "p-2 rounded-md hover:bg-accent transition-colors",
                                star <= rating && "bg-yellow-100 dark:bg-yellow-900/30"
                              )}
                            >
                              <Star
                                className={cn(
                                  "h-6 w-6",
                                  star <= rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                )}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comment */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Comment (optional)</label>
                        <Textarea
                          placeholder="Share your experience..."
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setRatingModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSubmitRating}>
                          Submit Rating
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
              </Dialog>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex",
                        message.isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          message.isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            message.isOwn
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Smart Replies */}
              <div className="px-4 py-2 border-t border-border">
                <div className="flex flex-wrap gap-2 mb-2">
                  {smartReplies.map((reply) => (
                    <Button
                      key={reply}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSmartReply(reply)}
                      className="text-xs"
                    >
                      {reply}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage()
                  }}
                  className="flex gap-2"
                >
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
