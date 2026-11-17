import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Plus, Trash2, Pencil, List, CalendarDays } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useTimetableSlots,
  useAllTimetableSlots,
  useCreateTimetableSlotsBatch,
  useUpdateTimetableSlot,
  useDeleteTimetableSlot,
  WEEK_DAY_LABELS,
  WEEK_DAYS_ORDER,
} from '../hooks/useTimetable'
import type { TimetableSlot } from '../hooks/useTimetable'
import { formatShiftLabel } from '../../../lib/labels'
import { WeekGrid } from '../components/WeekGrid'
import { useClass, useClassPeriods } from '../../classes/hooks/useClasses'
import { useAcademicYears } from '../../classes/hooks/useAcademicYears'
import { useSubjects } from '../../subjects/hooks/useSubjects'
import { useAllTeachers } from '../../teachers/hooks/useTeachers'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { Breadcrumbs } from '../../../components/Breadcrumbs'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Skeleton } from '../../../components/ui/skeleton'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { Checkbox } from '../../../components/ui/checkbox'
import { findSelectedPeriodOverlaps, findSlotConflicts } from '../../scheduling/lib/conflicts'
import { toast } from '../../../lib/toast'

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

const slotSchema = z.object({
  classPeriodId: z.string().uuid('Horário obrigatório'),
  subjectId: z.string().uuid('Disciplina obrigatória'),
  teacherId: z.string().uuid('Professor obrigatório'),
  weekDay: z.enum(WEEK_DAYS, { errorMap: () => ({ message: 'Dia obrigatório' }) }),
})

type SlotForm = z.infer<typeof slotSchema>

export function TimetablePage() {
  const { id: classId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { payload } = useAuth()
  const canManage = payload?.role !== 'professor'
  const { data: schoolClass } = useClass(classId!)
  const { data: slots, isLoading } = useTimetableSlots(classId!)
  const { data: allSlots = [] } = useAllTimetableSlots()
  const { data: classPeriods = [] } = useClassPeriods()
  const { data: academicYears = [] } = useAcademicYears()
  const { data: subjects } = useSubjects()
  const { data: teachers } = useAllTeachers()
  const createBatchMutation = useCreateTimetableSlotsBatch()
  const updateMutation = useUpdateTimetableSlot(classId!)
  const deleteMutation = useDeleteTimetableSlot(classId!)

  const updateApiMutation = useApiMutation({
    mutationFn: (vars: { id: string; data: SlotForm }) => updateMutation.mutateAsync(vars),
    successMessage: 'Horário atualizado',
    onSuccess: () => handleClose(),
  })

  const deleteApiMutation = useApiMutation({
    mutationFn: (id: string) => deleteMutation.mutateAsync(id),
    successMessage: 'Horário removido',
    onSuccess: () => setDeleteTarget(null),
    onError: () => setDeleteTarget(null),
  })

  const activeYear = academicYears.find((y) => y.status === 'active')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TimetableSlot | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'week'>('list')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([])

  const formValues: SlotForm = editing ? {
    classPeriodId: editing.classPeriodId,
    subjectId: editing.subjectId,
    teacherId: editing.teacherId,
    weekDay: editing.weekDay as typeof WEEK_DAYS[number],
  } : {
    classPeriodId: classPeriods[0]?.id ?? '',
    subjectId: '',
    teacherId: '',
    weekDay: 'monday',
  }

  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<SlotForm>({
    resolver: zodResolver(slotSchema),
    values: formValues,
  })

  const weekDayValue = watch('weekDay')
  const subjectIdValue = watch('subjectId')
  const teacherIdValue = watch('teacherId')
  const classPeriodIdValue = watch('classPeriodId')

  function handleCreate() {
    setEditing(undefined)
    setSelectedDays([])
    setSelectedPeriods([])
    setDialogOpen(true)
  }

  function handleEdit(slot: TimetableSlot) {
    setEditing(slot)
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
    setEditing(undefined)
    setSelectedDays([])
    setSelectedPeriods([])
  }

  function onSubmit(data: SlotForm) {
    if (!activeYear) {
      return
    }

    if (editing) {
      updateApiMutation.mutate({ id: editing.id, data })
    } else {
      if (selectedDays.length === 0 || selectedPeriods.length === 0) return
      createBatchMutation.mutate({
        classId: classId!,
        academicYearId: activeYear.id,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        weekDays: selectedDays,
        classPeriodIds: selectedPeriods,
      }, {
        onSuccess: ({ created }) => {
          toast.success(`${created} ${created === 1 ? 'aula adicionada' : 'aulas adicionadas'} à grade.`)
          handleClose()
        },
      })
    }
  }

  const selectedConflicts = useMemo(() => {
    const existingConflicts = !teacherIdValue ? [] : selectedDays.flatMap((day) => selectedPeriods.flatMap((periodId) => {
      const period = classPeriods.find((item) => item.id === periodId)
      const conflicts = findSlotConflicts(allSlots, classPeriods, {
        teacherId: teacherIdValue,
        weekDay: day,
        classPeriodId: periodId,
      })
      return conflicts.length > 0 && period ? [{ day, period: period.name }] : []
    }))
    const overlapsWithinSelection = findSelectedPeriodOverlaps(selectedDays, selectedPeriods, classPeriods)
      .map(({ weekDay, periodNames }) => ({ day: weekDay, period: `${periodNames.join(' e ')} (horários sobrepostos)` }))
    return [...existingConflicts, ...overlapsWithinSelection]
  }, [allSlots, classPeriods, selectedDays, selectedPeriods, teacherIdValue])

  const isPending = createBatchMutation.isPending || updateApiMutation.isPending

  // Agrupar slots por dia da semana (apenas dias que têm slots)
  const slotsByDay = WEEK_DAYS_ORDER.reduce<Record<string, TimetableSlot[]>>((acc, day) => {
    const daySlots = slots?.filter((s) => s.weekDay === day) ?? []
    if (daySlots.length > 0) acc[day] = daySlots
    return acc
  }, {})

  const hasSlots = slots && slots.length > 0

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Acadêmico', to: '/' },
          { label: 'Turmas', to: '/structure/classes' },
          { label: schoolClass?.name ?? '...', to: `/classes/${classId}` },
          { label: 'Horário' },
        ]}
      />

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Voltar para a turma" onClick={() => navigate(`/classes/${classId}`)}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">
            Grade Horária — {schoolClass?.name ?? '...'}
          </h1>
          {schoolClass && (
            <p className="text-sm text-muted-foreground">
              {schoolClass.serie?.name ?? '—'} · {formatShiftLabel(schoolClass.shift)}
              {schoolClass.academicYear ? ` · ${schoolClass.academicYear.name}` : ''}
            </p>
          )}
        </div>
        {canManage && (
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center rounded-md border p-0.5">
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('list')}
                aria-pressed={view === 'list'}
              >
                <List className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Lista</span>
              </Button>
              <Button
                variant={view === 'week' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('week')}
                aria-pressed={view === 'week'}
              >
                <CalendarDays className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Semana</span>
              </Button>
            </div>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Novo horário
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !hasSlots ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            {canManage
              ? 'Nenhum horário cadastrado. Clique em "Novo horário" para começar.'
              : 'Nenhum horário cadastrado para esta turma.'}
          </CardContent>
        </Card>
      ) : view === 'week' ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Grade Semanal</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <WeekGrid
              slots={slots ?? []}
              classPeriods={classPeriods}
              onSlotClick={canManage ? handleEdit : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(slotsByDay).map(([day, daySlots]) => (
            <Card key={day}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {WEEK_DAY_LABELS[day]}
                  <Badge variant="secondary" className="ml-2 text-xs">{daySlots.length} aulas</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {daySlots
                    .sort((a, b) => a.classPeriod.startTime.localeCompare(b.classPeriod.startTime))
                    .map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-mono text-muted-foreground w-20">
                            {slot.classPeriod.startTime} – {slot.classPeriod.endTime}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{slot.subject.name}</p>
                            <p className="text-xs text-muted-foreground">{slot.teacher.name}</p>
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" aria-label={`Editar aula de ${slot.subject.name}`} onClick={() => handleEdit(slot)}>
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label={`Excluir aula de ${slot.subject.name}`} onClick={() => setDeleteTarget(slot.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar horário' : 'Novo horário'}</DialogTitle>
            {!editing && <p className="text-sm text-muted-foreground">Siga as etapas. Os horários selecionados serão adicionados de uma vez.</p>}
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!editing && <div className="max-h-[58vh] space-y-4 overflow-y-auto pr-1">
              <fieldset className="space-y-2 rounded-lg border p-3">
                <legend className="px-1 text-sm font-semibold">1. Em quais dias?</legend>
                <p className="text-xs text-muted-foreground">Marque todos os dias em que esta aula acontece.</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {WEEK_DAYS.map((day) => (
                    <label key={day} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/40">
                      <Checkbox checked={selectedDays.includes(day)} onCheckedChange={(checked) => setSelectedDays((current) => checked === true ? [...current, day] : current.filter((item) => item !== day))} />
                      {WEEK_DAY_LABELS[day]}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-2 rounded-lg border p-3">
                <legend className="px-1 text-sm font-semibold">2. Em quais aulas?</legend>
                <p className="text-xs text-muted-foreground">Marque um ou mais tempos da turma.</p>
                {classPeriods.length === 0 ? <p className="text-sm text-destructive">Cadastre os tempos de aula da escola antes de montar a grade.</p> : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {classPeriods.map((period) => (
                      <label key={period.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/40">
                        <Checkbox checked={selectedPeriods.includes(period.id)} onCheckedChange={(checked) => setSelectedPeriods((current) => checked === true ? [...current, period.id] : current.filter((item) => item !== period.id))} />
                        <span>{period.name} <span className="text-muted-foreground">({period.startTime}–{period.endTime})</span></span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
            </div>}

            {editing && <>
            <div className="space-y-1">
              <Label htmlFor="timetable-period">Horário *</Label>
              <Select value={classPeriodIdValue} onValueChange={(v) => { if (v !== null) setValue('classPeriodId', v) }}
                items={classPeriods?.map((cp) => ({ value: cp.id, label: `${cp.name} (${cp.startTime}–${cp.endTime})` }))}>
                <SelectTrigger id="timetable-period">
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  {classPeriods?.map((cp) => (
                    <SelectItem key={cp.id} value={cp.id}>{cp.name} ({cp.startTime}–{cp.endTime})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.classPeriodId && (
                <p className="text-xs text-destructive">{errors.classPeriodId.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="timetable-weekday">Dia da semana *</Label>
              <Select value={weekDayValue} onValueChange={(v) => { if (v !== null) setValue('weekDay', v as typeof WEEK_DAYS[number]) }}
                items={WEEK_DAYS.map((d) => ({ value: d, label: WEEK_DAY_LABELS[d] }))}>
                <SelectTrigger id="timetable-weekday">
                  <SelectValue placeholder="Dia" />
                </SelectTrigger>
                <SelectContent>
                  {WEEK_DAYS.map((d) => (
                    <SelectItem key={d} value={d}>{WEEK_DAY_LABELS[d]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.weekDay && <p className="text-xs text-destructive">{errors.weekDay.message}</p>}
            </div>
            </>}
            {!editing && <div>
              <h3 className="text-sm font-semibold">3. Quem dará essas aulas?</h3>
              <p className="text-xs text-muted-foreground">A mesma disciplina e o mesmo professor serão usados nos dias e horários escolhidos.</p>
            </div>}
            <div className="space-y-1">
              <Label htmlFor="timetable-subject">Disciplina *</Label>
              <Select value={subjectIdValue} onValueChange={(v) => { if (v !== null) setValue('subjectId', v) }}
                items={subjects?.map((s) => ({ value: s.id, label: s.name }))}>
                <SelectTrigger id="timetable-subject">
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subjectId && <p className="text-xs text-destructive">{errors.subjectId.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="timetable-teacher">Professor *</Label>
              <Select value={teacherIdValue} onValueChange={(v) => { if (v !== null) setValue('teacherId', v) }}
                items={teachers?.map((t) => ({ value: t.id, label: t.name }))}>
                <SelectTrigger id="timetable-teacher">
                  <SelectValue placeholder="Selecione o professor" />
                </SelectTrigger>
                <SelectContent>
                  {teachers?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.teacherId && <p className="text-xs text-destructive">{errors.teacherId.message}</p>}
            </div>
            {!editing && <>
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm" aria-live="polite">
                {selectedDays.length > 0 && selectedPeriods.length > 0
                  ? `Serão criadas ${selectedDays.length * selectedPeriods.length} aulas: ${selectedDays.map((day) => WEEK_DAY_LABELS[day]).join(', ')} × ${selectedPeriods.length} ${selectedPeriods.length === 1 ? 'horário' : 'horários'}.`
                  : 'Escolha pelo menos um dia e um horário para ver o resumo.'}
              </div>
              {!activeYear && <p role="alert" className="text-sm text-destructive">Defina um ano letivo ativo antes de montar a grade.</p>}
              {selectedConflicts.length > 0 && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                Este professor já tem aula em: {selectedConflicts.map((item) => `${WEEK_DAY_LABELS[item.day]} — ${item.period}`).join('; ')}. Desmarque esses horários ou escolha outro professor.
              </p>}
            </>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={isPending || (!editing && (!activeYear || selectedDays.length === 0 || selectedPeriods.length === 0 || selectedConflicts.length > 0))}>
                {isPending ? 'Salvando...' : editing ? 'Salvar alteração' : `Adicionar ${selectedDays.length * selectedPeriods.length || ''} aulas`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => {
          deleteApiMutation.mutate(deleteTarget!)
        }}
        onCancel={() => setDeleteTarget(null)}
        description="Este horário será removido da grade. Esta ação não pode ser desfeita."
      />
    </div>
  )
}
