import { Link } from 'react-router'
import { TONE_CONFIG, type ToneKey } from '../../../lib/colors'

interface DashMetricProps {
  icon: React.ElementType
  value: number | string
  label: string
  sub?: string
  tone: ToneKey
  to?: string
}

export function DashMetric({ icon: Icon, value, label, sub, tone, to }: DashMetricProps) {
  const t = TONE_CONFIG[tone]
  const content = (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl transition-all duration-200
        hover:shadow-(--shadow-md) hover:-translate-y-0.5"
      style={{
        background: 'hsl(var(--card))',
        border: `1px solid ${t.borderColor}`,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-md shrink-0"
        style={{ width: 36, height: 36, background: t.iconBg, color: t.iconColor }}
      >
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <div>
        <div
          className="text-2xl font-extrabold tabular-nums leading-none tracking-tight"
          style={{ color: t.valueColor }}
        >
          {value}
        </div>
        <div
          className="text-[11px] font-semibold uppercase tracking-wider mt-1.5 truncate"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          {label}
        </div>
        {sub && (
          <div className="text-xs font-medium mt-1 tabular-nums" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block cursor-pointer">
        {content}
      </Link>
    )
  }

  return content
}
