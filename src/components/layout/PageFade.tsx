import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const baseVariants = {
  hidden: { opacity: 0, y: 18 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 }
}

interface PageFadeProps {
  children: ReactNode
  className?: string
}

export function PageFade({ children, className }: PageFadeProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={
        prefersReducedMotion
          ? { hidden: { opacity: 0 }, enter: { opacity: 1 }, exit: { opacity: 0 } }
          : baseVariants
      }
      transition={{ duration: prefersReducedMotion ? 0.15 : 0.28, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default PageFade

