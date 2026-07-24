import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AxiosError } from 'axios'
import {
  useTimetableSlots,
  useCreateTimetableSlot,
  useUpdateTimetableSlot,
  useDeleteTimetableSlot,
  WEEK_DAY_LABELS,
  WEEK_DAYS_ORDER,
} from '../hooks/useTimetable'
import type { TimetableSlot } from '../hooks/useTimetable'
import { useClass, useAcademicPeriods } from '../../classes/hooks/useClasses'
import { useSubjects } from '../../subjects/hooks/useSubjects'
import { useAllTeachers } from '../../teachers/hooks/useTeachers'
import { toast } from '../../../lib/toast'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Skeleton } from '../../../components/ui/skeleton'
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

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

const slotSchema = z.object({
  academicPeriodId: z.string().uuid('Período obrigatório'),
  subjectId: z.string().uuid('Disciplina obrigatória'),
  teacherId: z.string().uuid('Professor obrigatório'),
  weekDay: z.enum(WEEK_DAYS, { errorMap: () => ({ message: 'Dia obrigatório' }) }),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
})

type SlotForm = z.infer<typeof slotSchema>

export function TimetablePage() {
  const { id: classId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: schoolClass } = useClass(classId!)
  const { data: slots, isLoading } = useTimetableSlots(classId!)
  const { data: periods } = useAcademicPeriods()
  const { data: subjects } = useSubjects()
  const { data: teachers } = useAllTeachers()
  const createMutation = useCreateTimetableSlot()
  const updateMutation = useUpdateTimetableSlot(classId!)
  const deleteMutation = useDeleteTimetableSlot(classId!)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TimetableSlot | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SlotForm>({
    resolver: zodResolver(slotSchema),
    defaultValues: {
      academicPeriodId: schoolClass?.academicPeriodId ?? '',
      subjectId: '',
      teacherId: '',
      weekDay: 'monday',
      startTime: '',
      endTime: '',
    },
  })

  const weekDayValue = watch('weekDay')
  const subjectIdValue = watch('subjectId')
  const teacherIdValue = watch('teacherId')
  const periodIdValue = watch('academicPeriodId')

  function handleCreate() {
    setEditing(undefined)
    reset({
      academicPeriodId: schoolClass?.academicPeriodId ?? '',
      subjectId: '',
      teacherId: '',
      weekDay: 'monday',
      startTime: '',
      endTime: '',
    })
    setDialogOpen(true)
  }

  function handleEdit(slot: TimetableSlot) {
    setEditing(slot)
    reset({
      academicPeriodId: slot.academicPeriodId,
      subjectId: slot.subjectId,
      teacherId: slot.teacherId,
      weekDay: slot.weekDay as typeof WEEK_DAYS[number],
      startTime: slot.startTime,
      endTime: slot.endTime,
    })
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
    setEditing(undefined)
  }

  function onSubmit(data: SlotForm) {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data },
        {
          onSuccess: () => {
            toast.success('Horário atualizado')
            handleClose()
          },
          onError: (err) => {
            const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message
            toast.error(msg ?? 'Erro inesperado')
          },
        },
      )
    } else {
      createMutation.mutate(
        { classId: classId!, ...data },
        {
          onSuccess: () => {
            toast.success('Horário adicionado')
            handleClose()
          },
          onError: (err) => {
            const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message
            toast.error(msg ?? 'Erro inesperado')
          },
        },
      )
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  // Agrupar slots por dia da semana (apenas dias que têm slots)
  const slotsByDay = WEEK_DAYS_ORDER.reduce<Record<string, TimetableSlot[]>>((acc, day) => {
    const daySlots = slots?.filter((s) => s.weekDay === day) ?? []
    if (daySlots.length > 0) acc[day] = daySlots
    return acc
  }, {})

  const hasSlots = slots && slots.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/classes/${classId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">
            Grade Horária — {schoolClass?.name ?? '...'}
          </h1>
          {schoolClass && (
            <p className="text-sm text-muted-foreground">
              {schoolClass.serie?.name ?? '—'} · {schoolClass.shift}
              {schoolClass.academicPeriod ? ` · ${schoolClass.academicPeriod.name}` : ''}
            </p>
          )}
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Novo horário
          </Button>
        </div>
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
            Nenhum horário cadastrado. Clique em "Novo horário" para começar.
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
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-mono text-muted-foreground w-20">
                            {slot.startTime} – {slot.endTime}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{slot.subject.name}</p>
                            <p className="text-xs text-muted-foreground">{slot.teacher.name}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(slot)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(slot.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar horário' : 'Novo horário'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Período letivo *</Label>
              <Select value={periodIdValue} onValueChange={(v) => setValue('academicPeriodId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {periods?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.academicPeriodId && (
                <p className="text-xs text-destructive">{errors.academicPeriodId.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Dia da semana *</Label>
                <Select value={weekDayValue} onValueChange={(v) => setValue('weekDay', v as typeof WEEK_DAYS[number])}>
                  <SelectTrigger>
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
              <div className="space-y-1 invisible" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Início *</Label>
                <Input type="time" {...register('startTime')} />
                {errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Fim *</Label>
                <Input type="time" {...register('endTime')} />
                {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Disciplina *</Label>
              <Select value={subjectIdValue} onValueChange={(v) => setValue('subjectId', v)}>
                <SelectTrigger>
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
              <Label>Professor *</Label>
              <Select value={teacherIdValue} onValueChange={(v) => setValue('teacherId', v)}>
                <SelectTrigger>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Salvando...' : 'Salvar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Este horário será removido da grade. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteMutation.mutate(deleteTarget!, {
                  onSuccess: () => {
                    toast.success('Horário removido')
                    setDeleteTarget(null)
                  },
                  onError: (err) => {
                    const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message
                    toast.error(msg ?? 'Erro inesperado')
                    setDeleteTarget(null)
                  },
                })
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
