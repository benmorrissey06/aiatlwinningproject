import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
  children?: ReactNode
}

export function FeatureCard({ icon: Icon, title, description, className, children }: FeatureCardProps) {
  return (
    <div
      className={cn(
        'card glass shadow-soft hover:shadow-pop transition-all duration-200 ease-spring-snappy hover:-translate-y-0.5 hover:rotate-[0.4deg] p-6 md:p-8 space-y-4 will-change-transform',
        className
      )}
    >
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-500 shadow-inner shadow-white/20">
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl md:text-2xl font-semibold text-foreground">{title}</h3>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {children ? <div className="pt-2">{children}</div> : null}
    </div>
  )
}

export default FeatureCard

