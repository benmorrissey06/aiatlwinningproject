import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  MapPin,
  Clock,
  Shield,
  Users,
  Send,
  Radio,
  Bell,
  CheckCircle2,
  XCircle,
  Package
} from 'lucide-react'
import { cn } from '@/lib/utils'
import TrustBadge from '@/components/TrustBadge'
import TransactionsDrawer from '@/components/TransactionsDrawer'
import { getProfileSummary } from '@/services/trust'
import type { ProfileTrustSummary } from '@/types/trust'
import { getOrCreateDM } from '@/services/chat'

interface SmartPingMatch {
  id: string
  userId: string
  responderUserId: string
  responderName: string
  name: string
  major: string
  dorm: string
  distance: string
  likelihood: number
  badges: string[]
  status: 'delivered' | 'accepted' | 'declined' | null
}

interface RequestData {
  description: string
  category: string
  urgency: number
  location: string
  requireCheckIn: boolean
}

const urgencyLabels = ['Now', 'Today', 'This Week']

export function SmartPingMatchesPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const requestId = searchParams.get('requestId') || 'demo'

  const [requestData, setRequestData] = useState<RequestData | null>(null)
  const [matches, setMatches] = useState<SmartPingMatch[]>([])
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [trustSummaries, setTrustSummaries] = useState<Record<string, ProfileTrustSummary>>({})
  const loadingSummariesRef = useRef(new Set<string>())
  const summariesRef = useRef<Record<string, ProfileTrustSummary>>({})
  const [historyUserId, setHistoryUserId] = useState<string | null>(null)
  const [messagingUserId, setMessagingUserId] = useState<string | null>(null)

  const ensureSummary = useCallback(async (userId: string) => {
    if (!userId) return
    if (summariesRef.current[userId]) {
      setTrustSummaries((prev) => (prev[userId] ? prev : { ...prev, [userId]: summariesRef.current[userId] }))
      return
    }
    if (loadingSummariesRef.current.has(userId)) return
    loadingSummariesRef.current.add(userId)
    try {
      const summary = await getProfileSummary(userId)
      summariesRef.current = { ...summariesRef.current, [userId]: summary }
      setTrustSummaries((prev) => ({ ...prev, [userId]: summary }))
    } catch (error) {
      console.error('Failed to load trust summary', error)
    } finally {
      loadingSummariesRef.current.delete(userId)
    }
  }, [])

  const handleOpenHistory = useCallback(
    async (userId: string) => {
      await ensureSummary(userId)
      setHistoryUserId(userId)
    },
    [ensureSummary],
  )

  const handleOpenMessage = useCallback(
    async (userId: string, displayName: string) => {
      if (!userId) return
      setMessagingUserId(userId)
      try {
        const thread = await getOrCreateDM(userId)
        const threadState = { openThread: thread.threadId, userId: thread.userId }
        const hasThreadRoute =
          typeof window !== 'undefined' &&
          Boolean((window as Window & { __FLASH_HAS_MESSAGES_THREAD_ROUTE__?: boolean }).__FLASH_HAS_MESSAGES_THREAD_ROUTE__)

        if (hasThreadRoute) {
          navigate(`/messages/${thread.threadId}`, { state: threadState })
        } else {
          navigate({ pathname: '/messages', search: `?thread=${encodeURIComponent(thread.threadId)}` }, { state: threadState })
        }
      } catch (error) {
        console.error('Failed to open direct message', error)
        toast.error(`Unable to open messages with ${displayName}`)
      } finally {
        setMessagingUserId((current) => (current === userId ? null : current))
      }
    },
    [navigate],
  )

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true)
        const result = await api.getSmartMatches(requestId)
        setRequestData(result.requestData)
        const mappedMatches: SmartPingMatch[] = result.matches.map((item, index) => ({
          id: item.user.id ?? `${item.user.name}-${index}`,
          userId: item.user.id,
          responderUserId: item.user.id,
          responderName: item.user.name,
          name: item.user.name,
          major: item.user.major,
          dorm: item.user.dorm,
          distance: `${item.distanceMin.toFixed(1)} mi`,
          likelihood: item.likelihood,
          badges: item.user.badges ?? [],
          status: null,
        }))
        setMatches(mappedMatches)
      } catch (error) {
        toast.error('Failed to load Smart-Ping matches')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [requestId])

  useEffect(() => {
    matches.forEach((match) => {
      const responderId = match.responderUserId || match.userId
      ensureSummary(responderId)
    })
  }, [matches, ensureSummary])

  const handleSelectMatch = (matchId: string) => {
    const newSelected = new Set(selectedMatches)
    if (newSelected.has(matchId)) {
      newSelected.delete(matchId)
    } else {
      newSelected.add(matchId)
    }
    setSelectedMatches(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedMatches.size === matches.length) {
      setSelectedMatches(new Set())
    } else {
      setSelectedMatches(new Set(matches.map(m => m.id)))
    }
  }

  const handlePingSelected = async () => {
    if (selectedMatches.size === 0) {
      toast.error('Please select at least one match', {
        description: 'Choose matches to ping from the list',
      })
      return
    }

    try {
      await api.pingMatches(requestId, Array.from(selectedMatches))
      toast.success(`Pinged ${selectedMatches.size} match${selectedMatches.size !== 1 ? 'es' : ''}`, {
        description: 'Selected users have been notified',
      })
      // Update match statuses
      setMatches((prev) =>
        prev.map((m) =>
          selectedMatches.has(m.id) && !m.status
            ? { ...m, status: 'accepted' as const }
            : m
        )
      )
      // Clear selection after pinging
      setSelectedMatches(new Set())
    } catch (error) {
      toast.error('Failed to ping matches', {
        description: 'Please try again',
      })
    }
  }

  const handleBroadcast = async (type: 'narrow' | 'wide') => {
    try {
      await api.pingMatches(requestId, [], type)
      toast.success(`Broadcast ${type} sent`, {
        description: `Your request has been broadcast to ${type === 'narrow' ? 'nearby' : 'all'} users`,
      })
    } catch (error) {
      toast.error('Failed to send broadcast', {
        description: 'Please try again',
      })
    }
  }

  const getStatusChip = (status: SmartPingMatch['status']) => {
    if (!status) return null

    const statusConfig = {
      delivered: {
        icon: Package,
        label: 'Delivered',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      },
      accepted: {
        icon: CheckCircle2,
        label: 'Accepted',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      },
      declined: {
        icon: XCircle,
        label: 'Declined',
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
        config.className
      )}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading Smart-Ping matches...</div>
      </div>
    )
  }

  if (!requestData) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No request data found</p>
          <Button onClick={() => navigate('/request/create')}>Create New Request</Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Panel - Request Summary */}
        <div className="lg:w-1/3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-border bg-card p-6 sticky top-4 shadow-md"
          >
            <h2 className="text-xl xl:text-2xl font-bold mb-4">Your Flash Request</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p className="text-base">{requestData.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
                  <p className="text-base font-medium">{requestData.category}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Urgency</h3>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base font-medium">
                      {urgencyLabels[requestData.urgency]}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Meet-up Location</h3>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{requestData.location}</p>
                </div>
              </div>

              {requestData.requireCheckIn && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Check-in required</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Matches Found</span>
                <span className="text-2xl font-bold text-primary">{matches.length}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Matches List */}
        <div className="lg:w-2/3">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card shadow-md">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedMatches.size === matches.length && matches.length > 0}
                  onChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedMatches.size > 0
                    ? `${selectedMatches.size} selected`
                    : 'Select all'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handlePingSelected}
                  disabled={selectedMatches.size === 0}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Ping Selected
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBroadcast('narrow')}
                  className="gap-2"
                >
                  <Radio className="h-4 w-4" />
                  Broadcast Narrow
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBroadcast('wide')}
                  className="gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Broadcast Wide
                </Button>
              </div>
            </div>

            {/* Matches List */}
            <div className="space-y-4">
              {matches.map((match, index) => {
                const responderId = match.responderUserId || match.userId
                const displayName = match.responderName || match.name
                const summary = trustSummaries[responderId]
                const isOpeningMessage = messagingUserId === responderId
                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={cn(
                      "rounded-2xl border border-border bg-card p-6 shadow-md hover:shadow-lg transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
                      selectedMatches.has(match.id) && "ring-2 ring-primary",
                      isOpeningMessage && "opacity-70 pointer-events-none"
                    )}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open messages with ${displayName}`}
                    onMouseEnter={() => ensureSummary(responderId)}
                    onClick={() => handleOpenMessage(responderId, displayName)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleOpenMessage(responderId, displayName)
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedMatches.has(match.id)}
                        onChange={() => handleSelectMatch(match.id)}
                        className="mt-1"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => {
                          if (event.key === ' ' || event.key === 'Enter') {
                            event.stopPropagation()
                          }
                        }}
                      />

                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{displayName}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span>{match.major}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {match.dorm}
                              </span>
                              <span>•</span>
                              <span>{match.distance}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3 text-right">
                            <div>
                              <div
                                className={cn(
                                  "text-2xl font-bold mb-1",
                                  match.likelihood >= 85 ? "text-green-600 dark:text-green-400" :
                                  match.likelihood >= 75 ? "text-primary" :
                                  "text-orange-600 dark:text-orange-400"
                                )}
                              >
                                {match.likelihood}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Likely has it
                              </div>
                              <div className="w-20 h-1.5 bg-secondary rounded-full mt-2 ml-auto">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    match.likelihood >= 85 ? "bg-green-600 dark:bg-green-400" :
                                    match.likelihood >= 75 ? "bg-primary" :
                                    "bg-orange-600 dark:text-orange-400"
                                  )}
                                  style={{ width: `${match.likelihood}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap justify-end gap-2">
                              {summary ? (
                                <TrustBadge
                                  summary={summary}
                                  onOpenHistory={() => handleOpenHistory(responderId)}
                                  className="justify-end"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    handleOpenHistory(responderId)
                                  }}
                                  className="text-xs rounded-full border border-border px-3 py-1.5 text-muted-foreground hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                >
                                  View history & ratings
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {match.badges.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {match.badges.map((badge, badgeIdx) => (
                              <span
                                key={`${responderId}-badge-${badgeIdx}`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                              >
                                <Shield className="h-3 w-3" />
                                {badge}
                              </span>
                            ))}
                          </div>
                        )}

                        {getStatusChip(match.status) && (
                          <div className="pt-1">
                            {getStatusChip(match.status)}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              {matches.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No matches found</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      {historyUserId && (
        <TransactionsDrawer
          userId={historyUserId}
          open={Boolean(historyUserId)}
          onClose={() => setHistoryUserId(null)}
        />
      )}
    </motion.div>
  )
}
