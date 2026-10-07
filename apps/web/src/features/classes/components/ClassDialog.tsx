import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { extractErrorMessage } from '../../../lib/errors'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { useCreateClass, useUpdateClass } from '../hooks/useClasses'
import { useAcademicYears } from '../hooks/useAcademicYears'
import { useSeries } from '../../series/hooks/useSeries'
import { toast } from '../../../lib/toast'
import type { SchoolClass } from '@education-gestor/types'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  shift: z.string().min(1, 'Turno obrigatório'),
  serieId: z.string().optional(),
  academicYearId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ClassDialogProps {
  open: boolean
  onClose: () => void
  schoolClass?: SchoolClass
}

export function ClassDialog({ open, onClose, schoolClass }: ClassDialogProps) {
  const isEdit = !!schoolClass
  const { data: academicYears } = useAcademicYears()
  const { data: seriesList } = useSeries()
  const createMutation = useCreateClass()
  const updateMutation = useUpdateClass(schoolClass?.id ?? '')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', shift: '', serieId: '', academicYearId: '' },
  })

  const shiftValue = watch('shift')
  const serieIdValue = watch('serieId')
  const academicYearIdValue = watch('academicYearId')

  useEffect(() => {
    if (schoolClass) {
      reset({
        name: schoolClass.name,
        shift: schoolClass.shift,
        serieId: schoolClass.serieId ?? '',
        academicYearId: schoolClass.academicYearId ?? '',
      })
    } else {
      reset({ name: '', shift: '', serieId: '', academicYearId: '' })
    }
  }, [schoolClass, reset])

  function onSubmit(data: FormData) {
    const payload = {
      name: data.name,
      shift: data.shift,
      serieId: data.serieId || null,
      academicYearId: data.academicYearId || null,
    }

    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(isEdit ? 'Turma atualizada' : 'Turma criada com sucesso')
        onClose()
      },
      onError: (err) => {
        const msg = extractErrorMessage(err)
        toast.error(msg)
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
            <Select value={shiftValue} onValueChange={(v) => { if (v !== null) setValue('shift', v) }}
              items={[{ value: 'manhã', label: 'Manhã' }, { value: 'tarde', label: 'Tarde' }, { value: 'noite', label: 'Noite' }, { value: 'integral', label: 'Integral' }]}>
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
              onValueChange={(v) => { if (v !== null) setValue('serieId', v === 'none' ? '' : v) }}
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
            <Label>Ano letivo (opcional)</Label>
            <Select
              value={academicYearIdValue ?? ''}
              onValueChange={(v) => { if (v !== null) setValue('academicYearId', v === 'none' ? '' : v) }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano letivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {academicYears?.map((year) => (
                  <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
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
