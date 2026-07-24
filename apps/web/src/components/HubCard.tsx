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
        className="flex flex-col gap-3 p-4 md:gap-4 md:p-5 rounded-xl opacity-50 cursor-not-allowed"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}
      >
        <div
          className="flex items-center justify-center rounded-md shrink-0"
          style={{ width: 36, height: 36, background: 'rgba(79,70,229,0.10)' }}
        >
          <Icon size={18} style={{ color: '#4F46E5' }} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--primary))' }}>{title}</h3>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>{description}</p>
        </div>
        <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Em breve</span>
      </div>
    )
  }

  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 p-4 md:gap-4 md:p-5 rounded-xl transition-all duration-180"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = '#4F46E5'
        el.style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'hsl(var(--border))'
        el.style.boxShadow = 'var(--shadow-sm)'
      }}
    >
      <div
        className="flex items-center justify-center rounded-md shrink-0"
        style={{ width: 36, height: 36, background: 'rgba(79,70,229,0.10)' }}
      >
        <Icon size={18} style={{ color: '#4F46E5' }} />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--primary))' }}>{title}</h3>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#4F46E5' }}>
        Acessar
        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-120" />
      </div>
    </Link>
  )
}
