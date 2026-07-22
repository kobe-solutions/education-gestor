import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  sub?: string
  color?: string
}

export function MetricCard({ icon: Icon, label, value, sub, color = '#185FA5' }: MetricCardProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 md:gap-4 md:p-4 rounded-xl"
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--iris-slate-200)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="flex items-center justify-center shrink-0 rounded-lg"
        style={{
          width: 36,
          height: 36,
          background: color,
        }}
      >
        <Icon className="text-white" size={16} />
      </div>
      <div className="min-w-0">
        <div
          className="font-bold leading-tight tabular-nums"
          style={{ fontSize: 20, color: 'var(--iris-blue-900)', letterSpacing: '-0.02em' }}
        >
          {value}
        </div>
        <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--iris-slate-500)' }}>
          {label}
        </div>
        {sub && (
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--iris-slate-500)' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}
