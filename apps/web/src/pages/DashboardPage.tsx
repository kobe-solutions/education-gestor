import { useState } from 'react'
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
  AlertTriangle,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useDashboard, isAdminDashboard, type DashboardData, type AdminDashboard, type SchoolDashboard } from '../features/dashboard/hooks/useDashboard'
import { useAuth } from '../contexts/AuthContext'
import { useSchoolContext } from '../contexts/SchoolContext'
import { useFinancialVisibility } from '../contexts/FinancialVisibilityContext'
import { useFinancialBlocked } from '../lib/useFinancialBlocked'
import { TuitionStatusBadge } from '../features/financial/components/TuitionStatusBadge'
import { fmtBRL, formatDateBR } from '../lib/format'
import { TONE_CONFIG, type ToneKey } from '../lib/colors'
import { Skeleton } from '../components/ui/skeleton'
import { Button } from '../components/ui/button'

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

// ── Metric card ──────────────────────────────────────────────────────────────

interface DashMetricProps {
  icon: React.ElementType
  value: number | string
  label: string
  sub?: string
  tone: ToneKey
}

function DashMetric({ icon: Icon, value, label, sub, tone }: DashMetricProps) {
  const t = TONE_CONFIG[tone]
  return (
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
}

// ── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <h2 className="font-bold text-base" style={{ color: 'hsl(var(--foreground))' }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────────

import { EmptyState } from '../components/EmptyState'

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
              icon={Clock}
              value={data.tuitions.pending.count}
              label="Pendentes"
              sub={fmtBRL(data.tuitions.pending.total)}
              tone="amber"
            />
            <DashMetric
              icon={CheckCircle2}
              value={data.tuitions.paid.count}
              label="Pagas"
              sub={fmtBRL(data.tuitions.paid.total)}
              tone="emerald"
            />
            <DashMetric
              icon={AlertCircle}
              value={data.tuitions.overdue.count}
              label="Atrasadas"
              sub={fmtBRL(data.tuitions.overdue.total)}
              tone="red"
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
  const { hideFinancialData } = useFinancialVisibility()
  const { blocked: financialBlocked } = useFinancialBlocked()
  const isProfessor = payload?.role === 'professor'

  const ALERT_PAGE_SIZE = 10
  const [guardianPage, setGuardianPage] = useState(1)
  const [docPage, setDocPage] = useState(1)
  const guardianTotalPages = Math.max(1, Math.ceil(data.alerts.studentsWithoutGuardians.length / ALERT_PAGE_SIZE))
  const docTotalPages = Math.max(1, Math.ceil(data.alerts.studentsWithoutIdDocument.length / ALERT_PAGE_SIZE))
  const guardianPaginated = data.alerts.studentsWithoutGuardians.slice(
    (guardianPage - 1) * ALERT_PAGE_SIZE,
    guardianPage * ALERT_PAGE_SIZE,
  )
  const docPaginated = data.alerts.studentsWithoutIdDocument.slice(
    (docPage - 1) * ALERT_PAGE_SIZE,
    docPage * ALERT_PAGE_SIZE,
  )

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

      {/* ── Distribuição ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader title="Distribuição" subtitle="Situação de alunos e professores" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div
            className="rounded-xl p-5 space-y-3"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Alunos
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Ativos', value: data.studentsByStatus.active, tone: 'emerald' as ToneKey },
                { label: 'Inativos', value: data.studentsByStatus.inactive, tone: 'slate' as ToneKey },
                { label: 'Transferidos', value: data.studentsByStatus.transferred, tone: 'amber' as ToneKey },
                { label: 'Cancelados', value: data.studentsByStatus.cancelled, tone: 'red' as ToneKey },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{ background: TONE_CONFIG[s.tone].iconBg }}
                >
                  <span className="text-lg font-bold tabular-nums" style={{ color: TONE_CONFIG[s.tone].valueColor }}>
                    {s.value}
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div
            className="rounded-xl p-5 space-y-3"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Professores
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Ativos', value: data.teachersByStatus.ativo, tone: 'emerald' as ToneKey },
                { label: 'Inativos', value: data.teachersByStatus.inativo, tone: 'slate' as ToneKey },
                { label: 'Licença', value: data.teachersByStatus.licenca, tone: 'amber' as ToneKey },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{ background: TONE_CONFIG[s.tone].iconBg }}
                >
                  <span className="text-lg font-bold tabular-nums" style={{ color: TONE_CONFIG[s.tone].valueColor }}>
                    {s.value}
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Turmas ──────────────────────────────────────────────────────── */}
      {data.classOccupancy.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Turmas" subtitle="Ocupação das turmas" />
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
                    {['Turma', 'Alunos', 'Vagas', 'Ocupação'].map((h) => (
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
                    const pct = c.maxStudents > 0 ? Math.round((c.studentCount / c.maxStudents) * 100) : 0
                    return (
                      <tr
                        key={c.className}
                        className="transition-colors duration-150 hover:bg-accent"
                        style={{ borderBottom: '1px solid hsl(var(--border))' }}
                      >
                        <td className="px-5 py-3 font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                          {c.className}
                        </td>
                        <td className="px-5 py-3 tabular-nums" style={{ color: 'hsl(var(--foreground))' }}>
                          {c.studentCount}
                        </td>
                        <td className="px-5 py-3 tabular-nums" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {c.maxStudents}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 rounded-full" style={{ background: 'hsl(var(--border))' }}>
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                  background: pct >= 90 ? '#EF4444' : pct >= 75 ? '#F59E0B' : '#22C55E',
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {pct}%
                            </span>
                          </div>
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

      {!financialBlocked && (
        <section className="space-y-4">
          <SectionHeader title="Financeiro" subtitle="Status das mensalidades" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <DashMetric
              icon={Clock}
              value={data.tuitions.pending.count}
              label="Pendentes"
              sub={fmtBRL(data.tuitions.pending.total)}
              tone="amber"
            />
            <DashMetric
              icon={CheckCircle2}
              value={data.tuitions.paid.count}
              label="Pagas"
              sub={fmtBRL(data.tuitions.paid.total)}
              tone="emerald"
            />
            <DashMetric
              icon={AlertCircle}
              value={data.tuitions.overdue.count}
              label="Atrasadas"
              sub={fmtBRL(data.tuitions.overdue.total)}
              tone="red"
            />
          </div>
        </section>
      )}

      {!financialBlocked && (
      <section className="space-y-4">
        <SectionHeader
          title="Mensalidades vencendo nos próximos 7 dias"
          subtitle="Acompanhe alunos com vencimento próximo"
          action={
            <Link to="/financial" className="shrink-0">
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
          {data.upcomingTuitions.length === 0 ? (
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
                  {data.upcomingTuitions.map((t) => (
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
      </section>
      )}

      {/* ── Alertas ──────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader title="Alertas" subtitle="Pontos que precisam de atenção" />
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ${!financialBlocked ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {!financialBlocked && (
          <Link
            to="/financial"
            className="rounded-xl p-4 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-md) block"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex items-center justify-center rounded-md shrink-0"
                style={{ width: 32, height: 32, background: TONE_CONFIG.red.iconBg, color: TONE_CONFIG.red.iconColor }}
              >
                <AlertCircle size={16} strokeWidth={2.2} />
              </div>
              <span className="text-xl font-extrabold tabular-nums" style={{ color: TONE_CONFIG.red.valueColor }}>
                {data.alerts.overdueTuitions}
              </span>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Mensalidades atrasadas
            </span>
          </Link>
          )}
          <a
            href="#alert-sem-responsavel"
            className="rounded-xl p-4 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-md) block"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex items-center justify-center rounded-md shrink-0"
                style={{ width: 32, height: 32, background: TONE_CONFIG.amber.iconBg, color: TONE_CONFIG.amber.iconColor }}
              >
                <AlertTriangle size={16} strokeWidth={2.2} />
              </div>
              <span className="text-xl font-extrabold tabular-nums" style={{ color: TONE_CONFIG.amber.valueColor }}>
                {data.alerts.studentsWithoutGuardians.length}
              </span>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Sem responsável
            </span>
          </a>
          <a
            href="#alert-sem-documento"
            className="rounded-xl p-4 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-md) block"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex items-center justify-center rounded-md shrink-0"
                style={{ width: 32, height: 32, background: TONE_CONFIG.amber.iconBg, color: TONE_CONFIG.amber.iconColor }}
              >
                <FileText size={16} strokeWidth={2.2} />
              </div>
              <span className="text-xl font-extrabold tabular-nums" style={{ color: TONE_CONFIG.amber.valueColor }}>
                {data.alerts.studentsWithoutIdDocument.length}
              </span>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Sem doc. identidade
            </span>
          </a>
          <a
            href="#alert-3-faltas"
            className="rounded-xl p-4 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-md) block"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex items-center justify-center rounded-md shrink-0"
                style={{ width: 32, height: 32, background: TONE_CONFIG.amber.iconBg, color: TONE_CONFIG.amber.iconColor }}
              >
                <Users size={16} strokeWidth={2.2} />
              </div>
              <span className="text-xl font-extrabold tabular-nums" style={{ color: TONE_CONFIG.amber.valueColor }}>
                {data.alerts.lowAttendanceStudents.length}
              </span>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Com 3+ faltas (30d)
            </span>
          </a>
        </div>
        {/* ── Tabela: Alunos 3+ faltas ─────────────────────────────────── */}
        <div id="alert-3-faltas">
          {data.alerts.lowAttendanceStudents.length > 0 && (
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
                      {['Aluno', 'Faltas (30d)'].map((h) => (
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
                    {data.alerts.lowAttendanceStudents.map((s) => (
                      <tr
                        key={s.studentId}
                        className="transition-colors duration-150 hover:bg-accent"
                        style={{ borderBottom: '1px solid hsl(var(--border))' }}
                      >
                        <td className="px-5 py-3">
                          <Link
                            to={`/students/${s.studentId}`}
                            className="font-semibold hover:underline"
                            style={{ color: 'hsl(var(--foreground))' }}
                          >
                            {s.studentName}
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold"
                            style={{ background: TONE_CONFIG.red.iconBg, color: TONE_CONFIG.red.iconColor }}
                          >
                            {s.absenceCount} falta{s.absenceCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Tabela: Alunos sem responsável ───────────────────────────── */}
        <div id="alert-sem-responsavel">
          {data.alerts.studentsWithoutGuardians.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                <AlertTriangle size={14} style={{ color: TONE_CONFIG.amber.iconColor }} />
                <span className="text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Alunos sem responsável cadastrado
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      {['Aluno'].map((h) => (
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
                    {guardianPaginated.map((s) => (
                      <tr
                        key={s.studentId}
                        className="transition-colors duration-150 hover:bg-accent"
                        style={{ borderBottom: '1px solid hsl(var(--border))' }}
                      >
                        <td className="px-5 py-3">
                          <Link
                            to={`/students/${s.studentId}`}
                            className="font-semibold hover:underline"
                            style={{ color: 'hsl(var(--foreground))' }}
                          >
                            {s.studentName}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {guardianTotalPages > 1 && (
                <div
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 border-t"
                  style={{ borderColor: 'hsl(var(--border))' }}
                >
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Mostrando 1–{Math.min(ALERT_PAGE_SIZE, data.alerts.studentsWithoutGuardians.length)} de{' '}
                    {data.alerts.studentsWithoutGuardians.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={guardianPage <= 1}
                      onClick={() => setGuardianPage((p) => Math.max(1, p - 1))}
                      className="p-1 rounded transition-colors disabled:opacity-30 hover:bg-accent"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: guardianTotalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === guardianTotalPages || Math.abs(p - guardianPage) <= 1)
                      .map((p, idx, arr) => (
                        <span key={p} className="flex items-center gap-1">
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="px-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>...</span>
                          )}
                          <button
                            onClick={() => setGuardianPage(p)}
                            className="min-w-[26px] h-[26px] rounded text-xs font-medium transition-colors hover:bg-accent"
                            style={{
                              background: p === guardianPage ? 'hsl(var(--primary))' : 'transparent',
                              color: p === guardianPage ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                            }}
                          >
                            {p}
                          </button>
                        </span>
                      ))}
                    <button
                      disabled={guardianPage >= guardianTotalPages}
                      onClick={() => setGuardianPage((p) => Math.min(guardianTotalPages, p + 1))}
                      className="p-1 rounded transition-colors disabled:opacity-30 hover:bg-accent"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Tabela: Alunos sem documento ─────────────────────────────── */}
        <div id="alert-sem-documento">
          {data.alerts.studentsWithoutIdDocument.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                <FileText size={14} style={{ color: TONE_CONFIG.amber.iconColor }} />
                <span className="text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Alunos sem documento de identidade
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      {['Aluno'].map((h) => (
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
                    {docPaginated.map((s) => (
                      <tr
                        key={s.studentId}
                        className="transition-colors duration-150 hover:bg-accent"
                        style={{ borderBottom: '1px solid hsl(var(--border))' }}
                      >
                        <td className="px-5 py-3">
                          <Link
                            to={`/students/${s.studentId}`}
                            className="font-semibold hover:underline"
                            style={{ color: 'hsl(var(--foreground))' }}
                          >
                            {s.studentName}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {docTotalPages > 1 && (
                <div
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 border-t"
                  style={{ borderColor: 'hsl(var(--border))' }}
                >
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Mostrando 1–{Math.min(ALERT_PAGE_SIZE, data.alerts.studentsWithoutIdDocument.length)} de{' '}
                    {data.alerts.studentsWithoutIdDocument.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={docPage <= 1}
                      onClick={() => setDocPage((p) => Math.max(1, p - 1))}
                      className="p-1 rounded transition-colors disabled:opacity-30 hover:bg-accent"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: docTotalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === docTotalPages || Math.abs(p - docPage) <= 1)
                      .map((p, idx, arr) => (
                        <span key={p} className="flex items-center gap-1">
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="px-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>...</span>
                          )}
                          <button
                            onClick={() => setDocPage(p)}
                            className="min-w-[26px] h-[26px] rounded text-xs font-medium transition-colors hover:bg-accent"
                            style={{
                              background: p === docPage ? 'hsl(var(--primary))' : 'transparent',
                              color: p === docPage ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                            }}
                          >
                            {p}
                          </button>
                        </span>
                      ))}
                    <button
                      disabled={docPage >= docTotalPages}
                      onClick={() => setDocPage((p) => Math.min(docTotalPages, p + 1))}
                      className="p-1 rounded transition-colors disabled:opacity-30 hover:bg-accent"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

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
