import { Link } from 'react-router'
import { Users, GraduationCap, BookOpen, AlertCircle, CheckCircle2, Clock, Building2, School } from 'lucide-react'
import { useDashboard, isAdminDashboard } from '../features/dashboard/hooks/useDashboard'
import { useAuth } from '../contexts/AuthContext'
import { useSchoolContext } from '../contexts/SchoolContext'
import { TuitionStatusBadge } from '../features/financial/components/TuitionStatusBadge'
import { PageHead } from '../components/PageHead'
import { MetricCard } from '../components/MetricCard'
import { Surface } from '../components/Surface'
import { Skeleton } from '../components/ui/skeleton'
import { Button } from '../components/ui/button'

function fmtBRL(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function SkeletonCards({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl"
          style={{ background: '#fff', border: '1px solid var(--iris-slate-200)' }}
        >
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const { payload } = useAuth()
  const { activeSchoolId } = useSchoolContext()
  const { data, isLoading } = useDashboard()

  const isSecretariaWithoutSchool = payload?.role === 'secretaria' && !activeSchoolId

  if (isSecretariaWithoutSchool) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <School className="h-12 w-12" style={{ color: 'var(--iris-slate-300)' }} />
        <div className="text-center">
          <p className="font-semibold" style={{ color: 'var(--iris-blue-900)' }}>Nenhuma escola selecionada</p>
          <p className="text-sm mt-1" style={{ color: 'var(--iris-slate-500)' }}>
            Selecione uma escola para visualizar o painel
          </p>
        </div>
        <Link to="/my-schools">
          <Button size="sm">Ir para Minhas Escolas</Button>
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-6 w-32 mb-1" />
          <Skeleton className="h-4 w-56" />
        </div>
        <SkeletonCards count={payload?.role === 'admin' ? 2 : 6} />
      </div>
    )
  }

  if (!data) return null

  if (isAdminDashboard(data)) {
    return (
      <div className="space-y-6">
        <PageHead title="Painel" subtitle="Visão geral da plataforma" />
        <div className="grid grid-cols-2 gap-4 max-w-xs">
          <MetricCard icon={Building2} label="Secretarias" value={data.secretariasCount} color="#185FA5" />
          <MetricCard icon={School}    label="Escolas"     value={data.schoolsCount}     color="#378ADD" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Painel"
        subtitle={`Visão geral da escola — ${new Date().getFullYear()}`}
        actions={
          <Button variant="outline" size="sm">Exportar relatório</Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard icon={Users}         label="Alunos"     value={data.studentsCount}          color="#185FA5" />
        <MetricCard icon={GraduationCap} label="Professores" value={data.teachersCount}         color="#378ADD" />
        <MetricCard icon={BookOpen}      label="Turmas"     value={data.classesCount}            color="#042C53" />
        <MetricCard icon={Clock}         label="Pendentes"  value={data.tuitions.pending.count}  sub={fmtBRL(data.tuitions.pending.total)}  color="#B45309" />
        <MetricCard icon={CheckCircle2}  label="Pagas"      value={data.tuitions.paid.count}     sub={fmtBRL(data.tuitions.paid.total)}     color="#15803D" />
        <MetricCard icon={AlertCircle}   label="Atrasadas"  value={data.tuitions.overdue.count}  sub={fmtBRL(data.tuitions.overdue.total)}  color="#B91C1C" />
      </div>

      {/* Tabela de vencimentos próximos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--iris-blue-900)' }}>
              Mensalidades vencendo nos próximos 7 dias
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--iris-slate-500)' }}>
              Acompanhe alunos com vencimento próximo.
            </p>
          </div>
          <Link to="/financial">
            <Button variant="outline" size="sm">Ver todas</Button>
          </Link>
        </div>

        <Surface>
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Turma</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.upcomingTuitions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8"
                    style={{ color: 'var(--iris-slate-500)', fontSize: 13 }}
                  >
                    Nenhuma mensalidade vencendo nos próximos 7 dias
                  </td>
                </tr>
              ) : (
                data.upcomingTuitions.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link
                        to={`/students/${t.studentId}`}
                        className="font-semibold hover:underline"
                        style={{ color: 'var(--iris-blue-900)' }}
                      >
                        {t.studentName}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--iris-slate-500)' }}>—</td>
                    <td>{new Date(t.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                    <td>{fmtBRL(t.amount)}</td>
                    <td><TuitionStatusBadge status={t.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Surface>
      </div>
    </div>
  )
}
