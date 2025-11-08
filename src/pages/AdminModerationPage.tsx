import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Flag, 
  AlertTriangle, 
  Ban, 
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  TrendingUp,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, type Flag as FlagType } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'flags', label: 'Flags', icon: Flag },
  { id: 'risk', label: 'Risk Signals', icon: AlertTriangle },
  { id: 'terms', label: 'Prohibited Terms', icon: Ban },
  { id: 'accounts', label: 'Accounts', icon: Users },
]

const severityColors = {
  low: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  critical: 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-100',
}

const statusColors = {
  pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

export function AdminModerationPage() {
  const [activeTab, setActiveTab] = useState('flags')
  const [flags, setFlags] = useState<FlagType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (activeTab === 'flags') {
      loadFlags()
    }
  }, [activeTab])

  const loadFlags = async () => {
    try {
      setLoading(true)
      const result = await api.getFlags()
      setFlags(result.flags)
    } catch (error) {
      toast.error('Failed to load flags')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveFlag = async (flagId: string, action: 'resolve' | 'dismiss') => {
    try {
      await api.resolveFlag(flagId, action)
      toast.success(`Flag ${action === 'resolve' ? 'resolved' : 'dismissed'}`)
      loadFlags()
    } catch (error) {
      toast.error('Failed to update flag')
    }
  }

  const filteredFlags = flags.filter(flag =>
    flag.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flag.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flag.userId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'flags':
        return (
          <div className="space-y-4">
            {/* Search */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Search flags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* Flags Table */}
            <div className="rounded-2xl border border-border overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Reason</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Snippet</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Severity</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          Loading flags...
                        </td>
                      </tr>
                    ) : filteredFlags.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          No flags found
                        </td>
                      </tr>
                    ) : (
                      filteredFlags.map((flag) => (
                        <tr
                          key={flag.id}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm">{flag.reason}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                            {flag.snippet}
                          </td>
                          <td className="px-4 py-3 text-sm">{flag.userId}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                severityColors[flag.severity]
                              )}
                            >
                              {flag.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                statusColors[flag.status]
                              )}
                            >
                              {flag.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(flag.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResolveFlag(flag.id, 'resolve')}
                                disabled={flag.status === 'resolved'}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResolveFlag(flag.id, 'dismiss')}
                                disabled={flag.status === 'dismissed'}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      case 'risk':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl xl:text-3xl font-bold">Risk Signals</h2>

            {/* Risk Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Repeated Requests Chart */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Repeated Requests</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { user: 'User ID: 9', count: 12, risk: 'High' },
                    { user: 'User ID: 6', count: 8, risk: 'Medium' },
                    { user: 'User ID: 4', count: 5, risk: 'Low' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.user}</span>
                          <span className="text-xs text-muted-foreground">{item.count} requests</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full",
                              item.risk === 'High' && "bg-red-500",
                              item.risk === 'Medium' && "bg-orange-500",
                              item.risk === 'Low' && "bg-yellow-500"
                            )}
                            style={{ width: `${(item.count / 12) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unusual Behavior Chart */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Unusual Behavior</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { user: 'User ID: 9', signals: 5, risk: 'Critical' },
                    { user: 'User ID: 6', signals: 3, risk: 'High' },
                    { user: 'User ID: 1', signals: 1, risk: 'Low' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.user}</span>
                          <span className="text-xs text-muted-foreground">{item.signals} signals</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full",
                              item.risk === 'Critical' && "bg-red-600",
                              item.risk === 'High' && "bg-red-500",
                              item.risk === 'Low' && "bg-yellow-500"
                            )}
                            style={{ width: `${(item.signals / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'terms':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl xl:text-3xl font-bold">Prohibited Terms</h2>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-md">
              <p className="text-muted-foreground mb-4">
                Manage prohibited terms that are automatically flagged by the AI moderation system.
              </p>
              <div className="space-y-2">
                {[
                  'alcohol', 'drugs', 'weapons', 'firearms', 'tobacco',
                  'prescription', 'counterfeit', 'stolen', 'illegal'
                ].map((term, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border shadow-sm"
                  >
                    <span className="font-mono text-sm">{term}</span>
                    <Button variant="ghost" size="sm">
                      <Ban className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button className="mt-4">Add Prohibited Term</Button>
            </div>
          </div>
        )

      case 'accounts':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl xl:text-3xl font-bold">Account Management</h2>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-md">
              <p className="text-muted-foreground mb-4">
                View and manage user accounts. Suspend or ban users who violate community guidelines.
              </p>
              <div className="space-y-2">
                {[
                  { id: '6', name: 'Casey Brown', violations: 3, status: 'Active' },
                  { id: '9', name: 'Quinn Anderson', violations: 2, status: 'Warning' },
                ].map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-border shadow-sm"
                  >
                    <div>
                      <h4 className="font-medium">{account.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ID: {account.id} • {account.violations} violations
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Suspend</Button>
                      <Button variant="destructive" size="sm">Ban</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      <div className="mb-6">
        <h1 className="text-3xl xl:text-4xl font-bold mb-2">Admin Moderation</h1>
        <p className="text-muted-foreground">
          Manage flags, monitor risk signals, and moderate content
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderTabContent()}
      </motion.div>
    </motion.div>
  )
}
