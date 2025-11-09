import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Shield, 
  Star, 
  Package, 
  MessageSquare, 
  Settings,
  CheckCircle2,
  Award,
  MapPin,
  TrendingUp,
  History,
  Loader2,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

interface SalesHistorySummary {
  category: string
  item_examples: string[]
  total_items_sold: number
  avg_price_per_item: number | null
  dominant_transaction_type_in_category: string
}

interface SellerProfile {
  schema_type: string
  user_id: string
  context: {
    original_text: string
  }
  profile_keywords: string[]
  inferred_major: string | null
  inferred_location_keywords: string[]
  sales_history_summary: SalesHistorySummary[]
  overall_dominant_transaction_type: string
  related_categories_of_interest: string[]
}

interface UserData {
  id: string
  name: string
  email: string
  location: string
  bio: string
  verified: boolean
  trustScore: number
  rating: number
  pastTrades: number
  badges: string[]
  sellerProfile?: SellerProfile
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'sales', label: 'Sales History', icon: History },
  { id: 'activity', label: 'Activity', icon: TrendingUp },
  { id: 'listings', label: 'Listings', icon: Package },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const mockActivity = [
  { id: '1', type: 'request', title: 'Created Flash Request', time: '2 hours ago', icon: Package },
  { id: '2', type: 'message', title: 'Sent message to Alex Chen', time: '5 hours ago', icon: MessageSquare },
  { id: '3', type: 'completed', title: 'Completed exchange with Jordan Smith', time: '1 day ago', icon: CheckCircle2 },
]

const mockListings = [
  { id: '1', title: 'Calculus Textbook - 3rd Edition', status: 'Active', price: '$25' },
  { id: '2', title: 'MacBook Pro Charger', status: 'Pending', price: '$15' },
  { id: '3', title: 'Winter Jacket - Size M', status: 'Sold', price: '$30' },
]

const mockReviews = [
  { id: '1', reviewer: 'Alex Chen', rating: 5, comment: 'Great experience! Very reliable.', date: '2 days ago' },
  { id: '2', reviewer: 'Jordan Smith', rating: 5, comment: 'Super helpful and friendly.', date: '1 week ago' },
  { id: '3', reviewer: 'Taylor Johnson', rating: 4, comment: 'Quick response and smooth exchange.', date: '2 weeks ago' },
]

export function UserProfilePage() {
  const { userId } = useParams<{ userId?: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const targetUserId = userId || localStorage.getItem('userId')
        if (!targetUserId) {
          toast.error('No user ID found')
          navigate('/login')
          return
        }

        const response = await fetch(`${API_BASE_URL}/api/users/${targetUserId}/profile`)
        if (!response.ok) {
          throw new Error('Failed to fetch user profile')
        }

        const data = await response.json()
        setUserData(data.user)
      } catch (error) {
        toast.error('Failed to load user profile', {
          description: error instanceof Error ? error.message : 'Unknown error',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [userId, navigate])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <p className="text-center text-muted-foreground">User not found</p>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {userData.bio && (
              <div className="p-4 rounded-2xl border border-border bg-card shadow-md">
                <h3 className="text-lg font-semibold mb-3">About</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{userData.bio}</p>
              </div>
            )}
            
            {userData.sellerProfile && (
              <div className="p-4 rounded-2xl border border-border bg-card shadow-md">
                <h3 className="text-lg font-semibold mb-3">Seller Profile</h3>
                <div className="space-y-4">
                  {userData.sellerProfile.inferred_major && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Major: </span>
                      <span className="text-sm">{userData.sellerProfile.inferred_major}</span>
                    </div>
                  )}
                  
                  {userData.sellerProfile.profile_keywords.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Keywords: </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {userData.sellerProfile.profile_keywords.map((keyword, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-full bg-muted text-xs"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {userData.sellerProfile.related_categories_of_interest.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Interests: </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {userData.sellerProfile.related_categories_of_interest.map((category, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )

      case 'sales':
        if (!userData.sellerProfile || !userData.sellerProfile.sales_history_summary.length) {
          return (
            <div className="p-8 rounded-2xl border border-border bg-card shadow-md text-center">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No sales history available</p>
            </div>
          )
        }

        return (
          <div className="space-y-4">
            {userData.sellerProfile.sales_history_summary.map((category, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl border border-border bg-card shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold">{category.category}</h4>
                  <span className="px-2 py-1 rounded-full bg-muted text-xs">
                    {category.dominant_transaction_type_in_category}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Items Sold: </span>
                    <span className="text-sm font-medium">{category.total_items_sold}</span>
                  </div>
                  {category.avg_price_per_item !== null && (
                    <div>
                      <span className="text-sm text-muted-foreground">Avg Price: </span>
                      <span className="text-sm font-medium">${category.avg_price_per_item.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                {category.item_examples.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground mb-2 block">Examples: </span>
                    <div className="flex flex-wrap gap-2">
                      {category.item_examples.map((item, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-md bg-muted text-xs"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )

      case 'activity':
        return (
          <div className="space-y-4">
            {mockActivity.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-card shadow-md"
                >
                  <div className="p-2 rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )
      
      case 'listings':
        return (
          <div className="space-y-4">
            {mockListings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card shadow-md"
              >
                <div>
                  <h4 className="font-medium">{listing.title}</h4>
                  <p className="text-sm text-muted-foreground">{listing.price}</p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  listing.status === 'Active' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                  listing.status === 'Pending' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                  listing.status === 'Sold' && "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                )}>
                  {listing.status}
                </span>
              </div>
            ))}
          </div>
        )
      
      case 'reviews':
        return (
          <div className="space-y-4">
            {mockReviews.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-2xl border border-border bg-card shadow-md"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{review.reviewer}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-4 w-4",
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{review.date}</span>
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </div>
            ))}
          </div>
        )
      
      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Display Name</label>
                  <input
                    type="text"
                    defaultValue={userData.name}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <input
                    type="email"
                    defaultValue="john.doe@mit.edu"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Campus</label>
                  <select className="w-full px-3 py-2 rounded-md border border-input bg-background">
                    <option>MIT</option>
                    <option>Harvard</option>
                    <option>Stanford</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Show my profile to other users</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Allow messages from other users</span>
                </label>
              </div>
            </div>

            <Button>Save Changes</Button>
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
      className="container mx-auto px-4 py-8 max-w-5xl"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6 mb-6 shadow-md"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={userData.avatar} alt={userData.name} />
            <AvatarFallback className="text-2xl">
              {userData.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl xl:text-3xl font-bold">{userData.name}</h1>
              {userData.verified && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{userData.location || 'No location'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Trust Score: {userData.trustScore}%</span>
              </div>
              {userData.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{userData.rating.toFixed(1)}</span>
                </div>
              )}
              {userData.pastTrades > 0 && (
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>{userData.pastTrades} trades</span>
                </div>
              )}
            </div>

            {/* Badges */}
            {userData.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {userData.badges.map((badge, i) => (
                  <span
                    key={i}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
                      badge.includes('Verified') && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                      badge.includes('Top') && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    )}
                  >
                    {badge.includes('Verified') && <CheckCircle2 className="h-3 w-3" />}
                    {badge.includes('Top') && <Award className="h-3 w-3" />}
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

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
