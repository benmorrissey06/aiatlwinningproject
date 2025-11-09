import type { HTMLAttributes } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BlobProps extends HTMLAttributes<HTMLDivElement> {
  colorClassName?: string
  size?: number
}

export function Blob({ className, colorClassName = 'from-indigo-500/30 via-blue-500/20 to-cyan-400/30', size = 520, ...props }: BlobProps) {
  const prefersReducedMotion = useReducedMotion()

  const baseStyle = {
    width: size,
    height: size,
    marginLeft: -(size / 2),
    marginTop: -(size / 2)
  }

  if (prefersReducedMotion) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute rounded-full bg-gradient-to-br blur-3xl opacity-60',
          colorClassName,
          className
        )}
        style={baseStyle}
        {...props}
      />
    )
  }

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute rounded-full bg-gradient-to-br blur-3xl opacity-70',
        colorClassName,
        className
      )}
      style={baseStyle}
      animate={{
        x: [0, 30, -45, 0],
        y: [0, -25, 35, 0],
        scale: [1, 1.1, 0.95, 1]
      }}
      transition={{
        duration: 22,
        repeat: Infinity,
        ease: 'linear'
      }}
      {...props}
    />
  )
}

export default Blob

