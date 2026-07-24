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
import { Button } from '../components/ui/button'
import type { Student, Teacher } from '@education-gestor/types'

import { Avatar } from '../components/Avatar'

import { StatusBadge } from '../components/StatusBadge'

// ── Metric card ──────────────────────────────────────────────────────────────

interface MetricProps {
  icon: React.ElementType
  value: number | string
  label: string
  tone?: 'primary' | 'success' | 'warning'
}

const TONE_MAP = {
  primary: {
    accent: 'hsl(217 91% 40%)',
    iconBg: 'hsl(217 91% 95%)',
    iconColor: 'hsl(217 91% 40%)',
    glow: 'rgba(79, 70, 229, 0.08)',
  },
  success: {
    accent: 'hsl(142 76% 36%)',
    iconBg: 'hsl(142 76% 96%)',
    iconColor: 'hsl(142 76% 36%)',
    glow: 'rgba(21, 128, 61, 0.08)',
  },
  warning: {
    accent: 'hsl(32 95% 44%)',
    iconBg: 'hsl(48 96% 95%)',
    iconColor: 'hsl(32 95% 44%)',
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
        <div className="text-[11px] font-medium mt-1 uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
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
    <Button
      variant="ghost"
      size="sm"
      className="flex items-center gap-3 w-full py-2.5 px-3 -mx-3 h-auto justify-start text-left hover:bg-accent"
      onClick={onClick}
    >
      <Avatar name={name} size={32} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>
          {name}
        </div>
        <div className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {meta}
        </div>
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </Button>
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
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-5 pb-4">
        <div className="flex items-start gap-3.5">
          <div
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{ width: 44, height: 44, background: 'hsl(217 91% 95%)', color: 'hsl(217 91% 40%)' }}
          >
            <Icon size={22} />
          </div>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'hsl(var(--foreground))' }}>
              {title}
            </h2>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
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
      <div className="mx-5" style={{ borderBottom: '1px solid hsl(var(--border))' }} />

      {/* List */}
      <div className="px-2 pt-3 pb-4">
        <div className="flex items-center justify-between px-3 mb-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            {sectionLabel}
          </span>
          {hasItems && viewAllOnClick && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs font-medium h-auto"
              style={{ color: 'hsl(217 91% 40%)' }}
              onClick={viewAllOnClick}
            >
              {viewAllLabel}
              <ArrowRight size={12} />
            </Button>
          )}
        </div>

        {hasItems ? (
          <div className="space-y-0.5">{children}</div>
        ) : emptyMessage ? (
          <div className="flex flex-col items-center gap-2.5 py-10 text-center">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 44, height: 44, background: 'hsl(var(--accent))', color: 'hsl(var(--muted-foreground))' }}
            >
              <EmptyIcon size={20} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {emptyMessage}
              </p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
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
    <Button
      variant="ghost"
      size="sm"
      className="flex items-center gap-3.5 p-4 rounded-xl text-left h-auto justify-start
        border hover:border-[hsl(217 91% 40%)] hover:shadow-[var(--shadow-sm)]
        hover:bg-[hsl(217 91% 95%)]"
      style={{
        background: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))',
      }}
      onClick={onClick}
    >
      <div
        className="flex items-center justify-center rounded-md shrink-0 transition-colors duration-200
          group-hover:bg-[hsl(217 91% 40%)] group-hover:text-white"
        style={{
          width: 36,
          height: 36,
          background: 'hsl(217 91% 95%)',
          color: 'hsl(217 91% 40%)',
        }}
      >
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          {label}
        </div>
        {description && (
          <div className="text-xs mt-0.5 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {description}
          </div>
        )}
      </div>
    </Button>
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
          style={{ fontSize: 22, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}
        >
          Pessoas
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
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
              badge={<StatusBadge status={s.enrollmentStatus} kind="enrollment" />}
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
          style={{ color: 'hsl(var(--muted-foreground))' }}
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
