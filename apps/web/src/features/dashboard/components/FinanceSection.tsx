import { TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { DashMetric } from './DashMetric'
import { SectionHeader } from './SectionHeader'
import { fmtBRL } from '../../../lib/format'
import type { SchoolDashboard } from '../hooks/useDashboard'

interface FinanceSectionProps {
  tuitions: SchoolDashboard['tuitions']
  blocked: boolean
}

export function FinanceSection({ tuitions, blocked }: FinanceSectionProps) {
  if (blocked) return null

  return (
    <section className="space-y-4">
      <SectionHeader title="Financeiro" subtitle="Status das mensalidades" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <DashMetric
          icon={TrendingUp}
          value={fmtBRL(tuitions.total.total)}
          label="Total"
          sub={`${tuitions.total.count} mensalidades`}
          tone="indigo"
          to="/financial"
        />
        <DashMetric
          icon={CheckCircle2}
          value={fmtBRL(tuitions.paid.total)}
          label="Pagas"
          sub={`${tuitions.paid.count} mensalidades`}
          tone="emerald"
          to="/financial?status=paid"
        />
        <DashMetric
          icon={Clock}
          value={fmtBRL(tuitions.pending.total)}
          label="Pendentes"
          sub={`${tuitions.pending.count} mensalidades`}
          tone="amber"
          to="/financial?status=pending"
        />
      </div>
    </section>
  )
}
