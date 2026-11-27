import { useEffect, useMemo, useState } from 'react'
import {
  Calculator,
  Check,
  Pencil,
  Plus,
  Save,
  Trash2,
  ClipboardList,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog'
import { cn } from '../../../lib/utils'
import { toast } from '../../../lib/toast'
import {
  useClassAssessments,
  useClassGradeConfigs,
  useCreateAssessment,
  useDeleteAssessment,
  useRegisterBulkGrades,
  useUpdateAssessment,
  useUpsertPeriodGradeConfig,
} from '../hooks/useAcademic'
import { AssessmentDialog } from './AssessmentDialog'
import type {
  AcademicPeriod,
  Assessment,
  Grade,
  GradeCalculationMethod,
} from '@education-gestor/types'

interface GradeGridProps {
  classId: string
  subjectId: string
  teacherId: string
  students: { id: string; name: string }[]
  periods: AcademicPeriod[]
  grades: Grade[]
  className?: string
}

const SUMMARY_TAB = '__summary__'

function cellKey(studentId: string, periodId: string, assessmentId: string | null) {
  return `${studentId}:${periodId}:${assessmentId ?? 'legacy'}`
}

function isValidValue(value: string) {
  if (value.trim() === '') return true
  const num = Number(value.replace(',', '.'))
  return !Number.isNaN(num) && num >= 0 && num <= 10
}

function isDirtyValue(current: string, original: string | undefined) {
  return current.trim() !== (original ?? '')
}

function computePeriodAverageFromValues(
  entries: Array<{ value: string; weight: number }>,
  method: GradeCalculationMethod,
): number | null {
  const valid = entries
    .map((e) => ({ num: Number(e.value.replace(',', '.')), weight: e.weight }))
    .filter((e) => e.num !== undefined && !Number.isNaN(e.num) && entries.some((x) => x.value.trim() !== ''))

  const nonEmpty = entries.filter((e) => e.value.trim() !== '')
  if (nonEmpty.length === 0) return null

  const parsed = nonEmpty
    .map((e) => ({ num: Number(e.value.replace(',', '.')), weight: e.weight }))
    .filter((e) => !Number.isNaN(e.num))

  if (parsed.length === 0 || valid.length === 0) return null

  if (method === 'weighted') {
    let weightedSum = 0
    let totalWeight = 0
    for (const item of parsed) {
      if (item.weight > 0) {
        weightedSum += item.num * item.weight
        totalWeight += item.weight
      }
    }
    if (totalWeight > 0) {
      return Math.round((weightedSum / totalWeight) * 100) / 100
    }
  }

  const sum = parsed.reduce((acc, item) => acc + item.num, 0)
  return Math.round((sum / parsed.length) * 100) / 100
}

export function GradeGrid({
  classId,
  subjectId,
  teacherId,
  students,
  periods,
  grades,
  className,
}: GradeGridProps) {
  const sortedPeriods = useMemo(() => [...periods].sort((a, b) => a.order - b.order), [periods])
  const [activeTab, setActiveTab] = useState<string>(() => sortedPeriods[0]?.id ?? SUMMARY_TAB)

  useEffect(() => {
    if (sortedPeriods.length > 0 && activeTab !== SUMMARY_TAB) {
      const exists = sortedPeriods.some((p) => p.id === activeTab)
      if (!exists) setActiveTab(sortedPeriods[0].id)
    }
  }, [sortedPeriods, activeTab])

  const { data: assessments = [] } = useClassAssessments(classId, subjectId)
  const { data: gradeConfigs = [] } = useClassGradeConfigs(classId, subjectId)

  const saveGrades = useRegisterBulkGrades()
  const createAssessment = useCreateAssessment()
  const updateAssessment = useUpdateAssessment()
  const deleteAssessment = useDeleteAssessment()
  const upsertConfig = useUpsertPeriodGradeConfig()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null)
  const [deletingAssessment, setDeletingAssessment] = useState<Assessment | null>(null)

  const assessmentsByPeriod = useMemo(() => {
    const map = new Map<string, Assessment[]>()
    for (const assessment of assessments) {
      if (assessment.subjectId !== subjectId) continue
      const list = map.get(assessment.academicPeriodId) ?? []
      list.push(assessment)
      map.set(assessment.academicPeriodId, list)
    }
    return map
  }, [assessments, subjectId])

  const methodByPeriod = useMemo(() => {
    const map = new Map<string, GradeCalculationMethod>()
    for (const cfg of gradeConfigs) {
      if (cfg.subjectId === subjectId) {
        map.set(cfg.academicPeriodId, cfg.calculationMethod)
      }
    }
    return map
  }, [gradeConfigs, subjectId])

  const originalGradesMap = useMemo(() => {
    const map = new Map<string, { id: string; value: string }>()
    for (const g of grades) {
      if (g.subjectId === subjectId) {
        map.set(cellKey(g.studentId, g.academicPeriodId, g.assessmentId ?? null), {
          id: g.id,
          value: g.value,
        })
      }
    }
    return map
  }, [grades, subjectId])

  const [values, setValues] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState<Set<string>>(new Set())

  useEffect(() => {
    const map: Record<string, string> = {}
    for (const [key, entry] of originalGradesMap.entries()) {
      map[key] = entry.value
    }
    setValues(map)
    setDirty(new Set())
  }, [classId, subjectId, originalGradesMap])

  const changedCount = dirty.size
  const invalidKeys = useMemo(() => {
    const result = new Set<string>()
    for (const key of dirty) {
      const value = values[key] ?? ''
      if (!isValidValue(value)) result.add(key)
    }
    return result
  }, [dirty, values])

  function handleChange(
    studentId: string,
    periodId: string,
    assessmentId: string | null,
    raw: string,
  ) {
    const key = cellKey(studentId, periodId, assessmentId)
    const value = raw.replace(',', '.')

    setValues((prev) => ({ ...prev, [key]: value }))
    setDirty((prev) => {
      const next = new Set(prev)
      if (isDirtyValue(value, originalGradesMap.get(key)?.value)) next.add(key)
      else next.delete(key)
      return next
    })
  }

  function handleSave() {
    const gradesToUpsert: Array<{
      studentId: string
      academicPeriodId: string
      assessmentId: string | null
      value: number
    }> = []
    const deleteGradeIds: string[] = []

    for (const key of dirty) {
      if (invalidKeys.has(key)) continue
      const [studentId, academicPeriodId, rawAssessmentId] = key.split(':')
      const assessmentId = rawAssessmentId === 'legacy' ? null : rawAssessmentId
      const rawVal = (values[key] ?? '').trim()

      if (rawVal === '') {
        const existing = originalGradesMap.get(key)
        if (existing) deleteGradeIds.push(existing.id)
      } else {
        const num = Number(rawVal)
        if (!Number.isNaN(num)) {
          gradesToUpsert.push({ studentId, academicPeriodId, assessmentId, value: num })
        }
      }
    }

    saveGrades.mutate(
      {
        classId,
        subjectId,
        teacherId,
        grades: gradesToUpsert,
        deleteGradeIds: deleteGradeIds.length > 0 ? deleteGradeIds : undefined,
      },
      {
        onSuccess: () => {
          setDirty(new Set())
        },
      },
    )
  }

  function handleMethodChange(periodId: string, method: GradeCalculationMethod) {
    upsertConfig.mutate(
      {
        classId,
        subjectId,
        academicPeriodId: periodId,
        calculationMethod: method,
      },
      {
        onSuccess: () => {
          toast.success(
            method === 'weighted'
              ? 'Cálculo atualizado para Média Ponderada'
              : 'Cálculo atualizado para Média Simples',
          )
        },
      },
    )
  }

  function openCreateDialog() {
    setEditingAssessment(null)
    setDialogOpen(true)
  }

  function openEditDialog(assessment: Assessment) {
    setEditingAssessment(assessment)
    setDialogOpen(true)
  }

  function handleAssessmentSubmit(periodId: string, formValues: { name: string; weight: number }) {
    if (editingAssessment) {
      updateAssessment.mutate(
        {
          id: editingAssessment.id,
          classId,
          name: formValues.name,
          weight: formValues.weight,
        },
        {
          onSuccess: () => {
            toast.success('Avaliação atualizada')
            setDialogOpen(false)
            setEditingAssessment(null)
          },
        },
      )
    } else {
      createAssessment.mutate(
        {
          classId,
          subjectId,
          academicPeriodId: periodId,
          teacherId,
          name: formValues.name,
          weight: formValues.weight,
        },
        {
          onSuccess: () => {
            toast.success('Avaliação adicionada')
            setDialogOpen(false)
          },
        },
      )
    }
  }

  function handleConfirmDelete() {
    if (!deletingAssessment) return
    deleteAssessment.mutate(
      { id: deletingAssessment.id, classId },
      {
        onSuccess: () => {
          toast.success('Avaliação excluída')
          setDeletingAssessment(null)
        },
      },
    )
  }

  function getStudentPeriodAverage(studentId: string, periodId: string): number | null {
    const periodAssessments = assessmentsByPeriod.get(periodId) ?? []
    const method = methodByPeriod.get(periodId) ?? 'simple'

    if (periodAssessments.length > 0) {
      const entries = periodAssessments.map((a) => ({
        value: values[cellKey(studentId, periodId, a.id)] ?? '',
        weight: Number(a.weight),
      }))
      return computePeriodAverageFromValues(entries, method)
    }

    const legacyVal = values[cellKey(studentId, periodId, null)] ?? ''
    if (legacyVal.trim() === '') return null
    const num = Number(legacyVal.replace(',', '.'))
    return Number.isNaN(num) ? null : Math.round(num * 100) / 100
  }

  const canSave = changedCount > 0 && invalidKeys.size === 0 && !saveGrades.isPending
  const activePeriod = sortedPeriods.find((p) => p.id === activeTab) ?? null

  return (
    <div className={cn('space-y-4', className)}>
      {/* ── Top Save Bar ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {changedCount > 0 ? (
            <>
              <span className="inline-block size-2 rounded-full bg-primary" />
              {changedCount} alteração{changedCount !== 1 ? 'ões' : ''} não salva
              {changedCount !== 1 ? 's' : ''}
            </>
          ) : (
            <>
              <Check className="size-4 text-green-600" />
              Todas as notas salvas
            </>
          )}
        </div>
        <Button size="sm" onClick={handleSave} disabled={!canSave}>
          <Save className="size-4" />
          Salvar tudo
        </Button>
      </div>

      {/* ── Period Tabs ───────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(String(v))}>
        <TabsList className="flex-wrap h-auto">
          {sortedPeriods.map((period) => {
            const count = assessmentsByPeriod.get(period.id)?.length ?? 0
            return (
              <TabsTrigger key={period.id} value={period.id}>
                <span>{period.name}</span>
                {count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[11px] tabular-nums">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
          <TabsTrigger value={SUMMARY_TAB}>Resumo (Médias)</TabsTrigger>
        </TabsList>

        {sortedPeriods.map((period) => {
          const periodAssessments = assessmentsByPeriod.get(period.id) ?? []
          const method = methodByPeriod.get(period.id) ?? 'simple'
          const hasLegacyGrades = students.some(
            (s) => (values[cellKey(s.id, period.id, null)] ?? '').trim() !== '',
          )

          return (
            <TabsContent key={period.id} value={period.id} className="space-y-4 pt-2">
              {/* ── Period Configuration Toolbar ──────────── */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Calculator className="size-4" />
                    <span>Cálculo da média:</span>
                  </div>
                  <div className="inline-flex rounded-md border bg-background p-0.5">
                    <button
                      type="button"
                      onClick={() => handleMethodChange(period.id, 'simple')}
                      disabled={upsertConfig.isPending}
                      className={cn(
                        'rounded-sm px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                        method === 'simple'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Média Simples
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMethodChange(period.id, 'weighted')}
                      disabled={upsertConfig.isPending}
                      className={cn(
                        'rounded-sm px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                        method === 'weighted'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Média Ponderada
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground hidden md:inline">
                    {method === 'weighted'
                      ? 'Usa os pesos definidos em cada avaliação.'
                      : 'Todas as avaliações têm o mesmo peso.'}
                  </span>
                </div>

                <Button size="sm" variant="outline" onClick={openCreateDialog}>
                  <Plus className="size-4" />
                  Adicionar avaliação
                </Button>
              </div>

              {/* ── Assessments Table or Empty Prompt ───────── */}
              {periodAssessments.length === 0 && !hasLegacyGrades ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 px-4 text-center">
                  <ClipboardList className="size-9 text-muted-foreground/60 mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    Nenhuma avaliação cadastrada em {period.name}
                  </p>
                  <p className="mt-1 max-w-md text-xs text-muted-foreground">
                    Adicione métodos de avaliação (ex: Prova 1, Trabalho, Seminário) para lançar as notas dos alunos neste período.
                  </p>
                  <Button size="sm" className="mt-4" onClick={openCreateDialog}>
                    <Plus className="size-4" />
                    Adicionar primeira avaliação
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 z-10 min-w-52 bg-card">Aluno</TableHead>
                        {periodAssessments.length > 0 ? (
                          periodAssessments.map((assessment) => (
                            <TableHead key={assessment.id} className="min-w-36 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-medium truncate max-w-28" title={assessment.name}>
                                  {assessment.name}
                                </span>
                                {method === 'weighted' && (
                                  <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
                                    Peso {Number(assessment.weight)}
                                  </Badge>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openEditDialog(assessment)}
                                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                                  aria-label={`Editar ${assessment.name}`}
                                  title="Editar avaliação"
                                >
                                  <Pencil className="size-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingAssessment(assessment)}
                                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                  aria-label={`Excluir ${assessment.name}`}
                                  title="Excluir avaliação"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            </TableHead>
                          ))
                        ) : (
                          <TableHead className="min-w-36 text-center">
                            Nota do período
                          </TableHead>
                        )}
                        <TableHead className="w-28 text-center bg-muted/40">
                          Média {method === 'weighted' ? '(Pond.)' : '(Simp.)'}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => {
                        const avg = getStudentPeriodAverage(student.id, period.id)
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="sticky left-0 z-10 min-w-52 bg-card font-medium">
                              {student.name}
                            </TableCell>
                            {periodAssessments.length > 0 ? (
                              periodAssessments.map((assessment) => {
                                const key = cellKey(student.id, period.id, assessment.id)
                                const value = values[key] ?? ''
                                const isCellDirty = dirty.has(key)
                                const isInvalid = invalidKeys.has(key)

                                return (
                                  <TableCell key={assessment.id} className="p-1.5 text-center">
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min={0}
                                      max={10}
                                      inputMode="decimal"
                                      placeholder="—"
                                      aria-label={`Nota de ${student.name} em ${assessment.name}`}
                                      value={value}
                                      onChange={(e) =>
                                        handleChange(student.id, period.id, assessment.id, e.target.value)
                                      }
                                      className={cn(
                                        'h-8 w-full min-w-16 text-center tabular-nums',
                                        isCellDirty && 'border-primary/60 bg-primary/5 ring-2 ring-primary/15',
                                        isInvalid && 'border-destructive bg-destructive/5 ring-2 ring-destructive/20',
                                      )}
                                    />
                                  </TableCell>
                                )
                              })
                            ) : (
                              (() => {
                                const key = cellKey(student.id, period.id, null)
                                const value = values[key] ?? ''
                                const isCellDirty = dirty.has(key)
                                const isInvalid = invalidKeys.has(key)
                                return (
                                  <TableCell className="p-1.5 text-center">
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min={0}
                                      max={10}
                                      inputMode="decimal"
                                      placeholder="—"
                                      aria-label={`Nota de ${student.name} em ${period.name}`}
                                      value={value}
                                      onChange={(e) =>
                                        handleChange(student.id, period.id, null, e.target.value)
                                      }
                                      className={cn(
                                        'h-8 w-full min-w-16 text-center tabular-nums',
                                        isCellDirty && 'border-primary/60 bg-primary/5 ring-2 ring-primary/15',
                                        isInvalid && 'border-destructive bg-destructive/5 ring-2 ring-destructive/20',
                                      )}
                                    />
                                  </TableCell>
                                )
                              })()
                            )}
                            <TableCell className="text-center font-semibold tabular-nums bg-muted/20">
                              {avg !== null ? (
                                <span
                                  className={cn(
                                    avg >= 6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
                                  )}
                                >
                                  {avg.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground font-normal">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          )
        })}

        {/* ── Summary Tab (All Periods) ───────────────────── */}
        <TabsContent value={SUMMARY_TAB} className="pt-2">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 min-w-52 bg-card">Aluno</TableHead>
                  {sortedPeriods.map((period) => (
                    <TableHead key={period.id} className="w-28 text-center">
                      {period.name}
                    </TableHead>
                  ))}
                  <TableHead className="w-28 text-center bg-muted/40">Média Geral</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const periodAverages = sortedPeriods.map((p) =>
                    getStudentPeriodAverage(student.id, p.id),
                  )
                  const validAverages = periodAverages.filter((v): v is number => v !== null)
                  const overall =
                    validAverages.length > 0
                      ? Math.round(
                          (validAverages.reduce((a, b) => a + b, 0) / validAverages.length) * 100,
                        ) / 100
                      : null

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="sticky left-0 z-10 min-w-52 bg-card font-medium">
                        {student.name}
                      </TableCell>
                      {periodAverages.map((avg, idx) => (
                        <TableCell key={sortedPeriods[idx].id} className="text-center tabular-nums">
                          {avg !== null ? avg.toFixed(2) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold tabular-nums bg-muted/20">
                        {overall !== null ? (
                          <span
                            className={cn(
                              overall >= 6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
                            )}
                          >
                            {overall.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-normal">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Create/Edit Assessment Dialog ─────────────────── */}
      {activePeriod && (
        <AssessmentDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditingAssessment(null)
          }}
          periodName={activePeriod.name}
          assessment={editingAssessment}
          calculationMethod={methodByPeriod.get(activePeriod.id) ?? 'simple'}
          isPending={createAssessment.isPending || updateAssessment.isPending}
          onSubmit={(vals) => handleAssessmentSubmit(activePeriod.id, vals)}
        />
      )}

      {/* ── Delete Assessment Confirmation ────────────────── */}
      <AlertDialog
        open={!!deletingAssessment}
        onOpenChange={(open) => {
          if (!open) setDeletingAssessment(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir avaliação?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{' '}
              <span className="font-semibold text-foreground">{deletingAssessment?.name}</span>?
              Todas as notas lançadas nesta avaliação também serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteAssessment.isPending}
            >
              {deleteAssessment.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
