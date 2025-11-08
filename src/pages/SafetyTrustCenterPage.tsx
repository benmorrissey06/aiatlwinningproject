import { motion } from 'framer-motion'
import { 
  Shield, 
  Mail, 
  Lock, 
  Bot, 
  Users, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Ban
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const safetySections = [
  {
    icon: Shield,
    title: 'Verification',
    description: 'All users must verify their identity using their school email address. Optional photo ID verification adds an extra layer of security.',
    details: [
      'School email verification required',
      'Optional photo ID verification',
      'Campus-verified student status',
    ],
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: Lock,
    title: 'Private Communications',
    description: 'Your personal information stays private. We never share your phone number, address, or other sensitive data with other users.',
    details: [
      'No personal info sharing',
      'Secure messaging system',
      'Privacy-first approach',
    ],
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    icon: Bot,
    title: 'AI Moderation + Human Review',
    description: 'Our AI system automatically flags suspicious activity, and our human moderators review reported content to ensure a safe community.',
    details: [
      'AI-powered content monitoring',
      'Human moderation team',
      '24/7 safety oversight',
    ],
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    icon: MapPin,
    title: 'Meet-up Guidance',
    description: 'Always meet in public, well-lit locations during daylight hours. Use our check-in feature to confirm your location before exchanges.',
    details: [
      'Public locations only',
      'Daylight meet-ups recommended',
      'Check-in confirmation required',
    ],
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
  },
  {
    icon: AlertTriangle,
    title: 'Emergency Support',
    description: 'If you feel unsafe or encounter an emergency during an exchange, contact campus security immediately. We provide direct reporting options.',
    details: [
      'Campus security contact',
      'Emergency reporting system',
      '24/7 support available',
    ],
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
]

export function SafetyTrustCenterPage() {
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
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl xl:text-5xl font-bold mb-4">Safety & Trust Center</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your safety is our top priority. Learn about our security measures, 
          verification processes, and community guidelines.
        </p>
      </motion.div>

      {/* Safety Sections */}
      <div className="space-y-6 mb-12">
        {safetySections.map((section, index) => {
          const Icon = section.icon
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                "rounded-2xl border border-border p-6 shadow-md",
                section.bgColor
              )}
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className={cn(
                    "w-16 h-16 rounded-full bg-background flex items-center justify-center",
                    section.bgColor
                  )}>
                    <Icon className={cn("h-8 w-8", section.color)} />
                  </div>
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{section.title}</h2>
                  <p className="text-muted-foreground mb-4">{section.description}</p>
                  
                  <ul className="space-y-2">
                    {section.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className={cn("h-5 w-5 mt-0.5 flex-shrink-0", section.color)} />
                        <span className="text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Links Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-md"
      >
        <h2 className="text-2xl xl:text-3xl font-bold mb-4">Important Resources</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            to="/terms"
            className="flex items-center gap-3 p-4 rounded-2xl border border-border hover:bg-accent transition-colors shadow-sm"
          >
            <div className="p-2 rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Terms of Service</h3>
              <p className="text-sm text-muted-foreground">
                Read our terms and conditions
              </p>
            </div>
          </Link>

          <Link
            to="/prohibited-items"
            className="flex items-center gap-3 p-4 rounded-2xl border border-border hover:bg-accent transition-colors shadow-sm"
          >
            <div className="p-2 rounded-full bg-destructive/10">
              <Ban className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold">Prohibited Items</h3>
              <p className="text-sm text-muted-foreground">
                View list of prohibited items
              </p>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Emergency Contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="mt-8 rounded-2xl border-2 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-6 shadow-md"
      >
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Emergency Contact
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200 mb-4">
              If you're in immediate danger or need emergency assistance, contact campus security:
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Campus Security: (617) 555-0123
              </p>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Emergency: 911
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
