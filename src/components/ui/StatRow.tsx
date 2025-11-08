import type { ReactNode } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface StatRowProps {
  avatars: { src?: string; alt?: string; fallback?: string }[]
  text: ReactNode
  className?: string
  maxVisible?: number
}

export function StatRow({ avatars, text, className, maxVisible = 4 }: StatRowProps) {
  const visible = avatars.slice(0, maxVisible)
  const remaining = avatars.length - visible.length

  return (
    <div className={cn('flex items-center gap-3 text-sm text-muted-foreground', className)}>
      <div className="flex -space-x-2">
        {visible.map((avatar, index) => (
          <Avatar
            key={`${avatar.src ?? avatar.fallback ?? 'avatar'}-${index}`}
            className="h-9 w-9 border border-white/40 bg-background shadow-sm"
          >
            {avatar.src ? <AvatarImage src={avatar.src} alt={avatar.alt ?? ''} /> : null}
            <AvatarFallback>{avatar.fallback ?? 'FR'}</AvatarFallback>
          </Avatar>
        ))}
        {remaining > 0 ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-muted/80 text-xs font-semibold text-muted-foreground">
            +{remaining}
          </div>
        ) : null}
      </div>
      <span>{text}</span>
    </div>
  )
}

export default StatRow

