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
} from 'lucide-react'
import { useDashboard, isAdminDashboard } from '../features/dashboard/hooks/useDashboard'
import { useAuth } from '../contexts/AuthContext'
import { useSchoolContext } from '../contexts/SchoolContext'
import { TuitionStatusBadge } from '../features/financial/components/TuitionStatusBadge'
import { fmtBRL, formatDateBR } from '../lib/format'
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

// ── Metric card ──────────────────────────────────────────────────────────────

interface DashMetricProps {
  icon: React.ElementType
  value: number | string
  label: string
  sub?: string
  tone: 'indigo' | 'violet' | 'slate' | 'amber' | 'emerald' | 'red'
}

const TONE_CONFIG = {
  indigo: {
    iconBg: 'rgba(79, 70, 229, 0.12)',
    iconColor: '#818CF8',
    valueColor: 'hsl(var(--foreground))',
    borderColor: 'rgba(79, 70, 229, 0.15)',
  },
  violet: {
    iconBg: 'rgba(129, 140, 248, 0.12)',
    iconColor: '#A5B4FC',
    valueColor: 'hsl(var(--foreground))',
    borderColor: 'rgba(129, 140, 248, 0.15)',
  },
  slate: {
    iconBg: 'rgba(49, 46, 129, 0.10)',
    iconColor: '#818CF8',
    valueColor: 'hsl(var(--foreground))',
    borderColor: 'rgba(49, 46, 129, 0.12)',
  },
  amber: {
    iconBg: 'rgba(180, 83, 9, 0.10)',
    iconColor: '#F59E0B',
    valueColor: '#F59E0B',
    borderColor: 'rgba(180, 83, 9, 0.15)',
  },
  emerald: {
    iconBg: 'rgba(21, 128, 61, 0.10)',
    iconColor: '#22C55E',
    valueColor: '#22C55E',
    borderColor: 'rgba(21, 128, 61, 0.15)',
  },
  red: {
    iconBg: 'rgba(185, 28, 28, 0.10)',
    iconColor: '#EF4444',
    valueColor: '#EF4444',
    borderColor: 'rgba(185, 28, 28, 0.15)',
  },
} as const

function DashMetric({ icon: Icon, value, label, sub, tone }: DashMetricProps) {
  const t = TONE_CONFIG[tone]
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl transition-all duration-200
        hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
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
          className="text-[11px] font-semibold uppercase tracking-wider mt-1.5"
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
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
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
          <DashMetric
            icon={TrendingUp}
            value={fmtBRL(data.tuitions.paid.total)}
            label="Receita total"
            sub={`${data.tuitions.paid.count} pagas`}
            tone="emerald"
          />
        </div>
      </section>

      {/* ── Financeiro ─────────────────────────────────────────────────── */}
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
  const isProfessor = payload?.role === 'professor'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
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
        <div className="flex items-center gap-2">
          {isProfessor && (
            <Link to="/professor">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Presentation size={14} />
                Meu Painel
              </Button>
            </Link>
          )}
          <Button variant="outline" size="sm">
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

      {/* ── Financeiro ───────────────────────────────────────────────────── */}
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

      {/* ── Vencimentos próximos ─────────────────────────────────────────── */}
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
