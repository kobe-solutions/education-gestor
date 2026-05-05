import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { useCreateClass, useUpdateClass, useAcademicPeriods } from '../hooks/useClasses'
import type { SchoolClass } from '@education-gestor/types'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  grade: z.string().min(1, 'Série obrigatória'),
  shift: z.string().min(1, 'Turno obrigatório'),
  termTime: z.string().min(1, 'Período letivo obrigatório'),
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
  const createMutation = useCreateClass()
  const updateMutation = useUpdateClass(schoolClass?.id ?? '')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', grade: '', shift: '', termTime: '' },
  })

  const shiftValue = watch('shift')
  const termTimeValue = watch('termTime')

  useEffect(() => {
    if (schoolClass) {
      reset({
        name: schoolClass.name,
        grade: schoolClass.grade,
        shift: schoolClass.shift,
        termTime: schoolClass.termTime,
      })
    } else {
      reset({ name: '', grade: '', shift: '', termTime: '' })
    }
  }, [schoolClass, reset])

  function onSubmit(data: FormData) {
    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(data, { onSuccess: onClose })
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
            <Label>Nome</Label>
            <Input placeholder="Ex: 1A, 2B..." {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Série</Label>
            <Input placeholder="Ex: 1, 2, 3..." {...register('grade')} />
            {errors.grade && <p className="text-xs text-destructive">{errors.grade.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Turno</Label>
            <Select value={shiftValue} onValueChange={(v) => setValue('shift', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manhã">Manhã</SelectItem>
                <SelectItem value="tarde">Tarde</SelectItem>
                <SelectItem value="noite">Noite</SelectItem>
              </SelectContent>
            </Select>
            {errors.shift && <p className="text-xs text-destructive">{errors.shift.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Período letivo</Label>
            <Select value={termTimeValue} onValueChange={(v) => setValue('termTime', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {periods?.map((p) => (
                  <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.termTime && <p className="text-xs text-destructive">{errors.termTime.message}</p>}
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
