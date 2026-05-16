import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AxiosError } from 'axios'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { useCreateClass, useUpdateClass, useAcademicPeriods } from '../hooks/useClasses'
import { useSeries } from '../../series/hooks/useSeries'
import { toast } from '../../../lib/toast'
import type { SchoolClass } from '@education-gestor/types'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  shift: z.string().min(1, 'Turno obrigatório'),
  serieId: z.string().optional(),
  academicPeriodId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ClassDialogProps {
  open: boolean
  onClose: () => void
  schoolClass?: SchoolClass
}

export function ClassDialog({ open, onClose, schoolClass }: ClassDialogProps) {
  const isEdit = !!schoolClass
  const { data: periods } = useAcademicPeriods()
  const { data: seriesList } = useSeries()
  const createMutation = useCreateClass()
  const updateMutation = useUpdateClass(schoolClass?.id ?? '')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', shift: '', serieId: '', academicPeriodId: '' },
  })

  const shiftValue = watch('shift')
  const serieIdValue = watch('serieId')
  const periodIdValue = watch('academicPeriodId')

  useEffect(() => {
    if (schoolClass) {
      reset({
        name: schoolClass.name,
        shift: schoolClass.shift,
        serieId: schoolClass.serieId ?? '',
        academicPeriodId: schoolClass.academicPeriodId ?? '',
      })
    } else {
      reset({ name: '', shift: '', serieId: '', academicPeriodId: '' })
    }
  }, [schoolClass, reset])

  function onSubmit(data: FormData) {
    const payload = {
      name: data.name,
      shift: data.shift,
      serieId: data.serieId || null,
      academicPeriodId: data.academicPeriodId || null,
    }

    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(isEdit ? 'Turma atualizada' : 'Turma criada com sucesso')
        onClose()
      },
      onError: (err) => {
        const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message
        toast.error(msg ?? 'Erro inesperado')
      },
    })
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar turma' : 'Nova turma'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input placeholder="Ex: 1A, 2B..." {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Turno *</Label>
            <Select value={shiftValue} onValueChange={(v) => setValue('shift', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manhã">Manhã</SelectItem>
                <SelectItem value="tarde">Tarde</SelectItem>
                <SelectItem value="noite">Noite</SelectItem>
                <SelectItem value="integral">Integral</SelectItem>
              </SelectContent>
            </Select>
            {errors.shift && <p className="text-xs text-destructive">{errors.shift.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Série (opcional)</Label>
            <Select
              value={serieIdValue ?? ''}
              onValueChange={(v) => setValue('serieId', v === 'none' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a série" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {seriesList?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.educationLevel ? `${s.educationLevel.name} — ` : ''}{s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Período letivo (opcional)</Label>
            <Select
              value={periodIdValue ?? ''}
              onValueChange={(v) => setValue('academicPeriodId', v === 'none' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {periods?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
