import { Link, Navigate } from 'react-router'
import {
  Users,
  GraduationCap,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  School,
  CalendarClock,
  ArrowRight,
  Activity,
  UserCheck,
  UserX,
  ShieldCheck,
  TrendingUp,
  Presentation,
  Download,
} from 'lucide-react'
import { useDashboard, isAdminDashboard, type DashboardData, type AdminDashboard, type SchoolDashboard } from '../features/dashboard/hooks/useDashboard'
import { useAuth } from '../contexts/AuthContext'
import { useSchoolContext } from '../contexts/SchoolContext'
import { useFinancialVisibility } from '../contexts/FinancialVisibilityContext'
import { useFinancialBlocked } from '../lib/useFinancialBlocked'
import { fmtBRL } from '../lib/format'
import { TONE_CONFIG, type ToneKey } from '../lib/colors'
import { Skeleton } from '../components/ui/skeleton'
import { Button } from '../components/ui/button'
import { EmptyState } from '../components/EmptyState'
import { DashMetric } from '../features/dashboard/components/DashMetric'
import { SectionHeader } from '../features/dashboard/components/SectionHeader'
import { FinanceSection } from '../features/dashboard/components/FinanceSection'
import { DemandSection } from '../features/dashboard/components/DemandSection'

// ── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton({ cardCount }: { cardCount: number }) {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-28 mb-2 rounded-md" />
        <Skeleton className="h-4 w-48 rounded-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: cardCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          >
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-7 w-14 rounded-sm" />
            <Skeleton className="h-3 w-16 rounded-sm" />
          </div>
        ))}
      </div>
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <Skeleton className="h-5 w-64 rounded-sm" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

function exportDashboardReport(data: DashboardData) {
  const isAdmin = isAdminDashboard(data)
  const rows: string[][] = []
  const headers: string[] = []

  if (isAdmin) {
    const d = data as AdminDashboard
    headers.push('Métrica', 'Valor')
    rows.push(['Secretarias', String(d.secretariasCount)])
    rows.push(['Secretarias Ativas', String(d.secretariasActive)])
    rows.push(['Escolas', String(d.schoolsCount)])
    rows.push(['Alunos', String(d.studentsCount)])
    rows.push(['Professores', String(d.teachersCount)])
    rows.push(['Turmas', String(d.classesCount)])
    rows.push(['Mensalidades Pendentes', `${d.tuitions.pending.count} (${fmtBRL(d.tuitions.pending.total)})`])
    rows.push(['Mensalidades Pagas', `${d.tuitions.paid.count} (${fmtBRL(d.tuitions.paid.total)})`])
    rows.push(['Mensalidades Atrasadas', `${d.tuitions.overdue.count} (${fmtBRL(d.tuitions.overdue.total)})`])
  } else {
    const d = data as SchoolDashboard
    headers.push('Métrica', 'Valor')
    rows.push(['Alunos', String(d.studentsCount)])
    rows.push(['Professores', String(d.teachersCount)])
    rows.push(['Turmas', String(d.classesCount)])
    rows.push(['Alunos Ativos', String(d.studentsByStatus.active)])
    rows.push(['Alunos Inativos', String(d.studentsByStatus.inactive)])
    rows.push(['Prof. Ativos', String(d.teachersByStatus.ativo)])
    rows.push(['Mensalidades Pendentes', `${d.tuitions.pending.count} (${fmtBRL(d.tuitions.pending.total)})`])
    rows.push(['Mensalidades Pagas', `${d.tuitions.paid.count} (${fmtBRL(d.tuitions.paid.total)})`])
    rows.push(['Mensalidades Atrasadas', `${d.tuitions.overdue.count} (${fmtBRL(d.tuitions.overdue.total)})`])
    rows.push(['Taxa de Presença', d.attendanceRate != null ? `${d.attendanceRate}%` : '—'])
    rows.push(['Média Geral', d.academicPerformance.average ?? '—'])
    rows.push(['Taxa de Aprovação', d.academicPerformance.passRate != null ? `${d.academicPerformance.passRate}%` : '—'])
  }

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-${isAdmin ? 'admin' : 'escola'}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Admin dashboard ──────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Criou',
  UPDATE: 'Atualizou',
  DELETE: 'Excluiu',
  PAY: 'Pagou',
}

const ENTITY_LABELS: Record<string, string> = {
  student: 'Aluno',
  teacher: 'Professor',
  school: 'Escola',
  secretaria: 'Secretaria',
  schoolClass: 'Turma',
  tuition: 'Mensalidade',
  subject: 'Disciplina',
  academicYear: 'Ano Letivo',
  grade: 'Nota',
  attendance: 'Presença',
}

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    CREATE: { bg: 'hsl(var(--badge-success-bg))', fg: 'hsl(var(--badge-success-fg))' },
    UPDATE: { bg: 'hsl(var(--primary) / 0.1)', fg: 'hsl(var(--primary))' },
    DELETE: { bg: 'hsl(var(--badge-danger-bg))', fg: 'hsl(var(--badge-danger-fg))' },
    PAY: { bg: 'hsl(var(--badge-warning-bg))', fg: 'hsl(var(--badge-warning-fg))' },
  }
  const c = colors[action] ?? { bg: 'hsl(var(--border))', fg: 'hsl(var(--muted-foreground))' }
  return (
    <span
      className="inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      {ACTION_LABELS[action] ?? action}
    </span>
  )
}

function AdminDashboard({ data }: { data: import('../features/dashboard/hooks/useDashboard').AdminDashboard }) {
  const totalStudents = data.studentsByStatus.active + data.studentsByStatus.inactive + data.studentsByStatus.transferred + data.studentsByStatus.cancelled
  const { hideFinancialData } = useFinancialVisibility()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="font-bold leading-tight"
          style={{ fontSize: 22, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}
        >
          Painel Administrativo
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Visão geral da plataforma — {new Date().getFullYear()}
        </p>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader title="Indicadores da plataforma" />
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashMetric
            icon={Building2}
            value={data.secretariasCount}
            label="Secretarias"
            sub={`${data.secretariasActive} ativas`}
            tone="indigo"
          />
          <DashMetric
            icon={School}
            value={data.schoolsCount}
            label="Escolas"
            tone="violet"
          />
          <DashMetric
            icon={Users}
            value={data.studentsCount}
            label="Alunos"
            sub={`${data.studentsByStatus.active} ativos`}
            tone="emerald"
          />
          <DashMetric
            icon={GraduationCap}
            value={data.teachersCount}
            label="Professores"
            sub={`${data.teachersByStatus.ativo} ativos`}
            tone="slate"
          />
          <DashMetric
            icon={BookOpen}
            value={data.classesCount}
            label="Turmas"
            tone="indigo"
          />
          {!hideFinancialData && (
            <DashMetric
              icon={TrendingUp}
              value={fmtBRL(data.tuitions.paid.total)}
              label="Receita total"
              sub={`${data.tuitions.paid.count} pagas`}
              tone="emerald"
            />
          )}
        </div>
      </section>

      {!hideFinancialData && (
        <section className="space-y-4">
          <SectionHeader title="Financeiro" subtitle="Mensalidades de todas as escolas" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <DashMetric
              icon={TrendingUp}
              value={fmtBRL(data.tuitions.total.total)}
              label="Total"
              sub={`${data.tuitions.total.count} mensalidades`}
              tone="indigo"
            />
            <DashMetric
              icon={CheckCircle2}
              value={fmtBRL(data.tuitions.paid.total)}
              label="Pagas"
              sub={`${data.tuitions.paid.count} mensalidades`}
              tone="emerald"
            />
            <DashMetric
              icon={Clock}
              value={fmtBRL(data.tuitions.pending.total)}
              label="Pendentes"
              sub={`${data.tuitions.pending.count} mensalidades`}
              tone="amber"
            />
          </div>
        </section>
      )}

      {/* ── Escolas com mais alunos ────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          title="Escolas com mais alunos"
          action={
            <Link to="/schools" className="shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5">
                Ver todas
                <ArrowRight size={13} />
              </Button>
            </Link>
          }
        />
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {data.topSchools.length === 0 ? (
            <EmptyState icon={School} title="Nenhuma escola cadastrada" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    {['Escola', 'Alunos'].map((h) => (
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
                  {data.topSchools.map((s) => (
                    <tr
                      key={s.id}
                      className="transition-colors duration-150 hover:bg-accent"
                      style={{ borderBottom: '1px solid hsl(var(--border))' }}
                    >
                      <td className="px-5 py-3">
                        <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                          {s.name}
                        </span>
                      </td>
                      <td className="px-5 py-3 tabular-nums font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                        {s.studentCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── Atividade recente ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          title="Atividade recente"
          subtitle="Últimas ações realizadas na plataforma"
          action={
            <Link to="/admin/activity" className="shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5">
                Ver tudo
                <ArrowRight size={13} />
              </Button>
            </Link>
          }
        />
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {data.recentActivity.length === 0 ? (
            <EmptyState icon={Activity} title="Nenhuma atividade registrada" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    {['Data', 'Usuário', 'Ação', 'Entidade'].map((h) => (
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
                  {data.recentActivity.map((a) => (
                    <tr
                      key={a.id}
                      className="transition-colors duration-150 hover:bg-accent"
                      style={{ borderBottom: '1px solid hsl(var(--border))' }}
                    >
                      <td className="px-5 py-3 tabular-nums text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {new Date(a.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                          {a.userId.slice(0, 8)}…
                        </span>
                        <span
                          className="ml-2 inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{ background: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                        >
                          {a.userRole}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <ActionBadge action={a.action} />
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {ENTITY_LABELS[a.entity] ?? a.entity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// ── No school selected ───────────────────────────────────────────────────────

function NoSchoolView() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 64, height: 64, background: 'hsl(var(--accent))', color: 'hsl(var(--muted-foreground))' }}
      >
        <School size={28} />
      </div>
      <div className="text-center">
        <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          Nenhuma escola selecionada
        </p>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Selecione uma escola para visualizar o painel
        </p>
      </div>
      <Link to="/my-schools">
        <Button size="sm">Ir para Minhas Escolas</Button>
      </Link>
    </div>
  )
}

// ── Main dashboard ───────────────────────────────────────────────────────────

function SchoolDashboard({ data }: { data: import('../features/dashboard/hooks/useDashboard').SchoolDashboard }) {
  const { payload } = useAuth()
  const { blocked: financialBlocked } = useFinancialBlocked()
  const isProfessor = payload?.role === 'professor'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-3">
        <div>
          <h1
            className="font-bold leading-tight"
            style={{ fontSize: 22, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}
          >
            Painel
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Visão geral da escola — {new Date().getFullYear()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isProfessor && (
            <Link to="/professor">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Presentation size={14} />
                Meu Painel
              </Button>
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={() => exportDashboardReport(data)}>
            <Download size={14} className="mr-1" />
            Exportar relatório
          </Button>
        </div>
      </div>

      {/* ── Visão geral ──────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader title="Visão geral" subtitle="Dados acadêmicos e estrutura" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          <DashMetric icon={Users} value={data.studentsCount} label="Alunos" tone="indigo" />
          <DashMetric icon={GraduationCap} value={data.teachersCount} label="Professores" tone="violet" />
          <DashMetric icon={BookOpen} value={data.classesCount} label="Turmas" tone="slate" />
        </div>
      </section>

      {/* ── Rendimento acadêmico ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          title="Rendimento acadêmico"
          subtitle="Frequência e desempenho escolar"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <DashMetric
            icon={CalendarClock}
            value={data.attendanceRate !== null ? `${data.attendanceRate}%` : '—'}
            label="Frequência (30 dias)"
            sub={data.attendanceRate !== null ? undefined : 'Sem registros'}
            tone="amber"
          />
          <DashMetric
            icon={TrendingUp}
            value={data.academicPerformance.average ?? '—'}
            label="Média geral"
            sub={data.academicPerformance.average ? `${data.academicPerformance.totalGrades} notas` : undefined}
            tone="indigo"
          />
          <DashMetric
            icon={CheckCircle2}
            value={data.academicPerformance.passRate !== null ? `${data.academicPerformance.passRate}%` : '—'}
            label="Aprovação"
            sub={data.academicPerformance.passRate !== null ? undefined : 'Sem notas'}
            tone="emerald"
          />
        </div>
      </section>

      {/* ── Acompanhamento Pedagógico ──────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader title="Acompanhamento Pedagógico" subtitle="Registros de aula e distribuição de pessoal" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <DashMetric
            icon={CheckCircle2}
            value={data.attendanceRegistration.rate != null ? `${data.attendanceRegistration.rate}%` : '—'}
            label="Aulas Registradas"
            sub={data.attendanceRegistration.total > 0
              ? `${data.attendanceRegistration.registered} de ${data.attendanceRegistration.total}`
              : 'Sem dados'}
            tone="emerald"
          />
          <DashMetric
            icon={AlertCircle}
            value={data.attendanceRegistration.rate != null ? `${100 - data.attendanceRegistration.rate}%` : '—'}
            label="Aulas Pendentes"
            sub={data.attendanceRegistration.total > 0
              ? `${data.attendanceRegistration.total - data.attendanceRegistration.registered} pendente(s)`
              : 'Sem dados'}
            tone="amber"
          />
          <DashMetric
            icon={Users}
            value={data.studentsByStatus.active}
            label="Alunos Ativos"
            sub={`${data.studentsByStatus.inactive} inativos · ${data.studentsByStatus.transferred} transferidos`}
            tone="indigo"
          />
          <DashMetric
            icon={GraduationCap}
            value={data.teachersByStatus.ativo}
            label="Professores Ativos"
            sub={`${data.teachersByStatus.inativo} inativos · ${data.teachersByStatus.licenca} licença`}
            tone="violet"
          />
        </div>
      </section>

      {/* ── Turmas ──────────────────────────────────────────────────────── */}
      {data.classOccupancy.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Turmas" subtitle="Desempenho e ocupação das turmas" />
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    {['Nome', 'Qtd. alunos', 'Frequência', 'Dias registrados', 'Média geral'].map((h) => (
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
                  {data.classOccupancy.map((c) => {
                    const occupancyPct = c.maxStudents > 0
                      ? Math.round((c.studentCount / c.maxStudents) * 100)
                      : 0
                    const occupancyColor =
                      occupancyPct >= 90 ? '#EF4444'
                      : occupancyPct >= 75 ? '#F59E0B'
                      : '#22C55E'

                    return (
                      <tr
                        key={c.classId ?? c.className}
                        className="transition-colors duration-150 hover:bg-accent"
                        style={{ borderBottom: '1px solid hsl(var(--border))' }}
                      >
                        <td className="px-5 py-3">
                          {c.classId ? (
                            <Link
                              to={`/classes/${c.classId}`}
                              className="font-semibold hover:underline"
                              style={{ color: 'hsl(var(--foreground))' }}
                            >
                              {c.className}
                            </Link>
                          ) : (
                            <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                              {c.className}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="tabular-nums font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                              {c.studentCount}
                            </span>
                            <span className="text-[11px] tabular-nums" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              / {c.maxStudents}
                            </span>
                            <div className="flex-1 h-2 rounded-full max-w-[80px]" style={{ background: 'hsl(var(--border))' }}>
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(occupancyPct, 100)}%`,
                                  background: occupancyColor,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 tabular-nums font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                          {c.attendanceRate != null ? `${c.attendanceRate}%` : '—'}
                        </td>
                        <td className="px-5 py-3 tabular-nums font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                          {c.registeredDays != null ? `${c.registeredDays} dia${c.registeredDays !== 1 ? 's' : ''}` : '—'}
                        </td>
                        <td className="px-5 py-3 tabular-nums font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                          {c.averageGrade ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── Financeiro ──────────────────────────────────────────────────── */}
      <FinanceSection tuitions={data.tuitions} blocked={financialBlocked} />

      {/* ── Controle de Demandas ────────────────────────────────────────── */}
      <DemandSection alerts={data.alerts} blocked={financialBlocked} />

    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { payload } = useAuth()
  const { activeSchoolId } = useSchoolContext()

  if (payload?.role === 'professor') return <Navigate to="/professor" replace />

  const { data, isLoading } = useDashboard()

  const isSecretariaWithoutSchool = payload?.role === 'secretaria' && !activeSchoolId

  if (isSecretariaWithoutSchool) return <NoSchoolView />
  if (isLoading) return <DashboardSkeleton cardCount={payload?.role === 'admin' ? 6 : 6} />
  if (!data) return null

  if (isAdminDashboard(data)) return <AdminDashboard data={data} />

  return <SchoolDashboard data={data} />
}
