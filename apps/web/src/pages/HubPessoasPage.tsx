import { useNavigate } from 'react-router'
import { Users, GraduationCap, Search, UserPlus, FileText, BookOpen, Plus, CheckCircle2, AlertCircle } from 'lucide-react'
import { useStudents } from '../features/students/hooks/useStudents'
import { useTeachers } from '../features/teachers/hooks/useTeachers'
import { PageHead } from '../components/PageHead'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import type { Student, Teacher } from '@education-gestor/types'

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center shrink-0 font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        background: '#EAF4FD',
        color: '#185FA5',
        fontSize: size * 0.34,
      }}
    >
      {getInitials(name)}
    </div>
  )
}

interface MetricChipProps {
  icon: React.ElementType
  value: number | string
  label: string
  tone?: 'primary' | 'success' | 'warning' | 'info'
}

const TONE_STYLES = {
  primary: { bg: '#EAF4FD', color: '#185FA5' },
  success: { bg: '#DCFCE7', color: '#15803D' },
  warning: { bg: '#FEF3C7', color: '#B45309' },
  info:    { bg: '#EAF4FD', color: '#378ADD' },
}

function MetricChip({ icon: Icon, value, label, tone = 'primary' }: MetricChipProps) {
  const s = TONE_STYLES[tone]
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{ background: s.bg }}
    >
      <div
        className="flex items-center justify-center rounded"
        style={{ width: 22, height: 22, color: s.color }}
      >
        <Icon size={13} />
      </div>
      <div>
        <div className="font-bold tabular-nums leading-tight" style={{ fontSize: 16, color: s.color }}>
          {value}
        </div>
        <div className="text-xs leading-tight" style={{ color: s.color, opacity: 0.75 }}>
          {label}
        </div>
      </div>
    </div>
  )
}

interface PersonRowProps {
  name: string
  meta: React.ReactNode
  badge?: React.ReactNode
  onClick?: () => void
}

function PersonRow({ name, meta, badge, onClick }: PersonRowProps) {
  return (
    <div
      className="flex items-center gap-3 py-2 px-3 rounded-lg transition-colors duration-[120ms] cursor-pointer"
      style={{ borderBottom: '1px solid var(--iris-slate-100)' }}
      onClick={onClick}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--iris-slate-50)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
    >
      <Avatar name={name} size={28} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color: 'var(--iris-blue-900)' }}>{name}</div>
        <div className="text-xs truncate" style={{ color: 'var(--iris-slate-500)' }}>{meta}</div>
      </div>
      {badge}
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

interface QuickCardProps {
  icon: React.ElementType
  label: string
  onClick: () => void
}

function QuickCard({ icon: Icon, label, onClick }: QuickCardProps) {
  return (
    <button
      className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all duration-120"
      style={{ background: '#fff', border: '1px solid var(--iris-slate-200)' }}
      onClick={onClick}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = '#185FA5'
        el.style.background = '#EAF4FD'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'var(--iris-slate-200)'
        el.style.background = '#fff'
      }}
    >
      <div
        className="flex items-center justify-center rounded-lg"
        style={{ width: 32, height: 32, background: 'rgba(24,95,165,0.10)', color: '#185FA5' }}
      >
        <Icon size={15} />
      </div>
      <span className="text-xs font-medium" style={{ color: 'var(--iris-blue-900)' }}>{label}</span>
    </button>
  )
}

export function HubPessoasPage() {
  const navigate = useNavigate()
  const { data: students = [] } = useStudents()
  const { data: teachers = [] } = useTeachers()

  const activeStudents = students.filter((s) => s.enrollmentStatus === 'active').length
  const recentStudents = students.slice(0, 4)
  const recentTeachers = teachers.slice(0, 4)

  return (
    <div className="space-y-6">
      <PageHead
        title="Pessoas"
        subtitle="Alunos, professores e responsáveis — tudo num só lugar"
      />

      {/* Dois painéis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Painel Alunos */}
        <section
          className="flex flex-col gap-4 rounded-xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid var(--iris-slate-200)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div
            className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-5 pb-4"
            style={{ borderBottom: '1px solid var(--iris-slate-100)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex items-center justify-center rounded-xl shrink-0"
                style={{ width: 44, height: 44, background: 'rgba(24,95,165,0.10)', color: '#185FA5' }}
              >
                <Users size={22} />
              </div>
              <div>
                <h2 className="font-bold text-base" style={{ color: 'var(--iris-blue-900)' }}>Alunos</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--iris-slate-500)' }}>
                  Cadastro, matrículas e dados completos. Acesse boletim e histórico individual.
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={() => navigate('/students')}>
                <Plus size={14} className="mr-1" />
                Novo aluno
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/students')}>
                Ver todos
              </Button>
            </div>
          </div>

          <div className="flex gap-3 px-5 flex-wrap">
            <MetricChip icon={Users}        value={students.length}  label="Cadastrados" tone="primary" />
            <MetricChip icon={CheckCircle2} value={activeStudents}   label="Ativos"      tone="success" />
            <MetricChip icon={AlertCircle}  value={students.filter((s) => s.enrollmentStatus === 'transferred').length} label="Transferidos" tone="warning" />
          </div>

          <div className="px-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--iris-slate-500)', letterSpacing: '0.08em' }}>
                Recentes
              </span>
              <button
                className="text-xs font-medium"
                style={{ color: '#185FA5' }}
                onClick={() => navigate('/students')}
              >
                Ver todos →
              </button>
            </div>
            <div>
              {recentStudents.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--iris-slate-500)' }}>
                  Nenhum aluno cadastrado
                </p>
              ) : (
                recentStudents.map((s) => (
                  <PersonRow
                    key={s.id}
                    name={s.name}
                    meta={<><span className="font-mono">{s.enrollmentCode}</span></>}
                    badge={studentBadge(s.enrollmentStatus)}
                    onClick={() => navigate(`/students/${s.id}`)}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        {/* Painel Professores */}
        <section
          className="flex flex-col gap-4 rounded-xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid var(--iris-slate-200)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div
            className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-5 pb-4"
            style={{ borderBottom: '1px solid var(--iris-slate-100)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex items-center justify-center rounded-xl shrink-0"
                style={{ width: 44, height: 44, background: 'rgba(24,95,165,0.10)', color: '#185FA5' }}
              >
                <GraduationCap size={22} />
              </div>
              <div>
                <h2 className="font-bold text-base" style={{ color: 'var(--iris-blue-900)' }}>Professores</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--iris-slate-500)' }}>
                  Cadastro, disciplinas vinculadas e quadro de aulas.
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={() => navigate('/teachers/new')}>
                <Plus size={14} className="mr-1" />
                Novo professor
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/teachers')}>
                Ver todos
              </Button>
            </div>
          </div>

          <div className="flex gap-3 px-5 flex-wrap">
            <MetricChip icon={GraduationCap} value={teachers.length} label="Cadastrados" tone="primary" />
            <MetricChip icon={CheckCircle2}  value={teachers.filter((t: Teacher) => t.employmentStatus === 'ativo').length} label="Ativos" tone="success" />
          </div>

          <div className="px-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--iris-slate-500)', letterSpacing: '0.08em' }}>
                Quadro docente
              </span>
              <button
                className="text-xs font-medium"
                style={{ color: '#185FA5' }}
                onClick={() => navigate('/teachers')}
              >
                Ver todos →
              </button>
            </div>
            <div>
              {recentTeachers.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--iris-slate-500)' }}>
                  Nenhum professor cadastrado
                </p>
              ) : (
                recentTeachers.map((t) => (
                  <PersonRow
                    key={t.id}
                    name={t.name}
                    meta={t.position ?? 'Professor(a)'}
                    onClick={() => navigate(`/teachers/${t.id}/edit`)}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Atalhos rápidos */}
      <div>
        <p
          className="text-xs font-semibold uppercase mb-3"
          style={{ color: 'var(--iris-slate-500)', letterSpacing: '0.08em' }}
        >
          Atalhos rápidos
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickCard icon={Search}   label="Buscar aluno"      onClick={() => navigate('/students')} />
          <QuickCard icon={UserPlus} label="Matricular em turma" onClick={() => navigate('/locacao-alunos')} />
          <QuickCard icon={FileText} label="Importar planilha"  onClick={() => navigate('/students')} />
          <QuickCard icon={BookOpen} label="Relatório de alunos" onClick={() => navigate('/students')} />
        </div>
      </div>
    </div>
  )
}
