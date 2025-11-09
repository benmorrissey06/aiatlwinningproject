import { motion, AnimatePresence } from 'framer-motion'
import { useCampus } from './CampusContext'

export function CampusHeader() {
  const { campus } = useCampus()

  return (
    <div className="w-full border-b border-white/10 bg-white/50 dark:bg-slate-900/35 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center py-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-500/50 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success-500" />
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={campus}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="text-center tracking-wide"
              >
                📍 {campus} Network
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

