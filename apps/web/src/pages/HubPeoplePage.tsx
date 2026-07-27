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
  ArrowRight,
  User,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useStudents } from '../features/students/hooks/useStudents'
import { useAllTeachers } from '../features/teachers/hooks/useTeachers'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { TONE_CONFIG, type ToneKey } from '../lib/colors'
import type { Student, Teacher } from '@education-gestor/types'
import { Avatar } from '../components/Avatar'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType
  value: number | string
  label: string
  sub?: string
  tone: ToneKey
}

function StatCard({ icon: Icon, value, label, sub, tone }: StatCardProps) {
  const t = TONE_CONFIG[tone]
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-(--shadow-md)"
      style={{
        background: 'hsl(var(--card))',
        border: `1px solid ${t.borderColor}`,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-lg shrink-0"
        style={{ width: 38, height: 38, background: t.iconBg, color: t.iconColor }}
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
        <div className="text-[11px] font-semibold uppercase tracking-wider mt-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {label}
        </div>
        {sub && (
          <div className="text-xs font-medium mt-1 tabular-nums" style={{ color: 'hsl(var(--muted-foreground) / 0.8)' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Quick action card ─────────────────────────────────────────────────────────

interface QuickActionProps {
  icon: React.ElementType
  label: string
  description: string
  onClick: () => void
  tone: ToneKey
}

function QuickAction({ icon: Icon, label, description, onClick, tone }: QuickActionProps) {
  const t = TONE_CONFIG[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 p-4 rounded-xl text-left w-full transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl shrink-0 transition-all duration-200 group-hover:scale-110"
        style={{ width: 44, height: 44, background: t.iconBg, color: t.iconColor }}
      >
        <Icon size={20} strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          {label}
        </div>
        <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {description}
        </div>
      </div>
      <div
        className="flex items-center justify-center rounded-full shrink-0 transition-all duration-200 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
        style={{ color: t.iconColor }}
      >
        <ArrowRight size={16} />
      </div>
    </button>
  )
}

// ── Person row ────────────────────────────────────────────────────────────────

interface PersonRowProps {
  name: string
  photoUrl?: string | null
  metaLine1: React.ReactNode
  metaLine2?: React.ReactNode
  badge?: React.ReactNode
  onClick?: () => void
}

function PersonRow({ name, photoUrl, metaLine1, metaLine2, badge, onClick }: PersonRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 w-full py-2.5 px-3 rounded-xl text-left transition-all duration-150 hover:bg-accent cursor-pointer"
    >
      <Avatar name={name} photoUrl={photoUrl} size={38} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
          {name}
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {metaLine1}
          </span>
          {metaLine2 && (
            <>
              <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>•</span>
              <span className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {metaLine2}
              </span>
            </>
          )}
        </div>
      </div>
      <ArrowRight
        size={14}
        className="shrink-0 opacity-0 -translate-x-2 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0"
        style={{ color: 'hsl(var(--primary))' }}
      />
    </button>
  )
}

// ── Section panel ─────────────────────────────────────────────────────────────

interface SectionPanelProps {
  icon: React.ElementType
  title: string
  description: string
  headerActions?: React.ReactNode
  viewAllOnClick?: () => void
  children: React.ReactNode
  emptyIcon?: React.ElementType
  emptyMessage?: string
}

function SectionPanel({
  icon: Icon,
  title,
  description,
  headerActions,
  viewAllOnClick,
  children,
  emptyIcon: EmptyIcon = User,
  emptyMessage,
}: SectionPanelProps) {
  const hasItems = React.Children.count(children) > 0

  return (
    <section
      className="flex flex-col rounded-xl overflow-hidden transition-all duration-200 hover:shadow-(--shadow-md)"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-0">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 34, height: 34, background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
          >
            <Icon size={17} />
          </div>
          <div>
            <h2 className="font-bold text-sm" style={{ color: 'hsl(var(--foreground))' }}>
              {title}
            </h2>
            <p className="text-xs mt-px" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {description}
            </p>
          </div>
        </div>
        {headerActions}
      </div>

      <div className="p-2 pt-4">
        {hasItems ? (
          <div className="space-y-0.5">
            {children}
          </div>
        ) : emptyMessage ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center px-5">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 48, height: 48, background: 'hsl(var(--accent))', color: 'hsl(var(--muted-foreground))' }}
            >
              <EmptyIcon size={22} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {emptyMessage}
              </p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Clique em "Novo" para começar
              </p>
            </div>
          </div>
        ) : null}

        {hasItems && viewAllOnClick && (
          <div className="px-3 pb-3">
            <button
              type="button"
              onClick={viewAllOnClick}
              className="group flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-xs font-medium transition-all duration-150 hover:bg-accent cursor-pointer"
              style={{ color: 'hsl(var(--primary))' }}
            >
              Ver todos
              <ArrowRight size={12} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Empty welcome ─────────────────────────────────────────────────────────────

function EmptyWelcome({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div
      className="flex flex-col items-center gap-5 py-16 text-center rounded-xl"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 64, height: 64, background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
      >
        <Users size={28} />
      </div>
      <div className="max-w-sm">
        <p className="font-semibold text-base" style={{ color: 'hsl(var(--foreground))' }}>
          Nenhuma pessoa cadastrada ainda
        </p>
        <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Comece cadastrando os alunos e professores da sua escola para gerenciar turmas, notas e frequência.
        </p>
      </div>
      <div className="flex gap-3">
        <Button size="sm" onClick={() => onNavigate('/students/new')}>
          <Plus size={14} className="mr-1" />
          Novo aluno
        </Button>
        <Button size="sm" variant="outline" onClick={() => onNavigate('/teachers/new')}>
          <Plus size={14} className="mr-1" />
          Novo professor
        </Button>
      </div>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6 sm:p-8"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <div className="animate-pulse flex items-center gap-4">
          <div className="rounded-xl bg-muted" style={{ width: 48, height: 48 }} />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-3 w-64 rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4 animate-pulse"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          >
            <div className="h-8 w-8 rounded-lg bg-muted mb-3" />
            <div className="h-6 w-14 rounded bg-muted mb-2" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function HubPeoplePage() {
  const navigate = useNavigate()
  const { payload } = useAuth()
  const { data: studentsData, isLoading: studentsLoading } = useStudents()
  const students = studentsData?.data ?? []
  const { data: teachers = [], isLoading: teachersLoading } = useAllTeachers()

  const studentTotal = studentsData?.total ?? students.length
  const activeStudents = students.filter((s) => s.enrollmentStatus === 'active').length
  const transferredStudents = students.filter((s) => s.enrollmentStatus === 'transferred').length
  const activeTeachers = teachers.filter((t: Teacher) => t.employmentStatus === 'ativo').length

  const recentStudents = students.slice(0, 5)
  const recentTeachers = teachers.slice(0, 5)

  const isLoading = studentsLoading || teachersLoading
  const hasData = studentTotal > 0 || teachers.length > 0

  if (isLoading) return <LoadingSkeleton />
  if (!hasData) return <EmptyWelcome onNavigate={navigate} />

  return (
    <div className="space-y-6">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--card)) 100%)',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-48 h-48 opacity-[0.05] pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-8 left-1/4 w-56 h-56 opacity-[0.04] pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
        />

        <div className="relative flex items-center gap-4">
          <div
            className="flex items-center justify-center rounded-2xl shrink-0"
            style={{
              width: 52,
              height: 52,
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
              boxShadow: '0 8px 24px hsl(var(--primary) / 0.3)',
            }}
          >
            <Users size={24} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1
              className="font-bold leading-tight"
              style={{ fontSize: 22, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}
            >
              {greeting()}, {payload?.name?.split(' ')[0] ?? 'gestor'}!
            </h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Gerencie alunos e professores da sua escola — cadastros, matrículas e muito mais
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Users} value={studentTotal} label="Total de alunos" sub={`${activeStudents} ativos`} tone="indigo" />
        <StatCard icon={CheckCircle2} value={activeStudents} label="Alunos ativos" sub={`${transferredStudents} transferidos`} tone="emerald" />
        <StatCard icon={GraduationCap} value={teachers.length} label="Total de professores" sub={`${activeTeachers} ativos`} tone="violet" />
        <StatCard icon={TrendingUp} value={activeTeachers} label="Professores ativos" sub={`${teachers.length - activeTeachers} inativos`} tone="slate" />
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex items-center gap-2 px-5 pt-5 pb-0">
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 28, height: 28, background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
          >
            <Sparkles size={14} />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Ações rápidas
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-5">
          <QuickAction icon={Search} label="Buscar aluno" description="Encontrar por nome ou matrícula" onClick={() => navigate('/students')} tone="indigo" />
          <QuickAction icon={UserPlus} label="Matricular em turma" description="Alocar aluno em uma turma" onClick={() => navigate('/scheduling/students')} tone="emerald" />
          <QuickAction icon={FileText} label="Importar planilha" description="Cadastro em lote via CSV" onClick={() => navigate('/students')} tone="amber" />
          <QuickAction icon={BookOpen} label="Relatório de alunos" description="Boletins e relatórios gerais" onClick={() => navigate('/students')} tone="red" />
        </div>
      </div>

      {/* ── Recent Sections ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionPanel
          icon={Users}
          title="Alunos"
          description="Últimos cadastrados"
          headerActions={
            <Button size="sm" onClick={() => navigate('/students/new')}>
              <Plus size={14} className="mr-1" />
              Novo aluno
            </Button>
          }
          viewAllOnClick={() => navigate('/students')}
          emptyIcon={Users}
          emptyMessage="Nenhum aluno cadastrado"
        >
          {recentStudents.map((s) => (
            <PersonRow
              key={s.id}
              name={s.name}
              photoUrl={s.photoUrl}
              metaLine1={
                <span className="font-mono text-[11px]" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
                  {s.enrollmentCode}
                </span>
              }
              metaLine2={s.motherName ?? undefined}
              badge={
                <Badge
                  variant={
                    s.enrollmentStatus === 'active' ? 'success' :
                    s.enrollmentStatus === 'transferred' ? 'warning' :
                    'outline'
                  }
                  className="text-[10px] px-1.5 py-0 h-auto font-medium"
                >
                  {s.enrollmentStatus === 'active' ? 'Ativo' :
                   s.enrollmentStatus === 'transferred' ? 'Transf.' :
                   s.enrollmentStatus === 'inactive' ? 'Inativo' :
                   'Cancelado'}
                </Badge>
              }
              onClick={() => navigate(`/students/${s.id}`)}
            />
          ))}
        </SectionPanel>

        <SectionPanel
          icon={GraduationCap}
          title="Professores"
          description="Quadro docente"
          headerActions={
            <Button size="sm" onClick={() => navigate('/teachers/new')}>
              <Plus size={14} className="mr-1" />
              Novo professor
            </Button>
          }
          viewAllOnClick={() => navigate('/teachers')}
          emptyIcon={GraduationCap}
          emptyMessage="Nenhum professor cadastrado"
        >
          {recentTeachers.map((t) => (
            <PersonRow
              key={t.id}
              name={t.name}
              photoUrl={t.photoUrl}
              metaLine1={t.position ?? 'Professor(a)'}
              metaLine2={t.email}
              badge={
                <Badge
                  variant={
                    t.employmentStatus === 'ativo' ? 'success' :
                    t.employmentStatus === 'licenca' ? 'warning' :
                    'outline'
                  }
                  className="text-[10px] px-1.5 py-0 h-auto font-medium"
                >
                  {t.employmentStatus === 'ativo' ? 'Ativo' :
                   t.employmentStatus === 'licenca' ? 'Licença' :
                   'Inativo'}
                </Badge>
              }
              onClick={() => navigate(`/teachers/${t.id}/edit`)}
            />
          ))}
        </SectionPanel>
      </div>
    </div>
  )
}
