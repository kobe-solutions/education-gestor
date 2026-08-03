import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  to?: string
}

export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  if (!items.length) return null
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-xs', className)}>
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1">
          {idx > 0 && <ChevronRight className="h-3 w-3" style={{ color: 'hsl(var(--muted-foreground))' }} />}
          {item.to ? (
            <Link
              to={item.to}
              className="hover:underline transition-colors"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ color: 'hsl(var(--foreground))' }} className="font-medium">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
