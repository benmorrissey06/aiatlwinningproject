import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [ratingModalOpen, setRatingModalOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadThreads()
  }, [])

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread)
    }
  }, [selectedThread])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadThreads = async () => {
     try {
       const result = await api.getMessages()
       setThreads(result.threads)
       if (result.threads.length > 0 && !selectedThread) {
         setSelectedThread(result.threads[0].id)
       }
     } catch (error) {
       toast.error('Failed to load messages')
     }
   }

  const loadMessages = async (threadId: string) => {
    try {
      const result = await api.getThreadMessages(threadId)
      setMessages(result.messages)
    } catch (error) {
      toast.error('Failed to load messages')
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return

    try {
      await api.sendMessage(selectedThread, newMessage)
      const newMsg: Message = {
        id: Date.now().toString(),
        senderId: 'me',
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      }
      setMessages([...messages, newMsg])
      setNewMessage('')
      toast.success('Message sent', {
        description: 'Your message has been delivered',
      })
    } catch (error) {
      toast.error('Failed to send message', {
        description: 'Please try again',
      })
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

  const selectedThreadData = threads.find(t => t.id === selectedThread)

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
                onClick={() => setSelectedThread(thread.id)}
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
                    {selectedThreadData?.avatar}
                  </div>
                  <div>
                    <h3 className="text-lg xl:text-xl font-semibold">{selectedThreadData?.userName}</h3>
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
                        How was your experience with {selectedThreadData?.userName}?
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
