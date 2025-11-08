import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const NOISE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAFJQJ/8mb7VQAAAABJRU5ErkJggg=='

interface NoiseProps extends HTMLAttributes<HTMLDivElement> {
  opacity?: number
}

export function Noise({ className, opacity = 0.08, ...props }: NoiseProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 mix-blend-soft-light', className)}
      style={{
        backgroundImage: `url(${NOISE_DATA_URL})`,
        backgroundRepeat: 'repeat',
        opacity
      }}
      {...props}
    />
  )
}

export default Noise

