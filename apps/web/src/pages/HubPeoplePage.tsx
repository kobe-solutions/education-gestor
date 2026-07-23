import React from 'react'
import { useNavigate } from 'react-router'
import {
  Users,
  GraduationCap,
  Search,
  UserPlus,
  FileText,
  BookOpen,
  Plus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
} from 'lucide-react'
import { useStudents } from '../features/students/hooks/useStudents'
import { useAllTeachers } from '../features/teachers/hooks/useTeachers'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import type { Student, Teacher } from '@education-gestor/types'

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center shrink-0 rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        background: 'var(--iris-info-50)',
        color: 'var(--iris-info-600)',
        fontSize: size * 0.34,
      }}
    >
      {getInitials(name)}
    </div>
  )
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  transferred: 'Transferido',
  cancelled: 'Cancelado',
}

function studentBadge(status: Student['enrollmentStatus']) {
  if (status === 'active') return <Badge variant="success">Ativo</Badge>
  if (status === 'transferred') return <Badge variant="warning">Transferido</Badge>
  return <Badge variant="outline">{STATUS_LABEL[status ?? ''] ?? status}</Badge>
}

// ── Metric card ──────────────────────────────────────────────────────────────

interface MetricProps {
  icon: React.ElementType
  value: number | string
  label: string
  tone?: 'primary' | 'success' | 'warning'
}

const TONE_MAP = {
  primary: {
    accent: 'var(--iris-info-600)',
    iconBg: 'var(--iris-info-50)',
    iconColor: 'var(--iris-info-600)',
    glow: 'rgba(79, 70, 229, 0.08)',
  },
  success: {
    accent: 'var(--iris-success-600)',
    iconBg: 'var(--iris-success-50)',
    iconColor: 'var(--iris-success-600)',
    glow: 'rgba(21, 128, 61, 0.08)',
  },
  warning: {
    accent: 'var(--iris-warning-600)',
    iconBg: 'var(--iris-warning-50)',
    iconColor: 'var(--iris-warning-600)',
    glow: 'rgba(180, 83, 9, 0.08)',
  },
} as const

function Metric({ icon: Icon, value, label, tone = 'primary' }: MetricProps) {
  const t = TONE_MAP[tone]
  return (
    <div
      className="flex items-center gap-3.5 px-4 py-3 rounded-xl min-w-[130px] transition-all duration-200
        hover:shadow-[var(--shadow-sm)]"
      style={{
        background: t.glow,
        border: '1px solid transparent',
      }}
    >
      <div
        className="flex items-center justify-center rounded-md shrink-0"
        style={{ width: 38, height: 38, background: t.iconBg, color: t.iconColor }}
      >
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <div
          className="text-xl font-extrabold tabular-nums leading-none tracking-tight"
          style={{ color: t.accent }}
        >
          {value}
        </div>
        <div className="text-[11px] font-medium mt-1 uppercase tracking-wider" style={{ color: 'var(--fg-3)' }}>
          {label}
        </div>
      </div>
    </div>
  )
}

// ── Person row ───────────────────────────────────────────────────────────────

interface PersonRowProps {
  name: string
  meta: React.ReactNode
  badge?: React.ReactNode
  onClick?: () => void
}

function PersonRow({ name, meta, badge, onClick }: PersonRowProps) {
  return (
    <button
      type="button"
      className="flex items-center gap-3 w-full py-2.5 px-3 -mx-3 rounded-md transition-colors duration-150 text-left hover:bg-[var(--iris-slate-50)]"
      onClick={onClick}
    >
      <Avatar name={name} size={32} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color: 'var(--fg-1)' }}>
          {name}
        </div>
        <div className="text-xs truncate" style={{ color: 'var(--fg-3)' }}>
          {meta}
        </div>
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </button>
  )
}

// ── Section panel ────────────────────────────────────────────────────────────

interface SectionPanelProps {
  icon: React.ElementType
  title: string
  description: string
  metrics: React.ReactNode
  headerActions?: React.ReactNode
  sectionLabel: string
  viewAllLabel?: string
  viewAllOnClick?: () => void
  children: React.ReactNode
  emptyIcon?: React.ElementType
  emptyMessage?: string
}

function SectionPanel({
  icon: Icon,
  title,
  description,
  metrics,
  headerActions,
  sectionLabel,
  viewAllLabel = 'Ver todos',
  viewAllOnClick,
  children,
  emptyIcon: EmptyIcon = User,
  emptyMessage,
}: SectionPanelProps) {
  const hasItems = React.Children.count(children) > 0

  return (
    <section
      className="flex flex-col rounded-xl overflow-hidden transition-shadow duration-200 hover:shadow-[var(--shadow-md)]"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--iris-slate-200)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-5 pb-4">
        <div className="flex items-start gap-3.5">
          <div
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{ width: 44, height: 44, background: 'var(--iris-info-50)', color: 'var(--iris-info-600)' }}
          >
            <Icon size={22} />
          </div>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--fg-1)' }}>
              {title}
            </h2>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--fg-3)' }}>
              {description}
            </p>
          </div>
        </div>
        {headerActions}
      </div>

      {/* Metrics */}
      <div className="px-5 pb-4">
        <div className="flex gap-3 flex-wrap">
          {metrics}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5" style={{ borderBottom: '1px solid var(--iris-slate-100)' }} />

      {/* List */}
      <div className="px-2 pt-3 pb-4">
        <div className="flex items-center justify-between px-3 mb-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--fg-3)' }}
          >
            {sectionLabel}
          </span>
          {hasItems && viewAllOnClick && (
            <button
              className="flex items-center gap-1 text-xs font-medium transition-colors duration-150 hover:opacity-80"
              style={{ color: 'var(--iris-info-600)' }}
              onClick={viewAllOnClick}
            >
              {viewAllLabel}
              <ArrowRight size={12} />
            </button>
          )}
        </div>

        {hasItems ? (
          <div className="space-y-0.5">{children}</div>
        ) : emptyMessage ? (
          <div className="flex flex-col items-center gap-2.5 py-10 text-center">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 44, height: 44, background: 'var(--iris-slate-50)', color: 'var(--fg-3)' }}
            >
              <EmptyIcon size={20} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--fg-2)' }}>
                {emptyMessage}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--fg-3)' }}>
                Comece adicionando o primeiro registro
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

// ── Quick action card ────────────────────────────────────────────────────────

interface QuickActionProps {
  icon: React.ElementType
  label: string
  description?: string
  onClick: () => void
}

function QuickAction({ icon: Icon, label, description, onClick }: QuickActionProps) {
  return (
    <button
      type="button"
      className="flex items-center gap-3.5 p-4 rounded-xl text-left transition-all duration-200 group
        border hover:border-[var(--iris-info-600)] hover:shadow-[var(--shadow-sm)]
        hover:bg-[var(--iris-info-50)]"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--iris-slate-200)',
      }}
      onClick={onClick}
    >
      <div
        className="flex items-center justify-center rounded-md shrink-0 transition-colors duration-200
          group-hover:bg-[var(--iris-info-600)] group-hover:text-white"
        style={{
          width: 36,
          height: 36,
          background: 'var(--iris-info-50)',
          color: 'var(--iris-info-600)',
        }}
      >
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>
          {label}
        </div>
        {description && (
          <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--fg-3)' }}>
            {description}
          </div>
        )}
      </div>
    </button>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function HubPeoplePage() {
  const navigate = useNavigate()
  const { data: studentsData } = useStudents()
  const students = studentsData?.data ?? []
  const { data: teachers = [] } = useAllTeachers()

  const activeStudents = students.filter((s) => s.enrollmentStatus === 'active').length
  const transferredStudents = students.filter((s) => s.enrollmentStatus === 'transferred').length
  const activeTeachers = teachers.filter((t: Teacher) => t.employmentStatus === 'ativo').length

  const recentStudents = students.slice(0, 5)
  const recentTeachers = teachers.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1
          className="font-bold leading-tight"
          style={{ fontSize: 22, color: 'var(--fg-1)', letterSpacing: '-0.01em' }}
        >
          Pessoas
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--fg-3)' }}>
          Alunos, professores e responsáveis — tudo num só lugar
        </p>
      </div>

      {/* Main panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Students panel */}
        <SectionPanel
          icon={Users}
          title="Alunos"
          description="Cadastro, matrículas e dados completos. Acesse boletim e histórico."
          headerActions={
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={() => navigate('/students/new')}>
                <Plus size={14} className="mr-1" />
                Novo aluno
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/students')}>
                Ver todos
              </Button>
            </div>
          }
          metrics={
            <>
              <Metric icon={Users} value={students.length} label="Cadastrados" tone="primary" />
              <Metric icon={CheckCircle2} value={activeStudents} label="Ativos" tone="success" />
              <Metric icon={AlertCircle} value={transferredStudents} label="Transferidos" tone="warning" />
            </>
          }
          sectionLabel="Recentes"
          viewAllOnClick={() => navigate('/students')}
          emptyIcon={Users}
          emptyMessage="Nenhum aluno cadastrado"
        >
          {recentStudents.map((s) => (
            <PersonRow
              key={s.id}
              name={s.name}
              meta={<span className="font-mono text-[11px]">{s.enrollmentCode}</span>}
              badge={studentBadge(s.enrollmentStatus)}
              onClick={() => navigate(`/students/${s.id}`)}
            />
          ))}
        </SectionPanel>

        {/* Teachers panel */}
        <SectionPanel
          icon={GraduationCap}
          title="Professores"
          description="Cadastro, disciplinas vinculadas e quadro de aulas."
          headerActions={
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={() => navigate('/teachers/new')}>
                <Plus size={14} className="mr-1" />
                Novo professor
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/teachers')}>
                Ver todos
              </Button>
            </div>
          }
          metrics={
            <>
              <Metric icon={GraduationCap} value={teachers.length} label="Cadastrados" tone="primary" />
              <Metric icon={CheckCircle2} value={activeTeachers} label="Ativos" tone="success" />
            </>
          }
          sectionLabel="Quadro docente"
          viewAllOnClick={() => navigate('/teachers')}
          emptyIcon={GraduationCap}
          emptyMessage="Nenhum professor cadastrado"
        >
          {recentTeachers.map((t) => (
            <PersonRow
              key={t.id}
              name={t.name}
              meta={t.position ?? 'Professor(a)'}
              onClick={() => navigate(`/teachers/${t.id}/edit`)}
            />
          ))}
        </SectionPanel>
      </div>

      {/* Quick actions */}
      <div>
        <h2
          className="text-[11px] font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--fg-3)' }}
        >
          Atalhos rápidos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction
            icon={Search}
            label="Buscar aluno"
            description="Encontrar por nome ou matrícula"
            onClick={() => navigate('/students')}
          />
          <QuickAction
            icon={UserPlus}
            label="Matricular em turma"
            description="Alocar aluno em uma turma"
            onClick={() => navigate('/scheduling/students')}
          />
          <QuickAction
            icon={FileText}
            label="Importar planilha"
            description="Cadastro em lote via planilha"
            onClick={() => navigate('/students')}
          />
          <QuickAction
            icon={BookOpen}
            label="Relatório de alunos"
            description="Boletins e relatórios gerais"
            onClick={() => navigate('/students')}
          />
        </div>
      </div>
    </div>
  )
}
