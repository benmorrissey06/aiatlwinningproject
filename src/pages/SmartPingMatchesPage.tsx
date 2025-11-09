import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { ReactNode } from 'react'
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
  Package,
  Tag,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import TrustBadge from '@/components/TrustBadge'
import TransactionsDrawer from '@/components/TransactionsDrawer'
import { getProfileSummary } from '@/services/trust'
import type { ProfileTrustSummary } from '@/types/trust'
import { getOrCreateDM } from '@/services/chat'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  debug?: {
    probability?: number
    activatedFeatures?: Array<[string, number]>
    representativeItem?: any
    sellerProfile?: any
    source?: string
  }
}

type SellerDebugEntry = {
  id: string
  name: string
  probability?: number
  profile?: any
  representativeItem?: any
  source?: string
  features: Array<[string, number]>
}

type DebugPopupDescriptor =
  | {
      id: string
      type: 'buyer'
      title: string
      payload: any
    }
  | {
      id: string
      type: 'model'
      title: string
      modelSummary: any
      matches: SmartPingMatch[]
    }
  | {
      id: string
      type: 'sellers'
      title: string
      sellers: SellerDebugEntry[]
    }

const BuyerDebugPopup = ({ payload }: { payload: any }) => (
  <pre>{JSON.stringify(payload, null, 2)}</pre>
)

interface RequestData {
  description: string
  category: string
  urgencyLabel: string
  location: string
  requireCheckIn: boolean
  parsedItem?: string
  priceMax?: number | null
}

const ModelDebugPopup = ({ modelSummary, matches }: { modelSummary: any; matches: SmartPingMatch[] }) => (
  <div className="space-y-3">
    <div className="rounded-lg bg-background/60 p-2 text-xs font-sans">
      <p className="font-semibold text-foreground">
        {modelSummary?.type ?? 'RandomForestClassifier'} · Artifact {modelSummary?.artifact ?? 'matchmaker_model.joblib'}
      </p>
      <p className="text-muted-foreground mt-1">
        Feature count: {modelSummary?.featureCount ?? '—'} · Positive class index: {modelSummary?.positiveClassIndex ?? '—'}
      </p>
    </div>
    <div className="space-y-2">
      {matches.slice(0, 5).map((match) => (
        <div key={match.id} className="rounded-lg border border-border/60 bg-background/70 p-2">
          <p className="text-xs font-semibold text-foreground">
            {match.name} · Likelihood {match.likelihood.toFixed(1)}%
          </p>
          <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
            {(match.debug?.activatedFeatures ?? []).slice(0, 4).map(([featureName, value], idx) => (
              <li key={`${match.id}-${featureName}-${idx}`} className="flex items-center justify-between gap-2">
                <span className="truncate">{featureName}</span>
                <span className="font-medium text-foreground">{value.toFixed(2)}</span>
              </li>
            ))}
            {(!match.debug?.activatedFeatures || match.debug.activatedFeatures.length === 0) && (
              <li className="text-muted-foreground/70">No feature activations returned.</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  </div>
)

const SellerDebugPopup = ({ sellers }: { sellers: SellerDebugEntry[] }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = sellers[activeIndex]

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {sellers.map((seller, idx) => (
          <Button
            key={seller.id}
            size="sm"
            variant={idx === activeIndex ? 'default' : 'outline'}
            className="h-7 rounded-full px-3 text-xs"
            onClick={() => setActiveIndex(idx)}
          >
            {seller.name}
          </Button>
        ))}
      </div>
      {active ? (
        <div className="space-y-2">
          <div className="rounded-lg bg-background/60 p-2 text-xs font-sans">
            <p className="font-semibold text-foreground">
              {active.name} · Match likelihood {((active.probability ?? 0) * 100).toFixed(1)}%
            </p>
            {active.source && <p className="text-muted-foreground mt-1">Source: {active.source}</p>}
          </div>
          <div className="rounded-lg border border-border/60 bg-background/70 p-2">
            <p className="mb-1 text-[11px] font-semibold text-foreground">Top contributing features</p>
            <ul className="space-y-0.5 text-[11px] text-muted-foreground">
              {active.features.slice(0, 5).map(([name, value], idx) => (
                <li key={`${active.id}-ft-${idx}`} className="flex items-center justify-between gap-2">
                  <span className="truncate">{name}</span>
                  <span className="font-medium text-foreground">{value.toFixed(2)}</span>
                </li>
              ))}
              {active.features.length === 0 && <li className="text-muted-foreground/70">No feature activations reported.</li>}
            </ul>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/70 p-2 text-[11px]">
            <p className="font-semibold text-foreground mb-1">Seller profile JSON</p>
            <pre className="max-h-32 overflow-auto">{JSON.stringify(active.profile, null, 2)}</pre>
          </div>
          {active.representativeItem && (
            <div className="rounded-lg border border-border/60 bg-background/70 p-2 text-[11px]">
              <p className="font-semibold text-foreground mb-1">Representative item</p>
              <pre className="max-h-32 overflow-auto">{JSON.stringify(active.representativeItem, null, 2)}</pre>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No seller profiles returned.</p>
      )}
    </div>
  )
}

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
  const [parsedRequest, setParsedRequest] = useState<any | null>(null)
  const [debugInfo, setDebugInfo] = useState<any | null>(null)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [debugPanelVisible, setDebugPanelVisible] = useState(true)
  const [debugDockVisible, setDebugDockVisible] = useState(true)
  const [activeDebugPopupId, setActiveDebugPopupId] = useState<string | null>(null)
  const [openDebugMatchId, setOpenDebugMatchId] = useState<string | null>(null)
  const [showPipelineDialog, setShowPipelineDialog] = useState(false)
  const [openSellerProfileId, setOpenSellerProfileId] = useState<string | null>(null)
  const [debugPopups, setDebugPopups] = useState<DebugPopupDescriptor[]>([])
  const lastPopupRequestRef = useRef<string | null>(null)

  const resolveUrgencyLabel = (value?: string | null) => {
    switch (value) {
      case 'immediate':
        return 'Now'
      case 'high':
        return 'Today'
      case 'medium':
        return 'This Week'
      case 'low':
        return 'Flexible'
      default:
        return 'This Week'
    }
  }

  const formatProbability = (value?: number | null) => {
    const numeric = typeof value === 'number' ? value : 0
    return (numeric * 100).toFixed(1)
  }

  const debugSnapshot = useMemo(() => {
    if (!debugInfo) return null
    return {
      request: parsedRequest,
      metadata: debugInfo?.requestMetadata,
      model: debugInfo?.model,
      matches: matches.slice(0, 5).map((match) => ({
        userId: match.userId,
        probability: match.debug?.probability,
        topFeatures: match.debug?.activatedFeatures?.slice(0, 5),
      })),
    }
  }, [debugInfo, matches, parsedRequest])

  const pipelineSteps = useMemo(() => {
    const steps: Array<{
      key: string
      title: string
      status: 'Complete' | 'Pending'
      detail: string
      payload?: unknown
    }> = []

    steps.push({
      key: 'gemini-request',
      title: 'Gemini parsed flash request',
      status: debugSnapshot?.request ? 'Complete' : 'Pending',
      detail: debugSnapshot?.request
        ? `Schema ${(debugSnapshot.request as any)?.schema_type ?? 'FLASH_REQUEST'} returned from Gemini with ${Object.keys(debugSnapshot.request as Record<string, unknown>).length} top-level fields.`
        : 'Waiting for Gemini parsing service to return structured data.',
      payload: debugSnapshot?.request,
    })

    steps.push({
      key: 'model-scoring',
      title: 'Model encoded features & scored matches',
      status: debugSnapshot?.model ? 'Complete' : 'Pending',
      detail: debugSnapshot?.model
        ? `Model ${(debugSnapshot.model as any)?.type ?? 'Unknown'} from ${debugSnapshot.model?.artifact ?? 'matchmaker_model.joblib'} evaluated ${matches.length} sellers (${debugSnapshot.model?.featureCount ?? 'unknown'} features).`
        : 'Awaiting model prediction results.',
      payload: debugSnapshot?.model,
    })

    steps.push({
      key: 'matches-ready',
      title: 'Seller profiles ready for review',
      status: matches.length > 0 ? 'Complete' : 'Pending',
      detail:
        matches.length > 0
          ? `${matches.length} candidate${matches.length === 1 ? '' : 's'} returned. Top likelihood: ${
              matches[0]?.likelihood ?? 0
            }%.`
          : 'No matches available yet.',
      payload:
        matches.length > 0
          ? matches.slice(0, 3).map((match) => ({
              user: match.userId,
              likelihood: match.likelihood,
              distanceMin: match.distance,
            }))
          : undefined,
    })

    return steps
  }, [debugSnapshot, matches])

  const activeDebugPopup = useMemo(
    () => debugPopups.find((entry) => entry.id === activeDebugPopupId) ?? null,
    [activeDebugPopupId, debugPopups],
  )

  const renderPopupContent = useCallback(
    (popup: DebugPopupDescriptor): ReactNode => {
      switch (popup.type) {
        case 'buyer':
          return <BuyerDebugPopup payload={popup.payload} />
        case 'model':
          return <ModelDebugPopup modelSummary={popup.modelSummary} matches={popup.matches} />
        case 'sellers':
        default:
          return <SellerDebugPopup sellers={popup.sellers} />
      }
    },
    [],
  )

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
      if (!userId) {
        console.error('[handleOpenMessage] ❌ No userId provided')
        toast.error('Unable to open messages: No user ID provided')
        return
      }
      
      console.log(`[handleOpenMessage] 🚀 Opening message with seller userId: ${userId}, displayName: ${displayName}`)
      setMessagingUserId(userId)
      
      try {
        // Navigate immediately with userId - let MessagesChatPage handle thread creation/finding
        // This is more reliable than trying to create thread here
        const threadState = { 
          userId: userId,  // The seller's userId - this is what we want to message
          displayName: displayName 
        }
        console.log(`[handleOpenMessage] ✅ Navigating to messages with state:`, threadState)
        
        // Navigate to messages page - it will handle finding or creating the thread
        navigate('/messages', { 
          state: threadState,
          replace: false
        })
      } catch (error) {
        console.error('[handleOpenMessage] ❌ Failed to navigate to messages:', error)
        toast.error(`Unable to open messages with ${displayName}`)
      } finally {
        // Don't clear messagingUserId immediately - let it stay until navigation completes
        setTimeout(() => {
          setMessagingUserId((current) => (current === userId ? null : current))
        }, 1000)
      }
    },
    [navigate],
  )

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true)
        setDebugPopups([])
        const result = await api.getSmartMatches(requestId)
        const parsed = result.requestData || {}
        setParsedRequest(parsed)
        setDebugInfo(result.debug || null)
        setDebugPanelVisible(true)
        setDebugDockVisible(true)
        setActiveDebugPopupId(null)

        const summary: RequestData = {
          description: parsed?.context?.original_text || parsed?.item_meta?.parsed_item || '—',
          category: parsed?.item_meta?.category || '—',
          urgencyLabel: resolveUrgencyLabel(parsed?.context?.urgency),
          location: parsed?.location?.text_input || '—',
          requireCheckIn: Boolean(result?.debug?.requestMetadata?.requireCheckIn),
          parsedItem: parsed?.item_meta?.parsed_item,
          priceMax: parsed?.transaction?.price_max ?? null,
        }
        setRequestData(summary)
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
          debug: item.debug,
        }))
        setMatches(mappedMatches)
        setOpenDebugMatchId(null)
        setSelectedMatches(new Set())
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
    if (!debugInfo || !parsedRequest || matches.length === 0) return
    if (lastPopupRequestRef.current === requestId) return

    const sellerEntries: SellerDebugEntry[] = matches
      .filter((match) => Boolean(match.debug?.sellerProfile))
      .map((match) => ({
        id: match.id,
        name: match.name,
        probability: match.debug?.probability,
        profile: match.debug?.sellerProfile,
        representativeItem: match.debug?.representativeItem,
        source: match.debug?.source,
        features: match.debug?.activatedFeatures ?? [],
      }))

    const nextPopups: DebugPopupDescriptor[] = [
      {
        id: `buyer-${requestId}`,
        type: 'buyer',
        title: 'Parsed Buyer Request JSON',
        payload: parsedRequest,
      },
      {
        id: `model-${requestId}`,
        type: 'model',
        title: 'Model Weight Application',
        modelSummary: debugInfo.model,
        matches,
      },
    ]

    if (sellerEntries.length > 0) {
      nextPopups.push({
        id: `sellers-${requestId}`,
        type: 'sellers',
        title: 'Seller Profiles Evaluated',
        sellers: sellerEntries,
      })
    }

    setDebugPopups(nextPopups)
    setDebugDockVisible(true)
    lastPopupRequestRef.current = requestId
  }, [debugInfo, parsedRequest, matches, requestId])

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
    <>
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      {debugSnapshot && debugPanelVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 md:p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Debug Panel</h3>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {matches.length} match{matches.length === 1 ? '' : 'es'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Model {debugSnapshot.model?.type ?? 'RandomForest'} · Request {requestId}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="hidden md:inline">Parsed item:</span>
                  <span className="font-medium text-primary">
                    {requestData.parsedItem || requestData.description || '—'}
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowPipelineDialog(true)}>
                  View Pipeline
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowDebugPanel((prev) => !prev)}>
                  {showDebugPanel ? 'Hide Details' : 'Show Details'}
                </Button>
                <Button size="icon" variant="ghost" className="text-muted-foreground" onClick={() => setDebugPanelVisible(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {showDebugPanel && (
              <div className="mt-4 rounded-xl bg-background/70 p-4 text-xs font-mono text-muted-foreground max-h-64 overflow-auto">
                <pre>{JSON.stringify(debugSnapshot, null, 2)}</pre>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {!debugPanelVisible && debugSnapshot && (
        <div className="mb-6">
          <Button size="sm" variant="outline" onClick={() => setDebugPanelVisible(true)}>
            Show Debug Panel
          </Button>
        </div>
      )}

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
                      {requestData.urgencyLabel}
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

              {typeof requestData.priceMax === 'number' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  Budget up to ${requestData.priceMax.toFixed(2)}
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
                          {match.debug?.source && (
                            <span className="text-xs text-muted-foreground">
                              Source: {match.debug.source}
                            </span>
                          )}
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

                        {match.debug && (
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation()
                                if (openDebugMatchId === match.id) {
                                  setOpenSellerProfileId(null)
                                } else {
                                  setOpenSellerProfileId(null)
                                }
                                setOpenDebugMatchId((current) => (current === match.id ? null : match.id))
                              }}
                            >
                              {openDebugMatchId === match.id ? 'Hide Debug' : 'Show Debug'}
                            </Button>
                          </div>
                        )}

                        {openDebugMatchId === match.id && match.debug && (
                          <div className="mt-3 rounded-lg bg-secondary/30 p-3 text-xs text-muted-foreground">
                            <div className="font-medium text-foreground">
                              Model probability: {formatProbability(match.debug.probability)}%
                            </div>
                            <div className="mt-2 font-medium text-foreground">Top feature signals</div>
                            <ul className="mt-1 space-y-1">
                              {(match.debug.activatedFeatures ?? []).slice(0, 5).map(([featureName, value], idx) => (
                                <li key={`${match.id}-feature-${idx}`}>
                                  <code className="rounded bg-background/80 px-1 py-0.5">{featureName}</code>
                                  {typeof value === 'number' && value !== 1 ? <span className="ml-1 text-muted-foreground/80">· {value.toFixed(2)}</span> : null}
                                </li>
                              ))}
                              {(!match.debug.activatedFeatures || match.debug.activatedFeatures.length === 0) && (
                                <li className="text-muted-foreground/70">No feature activations captured.</li>
                              )}
                            </ul>
                            {match.debug.representativeItem?.item_meta?.parsed_item && (
                              <div className="mt-2">
                                <span className="font-medium text-foreground">Representative item:</span>{' '}
                                {match.debug.representativeItem.item_meta.parsed_item}
                              </div>
                            )}
                            {match.debug.sellerProfile && (
                              <div className="mt-3 space-y-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setOpenSellerProfileId((current) => (current === match.id ? null : match.id))
                                  }}
                                >
                                  {openSellerProfileId === match.id ? 'Hide Seller JSON' : 'View Seller JSON'}
                                </Button>
                                {openSellerProfileId === match.id && (
                                  <pre className="max-h-72 overflow-auto rounded-lg bg-background/80 p-3 text-muted-foreground">
                                    {JSON.stringify(match.debug.sellerProfile, null, 2)}
                                  </pre>
                                )}
                              </div>
                            )}
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
      <Dialog open={showPipelineDialog} onOpenChange={setShowPipelineDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Request Processing Pipeline</DialogTitle>
            <DialogDescription>
              Quick confirmation that the flash request moved through Gemini parsing, feature encoding, and match scoring.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pipelineSteps.map((step, idx) => {
              const badgeClass =
                step.status === 'Complete'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
              return (
                <div
                  key={step.key}
                  className="rounded-xl border border-border bg-card/70 p-4 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-foreground">
                      {idx + 1}. {step.title}
                    </div>
                    <span className={cn('rounded-full px-3 py-1 text-xs font-medium', badgeClass)}>
                      {step.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.detail}</p>
                  {step.payload ? (
                    <pre className="max-h-48 overflow-auto rounded-lg bg-background/80 p-3 text-xs font-mono text-muted-foreground">
                      {JSON.stringify(step.payload, null, 2)}
                    </pre>
                  ) : null}
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
    {debugDockVisible && debugPopups.length > 0 && (
      <div className="fixed bottom-4 right-4 z-40 w-[min(360px,calc(100vw-2rem))]">
        <div className="rounded-2xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Debug Views
            </span>
            <div className="flex items-center gap-1">
              {!debugPanelVisible && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setDebugPanelVisible(true)}>
                  Show Panel
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => setDebugDockVisible(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Select a view to open a full-screen debugging workspace.
          </p>
          <div className="flex flex-wrap gap-2">
            {debugPopups.map((popup) => (
              <Button
                key={popup.id}
                size="sm"
                variant={popup.id === activeDebugPopupId ? 'default' : 'outline'}
                className="h-8 rounded-full px-3 text-xs"
                onClick={() => setActiveDebugPopupId(popup.id)}
              >
                {popup.title}
              </Button>
            ))}
          </div>
        </div>
      </div>
    )}
    {!debugDockVisible && debugPopups.length > 0 && (
      <div className="fixed bottom-4 right-4 z-30">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full shadow-lg"
          onClick={() => setDebugDockVisible(true)}
        >
          Show Debug Views
        </Button>
      </div>
    )}
    <Dialog open={Boolean(activeDebugPopup)} onOpenChange={(open) => {
      if (!open) {
        setActiveDebugPopupId(null)
      }
    }}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{activeDebugPopup?.title}</DialogTitle>
          {activeDebugPopup?.type === 'buyer' && (
            <DialogDescription>Structured buyer request returned from Gemini.</DialogDescription>
          )}
          {activeDebugPopup?.type === 'model' && (
            <DialogDescription>Model metadata and top-weighted features used to score matches.</DialogDescription>
          )}
          {activeDebugPopup?.type === 'sellers' && (
            <DialogDescription>Seller profiles and representative items evaluated for the request.</DialogDescription>
          )}
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto rounded-xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
            {activeDebugPopup ? renderPopupContent(activeDebugPopup) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
