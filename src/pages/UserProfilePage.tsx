import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Star, 
  Package, 
  MessageSquare, 
  Settings,
  CheckCircle2,
  Award,
  MapPin,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'activity', label: 'Activity', icon: TrendingUp },
  { id: 'listings', label: 'Listings', icon: Package },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const badges = [
  { id: 'verified', label: 'Verified Student', icon: Shield, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { id: 'top-helper', label: 'Top Helper', icon: Award, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
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
  const [activeTab, setActiveTab] = useState('activity')
  const userData = {
    name: 'John Doe',
    campus: 'MIT',
    verified: true,
    trustScore: 95,
    avatar: '',
  }

  const renderTabContent = () => {
    switch (activeTab) {
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
                <span>{userData.campus}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Trust Score: {userData.trustScore}%</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => {
                const Icon = badge.icon
                return (
                  <span
                    key={badge.id}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
                      badge.color
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {badge.label}
                  </span>
                )
              })}
            </div>
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
