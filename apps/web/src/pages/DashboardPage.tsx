import { Link } from 'react-router'
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
        <Skeleton className="h-7 w-28 mb-2 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: cardCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--iris-slate-200)' }}
          >
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-7 w-14 rounded-md" />
            <Skeleton className="h-3 w-16 rounded-md" />
          </div>
        ))}
      </div>
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--iris-slate-200)' }}
      >
        <Skeleton className="h-5 w-64 rounded-md" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
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
    valueColor: 'var(--fg-1)',
    borderColor: 'rgba(79, 70, 229, 0.15)',
  },
  violet: {
    iconBg: 'rgba(129, 140, 248, 0.12)',
    iconColor: '#A5B4FC',
    valueColor: 'var(--fg-1)',
    borderColor: 'rgba(129, 140, 248, 0.15)',
  },
  slate: {
    iconBg: 'rgba(49, 46, 129, 0.10)',
    iconColor: '#818CF8',
    valueColor: 'var(--fg-1)',
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
        background: 'var(--bg-surface)',
        border: `1px solid ${t.borderColor}`,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-lg shrink-0"
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
          style={{ color: 'var(--fg-3)' }}
        >
          {label}
        </div>
        {sub && (
          <div className="text-xs font-medium mt-1 tabular-nums" style={{ color: 'var(--fg-3)' }}>
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
        <h2 className="font-bold text-base" style={{ color: 'var(--fg-1)' }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────────

function TableEmpty({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 48, height: 48, background: 'var(--iris-slate-50)', color: 'var(--fg-3)' }}
      >
        <Icon size={22} />
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--fg-2)' }}>
        {message}
      </p>
    </div>
  )
}

// ── Admin dashboard ──────────────────────────────────────────────────────────

function AdminDashboard({ data }: { data: { secretariasCount: number; schoolsCount: number } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1
          className="font-bold leading-tight"
          style={{ fontSize: 22, color: 'var(--fg-1)', letterSpacing: '-0.01em' }}
        >
          Painel
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--fg-3)' }}>
          Visão geral da plataforma
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-sm">
        <DashMetric icon={Building2} value={data.secretariasCount} label="Secretarias" tone="indigo" />
        <DashMetric icon={School} value={data.schoolsCount} label="Escolas" tone="violet" />
      </div>
    </div>
  )
}

// ── No school selected ───────────────────────────────────────────────────────

function NoSchoolView() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 64, height: 64, background: 'var(--iris-slate-50)', color: 'var(--fg-3)' }}
      >
        <School size={28} />
      </div>
      <div className="text-center">
        <p className="font-semibold" style={{ color: 'var(--fg-1)' }}>
          Nenhuma escola selecionada
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--fg-3)' }}>
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
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1
            className="font-bold leading-tight"
            style={{ fontSize: 22, color: 'var(--fg-1)', letterSpacing: '-0.01em' }}
          >
            Painel
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--fg-3)' }}>
            Visão geral da escola — {new Date().getFullYear()}
          </p>
        </div>
        <Button variant="outline" size="sm">
          Exportar relatório
        </Button>
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
            background: 'var(--bg-surface)',
            border: '1px solid var(--iris-slate-200)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {data.upcomingTuitions.length === 0 ? (
            <TableEmpty
              icon={CalendarClock}
              message="Nenhuma mensalidade vencendo nos próximos 7 dias"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--iris-slate-100)' }}>
                    {['Aluno', 'Vencimento', 'Valor', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--fg-3)' }}
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
                      className="transition-colors duration-150 hover:bg-[var(--iris-slate-50)]"
                      style={{ borderBottom: '1px solid var(--iris-slate-100)' }}
                    >
                      <td className="px-5 py-3">
                        <Link
                          to={`/students/${t.studentId}`}
                          className="font-semibold hover:underline"
                          style={{ color: 'var(--fg-1)' }}
                        >
                          {t.studentName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 tabular-nums" style={{ color: 'var(--fg-3)' }}>
                        {formatDateBR(t.dueDate)}
                      </td>
                      <td className="px-5 py-3 font-semibold tabular-nums" style={{ color: 'var(--fg-1)' }}>
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
  const { data, isLoading } = useDashboard()

  const isSecretariaWithoutSchool = payload?.role === 'secretaria' && !activeSchoolId

  if (isSecretariaWithoutSchool) return <NoSchoolView />
  if (isLoading) return <DashboardSkeleton cardCount={payload?.role === 'admin' ? 2 : 6} />
  if (!data) return null

  if (isAdminDashboard(data)) return <AdminDashboard data={data} />

  return <SchoolDashboard data={data} />
}
