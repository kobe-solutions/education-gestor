import { cn } from '@/lib/utils'

interface SurfaceProps {
  children: React.ReactNode
  className?: string
}

export function Surface({ children, className }: SurfaceProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card shadow-sm', className)}>
      {children}
    </div>
  )
}
