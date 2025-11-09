import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'outline'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  icon?: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-muted/70 text-muted-foreground',
  primary: 'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 text-white shadow-sm shadow-indigo-500/20',
  accent: 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm shadow-rose-500/20',
  success: 'bg-success-500/15 text-success-600 dark:text-success-400 border border-success-500/20',
  warning: 'bg-warning-500/15 text-warning-600 dark:text-warning-400 border border-warning-500/20',
  outline: 'bg-transparent border border-border text-muted-foreground'
}

export function Badge({ className, variant = 'default', icon, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'badge pill select-none whitespace-nowrap',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {icon ? <span className="text-sm">{icon}</span> : null}
      {children}
    </span>
  )
}

export default Badge

