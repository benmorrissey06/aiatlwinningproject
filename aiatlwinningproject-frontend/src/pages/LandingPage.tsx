import { motion } from 'framer-motion'
import { Zap, MapPin, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-block mb-6"
          >
            <Zap className="h-16 w-16 text-primary mx-auto" />
          </motion.div>
          
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Flash Request
          </h2>
          
          <p className="text-xl text-muted-foreground mb-4">
            AI-first, hyperlocal campus marketplace
          </p>
          
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Post urgent needs (textbooks, medicine, clothes) and get instant responses 
            from nearby peers via predictive Smart-Ping technology.
          </p>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <div className="p-6 rounded-lg border border-border bg-card">
              <Zap className="h-8 w-8 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Flash Requests</h3>
              <p className="text-sm text-muted-foreground">
                Post your urgent needs instantly and get quick responses
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-border bg-card">
              <MapPin className="h-8 w-8 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Hyperlocal</h3>
              <p className="text-sm text-muted-foreground">
                Connect with peers in your campus community
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-border bg-card">
              <Bell className="h-8 w-8 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Smart-Ping</h3>
              <p className="text-sm text-muted-foreground">
                Predictive notifications for relevant requests
              </p>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-4 justify-center"
          >
            <Button size="lg" className="text-lg px-8">
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Learn More
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

