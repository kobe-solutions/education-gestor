import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface HubCardProps {
  to: string
  icon: LucideIcon
  title: string
  description: string
  disabled?: boolean
}

export function HubCard({ to, icon: Icon, title, description, disabled }: HubCardProps) {
  if (disabled) {
    return (
      <div
        className="flex cursor-not-allowed flex-col gap-3 rounded-xl border border-border bg-card p-4 opacity-50 shadow-sm md:gap-4 md:p-5"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon size={18} aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-primary">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">Em breve</span>
      </div>
    )
  }

  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-180 hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:gap-4 md:p-5"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon size={18} aria-hidden="true" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs font-semibold text-primary">
        Acessar
        <ArrowRight size={12} aria-hidden="true" className="transition-transform duration-120 group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
