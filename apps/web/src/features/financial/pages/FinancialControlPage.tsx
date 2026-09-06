import { TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { useDashboard } from '../../dashboard/hooks/useDashboard'
import { useFinancialBlocked } from '../../../lib/useFinancialBlocked'
import { useFinancialVisibility } from '../../../contexts/FinancialVisibilityContext'
import { DashMetric } from '../../dashboard/components/DashMetric'
import { SectionHeader } from '../../dashboard/components/SectionHeader'
import { UpcomingTuitionsTable } from '../components/UpcomingTuitionsTable'
import { fmtBRL } from '../../../lib/format'
import { Skeleton } from '../../../components/ui/skeleton'

export function FinancialControlPage() {
  const { data, isLoading } = useDashboard()
  const { blocked: financialBlocked } = useFinancialBlocked()
  const { hideFinancialData } = useFinancialVisibility()

  const isHidden = financialBlocked || hideFinancialData

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-48 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            >
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-7 w-20 rounded-sm" />
              <Skeleton className="h-3 w-24 rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data || !('upcomingTuitions' in data)) return null

  const tuitions = data.tuitions

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="font-bold leading-tight"
          style={{ fontSize: 22, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}
        >
          Controle Financeiro
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Acompanhamento de mensalidades — {new Date().getFullYear()}
        </p>
      </div>

      {!isHidden && (
        <section className="space-y-4">
          <SectionHeader title="Resumo" subtitle="Visão geral das mensalidades" />
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
      )}

      {!isHidden && (
        <section className="space-y-4">
          <SectionHeader
            title="Mensalidades vencendo nos próximos 7 dias"
            subtitle="Acompanhe alunos com vencimento próximo"
          />
          <UpcomingTuitionsTable upcomingTuitions={data.upcomingTuitions} />
        </section>
      )}
    </div>
  )
}
