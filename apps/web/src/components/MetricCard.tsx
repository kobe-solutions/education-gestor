import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  sub?: string
  color?: string
}

export function MetricCard({ icon: Icon, label, value, sub, color = '#4F46E5' }: MetricCardProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm md:gap-4 md:p-4"
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-md"
        style={{
          background: color,
        }}
      >
        <Icon className="text-white" size={16} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold leading-tight tracking-tight tabular-nums text-primary">
          {value}
        </div>
        <div className="mt-0.5 text-xs font-medium text-muted-foreground">
          {label}
        </div>
        {sub && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}
