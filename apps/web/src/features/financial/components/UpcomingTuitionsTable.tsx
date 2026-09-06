import { Link } from 'react-router'
import { CalendarClock } from 'lucide-react'
import { fmtBRL, formatDateBR } from '../../../lib/format'
import { TuitionStatusBadge } from './TuitionStatusBadge'
import { EmptyState } from '../../../components/EmptyState'
import type { UpcomingTuition } from '../../dashboard/hooks/useDashboard'

interface UpcomingTuitionsTableProps {
  upcomingTuitions: UpcomingTuition[]
}

export function UpcomingTuitionsTable({ upcomingTuitions }: UpcomingTuitionsTableProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {upcomingTuitions.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nenhuma mensalidade vencendo nos próximos 7 dias"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Aluno', 'Vencimento', 'Valor', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {upcomingTuitions.map((t) => (
                <tr
                  key={t.id}
                  className="transition-colors duration-150 hover:bg-accent"
                  style={{ borderBottom: '1px solid hsl(var(--border))' }}
                >
                  <td className="px-5 py-3">
                    <Link
                      to={`/students/${t.studentId}`}
                      className="font-semibold hover:underline"
                      style={{ color: 'hsl(var(--foreground))' }}
                    >
                      {t.studentName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 tabular-nums" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {formatDateBR(t.dueDate)}
                  </td>
                  <td className="px-5 py-3 font-semibold tabular-nums" style={{ color: 'hsl(var(--foreground))' }}>
                    {fmtBRL(t.amount)}
                  </td>
                  <td className="px-5 py-3">
                    <TuitionStatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
