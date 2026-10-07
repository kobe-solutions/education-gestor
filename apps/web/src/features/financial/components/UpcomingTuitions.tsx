import { Link } from 'react-router'
import { useDashboard, isAdminDashboard } from '../../dashboard/hooks/useDashboard'
import { TuitionStatusBadge } from './TuitionStatusBadge'
import { fmtBRL, formatDateBR } from '../../../lib/format'

export function UpcomingTuitions() {
  const { data, isLoading, isError } = useDashboard()
  const upcomingTuitions = data && !isAdminDashboard(data) ? data.upcomingTuitions : []

  return (
    <section className="space-y-4" aria-labelledby="upcoming-tuitions-title">
      <div>
        <h2 id="upcoming-tuitions-title" className="font-bold text-base">Mensalidades vencendo nos próximos 7 dias</h2>
        <p className="text-xs mt-0.5 text-muted-foreground">Acompanhe alunos com vencimento próximo</p>
      </div>
      {isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">Carregando mensalidades...</p>
      ) : isError ? (
        <p role="alert" className="text-sm text-muted-foreground">Não foi possível carregar os próximos vencimentos.</p>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {upcomingTuitions.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Nenhuma mensalidade vencendo nos próximos 7 dias</p>
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
      )}
    </section>
  )
}
