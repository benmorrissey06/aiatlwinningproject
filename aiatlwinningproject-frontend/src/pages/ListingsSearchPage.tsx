import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, MessageSquare, Send, Flag, Shield, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { api, Listing } from '@/lib/api'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export function ListingsSearchPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [distance, setDistance] = useState('All')
  const [priceMax, setPriceMax] = useState<string>('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  const categories = ['All', 'Textbooks', 'Electronics', 'Clothing', 'Food', 'Furniture', 'Other']
  const distances = ['All', '0.5 mi', '1 mi', '2 mi', '5 mi']

  useEffect(() => {
    fetchListings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, distance, priceMax, verifiedOnly])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const result = await api.searchListings({
        search: searchQuery,
        category: category !== 'All' ? category : undefined,
        distance: distance !== 'All' ? distance : undefined,
        priceMax: priceMax ? Number(priceMax) : undefined,
        verifiedOnly,
      })
      setListings(result.listings)
      if (searchQuery) {
        toast.success('Search completed', {
          description: `Found ${result.listings.length} listing${result.listings.length !== 1 ? 's' : ''}`,
        })
      }
    } catch (error) {
      toast.error('Failed to load listings', {
        description: 'Please try again',
      })
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetchListings()
    // Toast will show after listings are loaded
  }

  const handleMessage = (listingId: string) => {
    navigate(`/messages?listingId=${listingId}`)
    toast.success('Opening conversation', {
      description: 'You can now message the seller',
    })
  }

  const handleRequest = (listing: Listing) => {
    const params = new URLSearchParams()
    if (listing.title) params.append('item', listing.title)
    if (listing.category) params.append('category', listing.category)
    navigate(`/request/create?${params.toString()}`)
    toast.success('Creating flash request', {
      description: 'Fill out the form to post your request',
    })
  }

  const handleReport = (_listingId: string) => {
    toast.success('Report submitted', {
      description: 'Our team will review it and take appropriate action',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search textbooks, chargers, outfits…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </form>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-6 sticky top-4 shadow-md"
          >
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5" />
              <h2 className="text-lg xl:text-xl font-semibold">Filters</h2>
            </div>

            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    {category}
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Distance Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Distance</label>
                <Select value={distance} onValueChange={setDistance}>
                  <SelectTrigger>
                    {distance}
                  </SelectTrigger>
                  <SelectContent>
                    {distances.map((dist) => (
                      <SelectItem key={dist} value={dist}>
                        {dist}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Max Price</label>
                <Input
                  type="number"
                  placeholder="$50"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  min="0"
                />
              </div>

              {/* Verified Only */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                />
                <label className="text-sm font-medium">Verified only</label>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Listings Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading listings...
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No listings found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  <div className="h-48 bg-muted flex items-center justify-center text-6xl">
                    {listing.photo}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{listing.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>{listing.location || listing.owner.dorm}</span>
                        {listing.owner.verified && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-primary">
                              <Shield className="h-3 w-3" />
                              Verified
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Condition and Category */}
                      {listing.condition && (
                        <div className="text-xs text-muted-foreground mb-1">
                          Condition: <span className="capitalize">{listing.condition}</span>
                        </div>
                      )}
                      
                      {/* Description */}
                      {listing.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {listing.description}
                        </p>
                      )}
                      
                      {/* Badges */}
                      {listing.owner.badges && listing.owner.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {listing.owner.badges.map((badge, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-primary">{listing.price}</div>
                        <div className="text-xs text-muted-foreground">
                          Trust Score: {listing.owner.trustScore}% • {listing.owner.rating}⭐
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {listing.owner.pastTrades} past trades
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMessage(listing.id)}
                        className="flex-1 gap-1"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequest(listing)}
                        className="flex-1 gap-1"
                      >
                        <Send className="h-4 w-4" />
                        Request
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReport(listing.id)}
                        className="gap-1"
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
