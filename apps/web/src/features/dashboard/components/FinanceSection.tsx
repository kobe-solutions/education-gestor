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

  const pendingCount = tuitions.pending.count + tuitions.overdue.count
  const pendingTotal = (Math.round(Number(tuitions.pending.total) * 100) + Math.round(Number(tuitions.overdue.total) * 100)) / 100
  const totalCount = pendingCount + tuitions.paid.count
  const totalAmount = (Math.round(pendingTotal * 100) + Math.round(Number(tuitions.paid.total) * 100)) / 100

  return (
    <section className="space-y-4">
      <SectionHeader title="Financeiro" subtitle="Pendentes incluem mensalidades atrasadas" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <DashMetric
          icon={TrendingUp}
          value={totalCount}
          label="Total de mensalidades"
          sub={fmtBRL(totalAmount)}
          tone="indigo"
          to="/financial"
        />
        <DashMetric
          icon={CheckCircle2}
          value={tuitions.paid.count}
          label="Total de mensalidades pagas"
          sub={fmtBRL(tuitions.paid.total)}
          tone="emerald"
          to="/financial?status=paid"
        />
        <DashMetric
          icon={Clock}
          value={pendingCount}
          label="Total de mensalidades pendentes"
          sub={fmtBRL(pendingTotal)}
          tone="amber"
          to="/financial"
        />
      </div>
    </section>
  )
}
