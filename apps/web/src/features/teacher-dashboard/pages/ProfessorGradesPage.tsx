import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Users,
  FileSpreadsheet,
  School,
  ClipboardList,
} from 'lucide-react'
import { useTeacherDashboard } from '../hooks/useTeacherDashboard'
import { useClass } from '../../classes/hooks/useClasses'
import { useClassGrades } from '../../academic/hooks/useAcademic'
import { useAcademicPeriods } from '../../classes/hooks/useClasses'
import { useAuth } from '../../../contexts/AuthContext'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { Skeleton } from '../../../components/ui/skeleton'
import { Card, CardContent } from '../../../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { GradeGrid } from '../../academic/components/GradeGrid'
import { TONE_CONFIG, type ToneKey } from '../../../lib/colors'
import { toast } from '../../../lib/toast'
import { EmptyState } from '../../../components/EmptyState'
import type { TenantPayload } from '@education-gestor/types'

function MetricCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ElementType
  value: string | number
  label: string
  tone: ToneKey
}) {
  const t = TONE_CONFIG[tone]
  return (
    <Card size="sm" className="flex-1 min-w-0">
      <CardContent className="pt-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className="text-2xl font-extrabold tabular-nums leading-none tracking-tight"
              style={{ color: t.valueColor }}
            >
              {value}
            </p>
            <p className="text-xs font-medium mt-1.5 uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {label}
            </p>
          </div>
          <div
            className="shrink-0 p-2.5 rounded-xl flex items-center justify-center"
            style={{ background: t.iconBg, color: t.iconColor }}
          >
            <Icon size={20} strokeWidth={2.2} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProfessorGradesPage() {
  const { payload } = useAuth()
  const { data: dashboard, isLoading: loadingDashboard } = useTeacherDashboard()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedClassId = searchParams.get('class') ?? ''
  const selectedSubjectId = searchParams.get('subject') ?? ''

  const { data: classDetail, isLoading: loadingClass } = useClass(selectedClassId)
  const { data: grades = [], isLoading: loadingGrades } = useClassGrades(selectedClassId)
  const { data: periods } = useAcademicPeriods()

  const teacherSubjects = useMemo(() => {
    if (!dashboard || !selectedClassId) return []
    const cls = dashboard.classes.find((c) => c.id === selectedClassId)
    return cls?.subjects ?? []
  }, [dashboard, selectedClassId])

  const effectiveSubjectId = selectedSubjectId || teacherSubjects[0]?.id || ''

  const students = classDetail?.students ?? []
  const hasSelection = !!selectedClassId && !!effectiveSubjectId

  const teacherName = payload?.name ?? ''

  // Skeleton state
  if (loadingDashboard) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-7 w-56 rounded-md" />
            <Skeleton className="h-4 w-64 rounded-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 space-y-3" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-7 w-14 rounded-sm" />
              <Skeleton className="h-3 w-20 rounded-sm" />
            </div>
          ))}
        </div>
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Link
          to="/professor"
          className="flex items-center justify-center rounded-md w-8 h-8 transition-colors shrink-0 hover:bg-primary/10"
          title="Voltar"
        >
          <ArrowLeft size={16} style={{ color: 'hsl(var(--foreground))' }} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1
            className="font-bold leading-tight"
            style={{ fontSize: 22, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}
          >
            Lançar Notas
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Registre as notas dos alunos por período — {teacherName}
          </p>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard icon={GraduationCap} value={dashboard?.classes.length ?? 0} label="Turmas" tone="indigo" />
        <MetricCard icon={Users} value={hasSelection ? students.length : '—'} label="Alunos na turma" tone="violet" />
        <MetricCard icon={BookOpen} value={hasSelection ? teacherSubjects.length : '—'} label="Suas disciplinas" tone="amber" />
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-full min-h-[72px] flex-col gap-1.5 items-center justify-center"
            onClick={() => toast.success('Funcionalidade de importação em lote será implementada em breve!')}
          >
            <FileSpreadsheet size={18} className="text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground leading-tight text-center">
              Importar<br />planilha
            </span>
          </Button>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-72">
          <Label className="text-xs mb-1.5 block" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Turma
          </Label>
          <Select
            value={selectedClassId}
            onValueChange={(v) =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev)
                if (!v) next.delete('class')
                else next.set('class', v)
                next.delete('subject')
                return next
              })
            }
            items={dashboard?.classes.map((c) => ({ value: c.id, label: c.name })) ?? []}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma turma" />
            </SelectTrigger>
            <SelectContent>
              {dashboard?.classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
              {(!dashboard || dashboard.classes.length === 0) && (
                <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                  Nenhuma turma atribuída
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-64">
          <Label className="text-xs mb-1.5 block" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Disciplina
          </Label>
          <Select
            value={effectiveSubjectId}
            onValueChange={(v) =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev)
                if (!v || v === teacherSubjects[0]?.id) next.delete('subject')
                else next.set('subject', v)
                return next
              })
            }
            items={teacherSubjects.map((s) => ({ value: s.id, label: s.name }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione a disciplina" />
            </SelectTrigger>
            <SelectContent>
              {teacherSubjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
              {teacherSubjects.length === 0 && (
                <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                  Nenhuma disciplina atribuída
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {hasSelection && (
          <div className="flex items-end">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium"
              style={{ background: TONE_CONFIG.indigo.iconBg, color: TONE_CONFIG.indigo.iconColor }}
            >
              <ClipboardList size={14} />
              {grades.length} nota{grades.length !== 1 ? 's' : ''} na turma
            </div>
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      {!selectedClassId && (
        <EmptyState
          icon={School}
          title="Selecione uma turma"
          description="Escolha uma turma no filtro acima para visualizar os alunos e registrar as notas."
        />
      )}

      {selectedClassId && !effectiveSubjectId && (
        <EmptyState
          icon={BookOpen}
          title="Nenhuma disciplina atribuída"
          description="Você não possui disciplinas vinculadas a esta turma."
        />
      )}

      {hasSelection && loadingClass && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasSelection && !loadingClass && students.length === 0 && (
        <EmptyState
          icon={Users}
          title="Nenhum aluno na turma"
          description="Esta turma ainda não possui alunos vinculados."
        />
      )}

      {hasSelection && !loadingClass && students.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            {loadingGrades ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-md" />
                ))}
              </div>
            ) : (
              <GradeGrid
                classId={selectedClassId}
                subjectId={effectiveSubjectId}
                teacherId={(payload as TenantPayload)?.userId ?? ''}
                students={students}
                periods={periods ?? []}
                grades={grades}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
