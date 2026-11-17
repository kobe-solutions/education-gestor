import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import type { LucideIcon } from 'lucide-react'

export interface TaskLinkItem {
  to: string
  title: string
  description: string
  icon: LucideIcon
  action: string
}

export function TaskSection({ title, description, items }: {
  title: string
  description?: string
  items: TaskLinkItem[]
}) {
  return (
    <section className="space-y-2" aria-labelledby={`task-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <div className="pb-1">
        <h2 id={`task-${title.replace(/\s+/g, '-').toLowerCase()}`} className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="divide-y rounded-xl border bg-card px-4">
        {items.map(({ to, title: itemTitle, description: itemDescription, icon: Icon, action }) => (
          <Link key={to} to={to} className="group flex min-h-[76px] items-center gap-3 py-3 outline-offset-4 sm:gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <Icon size={19} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground group-hover:text-primary">{itemTitle}</span>
              <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">{itemDescription}</span>
            </span>
            <span className="hidden items-center gap-2 text-sm font-semibold text-primary sm:flex">
              {action}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
            <ArrowRight size={17} className="shrink-0 text-primary sm:hidden" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}
