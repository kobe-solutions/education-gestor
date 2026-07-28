import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  FileSpreadsheet,
  Pencil,
  School,
  ClipboardList,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTeacherDashboard } from '../hooks/useTeacherDashboard'
import { useClass } from '../../classes/hooks/useClasses'
import { useClassGrades, useRegisterGrade } from '../../academic/hooks/useAcademic'
import { useAcademicPeriods } from '../../classes/hooks/useClasses'
import { useAuth } from '../../../contexts/AuthContext'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Skeleton } from '../../../components/ui/skeleton'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../../components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import { TONE_CONFIG, type ToneKey } from '../../../lib/colors'
import { toast } from '../../../lib/toast'
import { extractErrorMessage } from '../../../lib/errors'
import { cn } from '../../../lib/utils'
import { EmptyState } from '../../../components/EmptyState'
import type { TenantPayload, Grade } from '@education-gestor/types'

const gradeSchema = z.object({
  value: z.coerce.number().min(0, 'Mínimo 0').max(10, 'Máximo 10'),
})

type GradeForm = z.infer<typeof gradeSchema>

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

function gradeTone(value: number): 'emerald' | 'amber' | 'red' {
  if (value >= 7) return 'emerald'
  if (value >= 5) return 'amber'
  return 'red'
}

export function ProfessorGradesPage() {
  const { payload } = useAuth()
  const { data: dashboard, isLoading: loadingDashboard } = useTeacherDashboard()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedClassId = searchParams.get('class') ?? ''
  const selectedPeriodId = searchParams.get('period') ?? ''

  const { data: classDetail, isLoading: loadingClass } = useClass(selectedClassId)
  const { data: grades = [], isLoading: loadingGrades } = useClassGrades(selectedClassId)
  const { data: periods } = useAcademicPeriods()
  const registerGrade = useRegisterGrade()

  const [gradeDialog, setGradeDialog] = useState<{
    studentId: string
    studentName: string
    subjectId: string
    subjectName: string
    existingGrade?: Grade
  } | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GradeForm>({
    resolver: zodResolver(gradeSchema),
  })

  // Get teacher's subjects for the selected class
  const teacherSubjects = useMemo(() => {
    if (!dashboard || !selectedClassId) return []
    const cls = dashboard.classes.find((c) => c.id === selectedClassId)
    return cls?.subjects ?? []
  }, [dashboard, selectedClassId])

  // Filter grades by selected period
  const filteredGrades = useMemo(() => {
    if (!selectedPeriodId) return grades
    return grades.filter((g) => g.academicPeriodId === selectedPeriodId)
  }, [grades, selectedPeriodId])

  // Map grades by (studentId, subjectId)
  const gradeMap = useMemo(() => {
    const map = new Map<string, Grade>()
    for (const g of filteredGrades) {
      map.set(`${g.studentId}:${g.subjectId}`, g)
    }
    return map
  }, [filteredGrades])

  const students = classDetail?.students ?? []
  const hasSelection = !!selectedClassId

  // Set default period when periods load
  const effectivePeriodId = selectedPeriodId || periods?.[0]?.id || ''

  function handleOpenGrade(student: { id: string; name: string }, subject: { id: string; name: string }) {
    const key = `${student.id}:${subject.id}`
    const existing = gradeMap.get(key)
    setGradeDialog({
      studentId: student.id,
      studentName: student.name,
      subjectId: subject.id,
      subjectName: subject.name,
      existingGrade: existing,
    })
    reset({ value: existing ? Number(existing.value) : undefined })
    setDialogOpen(true)
  }

  function onSubmitGrade(data: GradeForm) {
    if (!gradeDialog || !selectedClassId || !effectivePeriodId) return
    const teacherId = (payload as TenantPayload)?.userId ?? ''

    registerGrade.mutate(
      {
        classId: selectedClassId,
        studentId: gradeDialog.studentId,
        teacherId,
        subjectId: gradeDialog.subjectId,
        academicPeriodId: effectivePeriodId,
        value: data.value,
      },
      {
        onSuccess: () => {
          toast.success(`Nota registrada para ${gradeDialog.studentName}`)
          setDialogOpen(false)
          setGradeDialog(null)
        },
        onError: (err) => {
          toast.error(extractErrorMessage(err, 'Erro ao registrar nota'))
        },
      },
    )
  }

  const teacherName = payload?.name ?? ''

  const totalGrades = filteredGrades.length
  const totalStudents = students.length
  const totalSubjects = teacherSubjects.length

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
            Registre as notas dos alunos por disciplina — {teacherName}
          </p>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard icon={GraduationCap} value={dashboard?.classes.length ?? 0} label="Turmas" tone="indigo" />
        <MetricCard icon={Users} value={hasSelection ? totalStudents : '—'} label="Alunos na turma" tone="violet" />
        <MetricCard icon={BookOpen} value={hasSelection ? totalSubjects : '—'} label="Suas disciplinas" tone="amber" />
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
            Período letivo
          </Label>
          <Select
            value={effectivePeriodId}
            onValueChange={(v) =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev)
                if (!v || v === periods?.[0]?.id) next.delete('period')
                else next.set('period', v)
                return next
              })
            }
            items={periods?.map((p) => ({ value: p.id, label: p.name })) ?? []}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              {periods?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
              {(!periods || periods.length === 0) && (
                <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                  Nenhum período cadastrado
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
              {totalGrades} nota{totalGrades !== 1 ? 's' : ''} registrada{totalGrades !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      {!hasSelection && (
        <EmptyState
          icon={School}
          title="Selecione uma turma"
          description="Escolha uma turma no filtro acima para visualizar os alunos e registrar as notas."
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
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users size={16} />
              {classDetail?.name} — {students.length} aluno{students.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loadingGrades ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-md" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-64 sticky left-0 bg-card z-10">Aluno</TableHead>
                    {teacherSubjects.map((subj) => (
                      <TableHead key={subj.id} className="text-center min-w-[100px]">
                        {subj.name}
                      </TableHead>
                    ))}
                    <TableHead className="w-20 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const studentGrades = teacherSubjects.map((subj) => {
                      const key = `${student.id}:${subj.id}`
                      return gradeMap.get(key)
                    })
                    const hasAnyGrade = studentGrades.some((g) => !!g)
                    const avgGrade = hasAnyGrade
                      ? studentGrades
                          .filter((g): g is Grade => !!g)
                          .reduce((sum, g) => sum + Number(g.value), 0) /
                        studentGrades.filter((g): g is Grade => !!g).length
                      : null

                    return (
                      <TableRow key={student.id}>
                        <TableCell className="sticky left-0 bg-card z-10">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex items-center justify-center rounded-full shrink-0"
                              style={{
                                width: 28,
                                height: 28,
                                background: avgGrade
                                  ? TONE_CONFIG[gradeTone(avgGrade)].iconBg
                                  : TONE_CONFIG.slate.iconBg,
                                color: avgGrade
                                  ? TONE_CONFIG[gradeTone(avgGrade)].iconColor
                                  : TONE_CONFIG.slate.iconColor,
                              }}
                            >
                              <span className="text-[10px] font-bold">
                                {student.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                              {student.name}
                            </span>
                          </div>
                        </TableCell>

                        {teacherSubjects.map((subj) => {
                          const key = `${student.id}:${subj.id}`
                          const grade = gradeMap.get(key)
                          const tone = grade ? gradeTone(Number(grade.value)) : null
                          const t = tone ? TONE_CONFIG[tone] : null

                          return (
                            <TableCell key={subj.id} className="text-center">
                              {grade ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenGrade(student, subj)}
                                  className={cn(
                                    'inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1 text-sm font-bold tabular-nums transition-all hover:scale-105 cursor-pointer',
                                  )}
                                  style={{
                                    background: t ? t.iconBg : undefined,
                                    color: t ? t.valueColor : 'hsl(var(--foreground))',
                                    minWidth: 48,
                                  }}
                                >
                                  {Number(grade.value).toFixed(1)}
                                  <Pencil size={10} className="opacity-40" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenGrade(student, subj)}
                                  className={cn(
                                    'inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all hover:bg-accent hover:text-accent-foreground cursor-pointer',
                                  )}
                                  style={{
                                    background: 'hsl(var(--muted) / 0.5)',
                                    color: 'hsl(var(--muted-foreground))',
                                    minWidth: 48,
                                  }}
                                >
                                  <Plus size={12} />
                                  Adicionar
                                </button>
                              )}
                            </TableCell>
                          )
                        })}

                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => {
                              const subj = teacherSubjects[0]
                              if (subj) handleOpenGrade(student, subj)
                            }}
                            title="Atribuir nota"
                          >
                            <Pencil size={12} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}

            {/* Summary footer */}
            {!loadingGrades && filteredGrades.length > 0 && (
              <div
                className="px-5 py-2.5 flex items-center gap-4 text-[11px]"
                style={{
                  borderTop: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                <TrendingUp size={12} />
                <span>
                  {filteredGrades.length} nota{filteredGrades.length !== 1 ? 's' : ''} —{' '}
                  Média{' '}
                  {(filteredGrades.reduce((s, g) => s + Number(g.value), 0) / filteredGrades.length).toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: TONE_CONFIG.emerald.valueColor }} />
                  {filteredGrades.filter((g) => Number(g.value) >= 7).length} acima de 7,0
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: TONE_CONFIG.red.valueColor }} />
                  {filteredGrades.filter((g) => Number(g.value) < 5).length} abaixo de 5,0
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Grade Dialog ─────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); setGradeDialog(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {gradeDialog?.existingGrade ? 'Editar nota' : 'Registrar nota'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {gradeDialog?.existingGrade ? 'Edite a nota do aluno' : 'Registre a nota do aluno'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitGrade)} className="space-y-5">
            <div className="space-y-1">
              <Label className="text-xs">Aluno</Label>
              <div
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
                style={{ background: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--foreground))' }}
              >
                {gradeDialog?.studentName}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Disciplina</Label>
              <div
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
                style={{ background: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--foreground))' }}
              >
                {gradeDialog?.subjectName}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Período</Label>
              <div
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
                style={{ background: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--foreground))' }}
              >
                {periods?.find((p) => p.id === effectivePeriodId)?.name ?? effectivePeriodId}
              </div>
            </div>

            <div className="space-y-1">
              <Label>
                Nota <span className="text-muted-foreground font-normal">(0 – 10)</span>
              </Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="Ex: 7.5"
                className="text-lg font-bold tabular-nums h-12"
                {...register('value')}
              />
              {errors.value && (
                <p className="text-xs text-destructive mt-1">{errors.value.message}</p>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setDialogOpen(false); setGradeDialog(null) }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={registerGrade.isPending}>
                {registerGrade.isPending ? 'Salvando...' : gradeDialog?.existingGrade ? 'Atualizar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
