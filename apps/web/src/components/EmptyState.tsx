import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 48, height: 48, background: 'hsl(var(--accent))', color: 'hsl(var(--muted-foreground))' }}
      >
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
          {title}
        </p>
        {description && (
          <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
