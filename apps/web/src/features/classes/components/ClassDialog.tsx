import { useEffect, useState } from 'react'
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

  const { register, handleSubmit, reset, setValue, watch, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', shift: '', serieId: '', academicYearId: '' },
  })
  const [step, setStep] = useState(0)

  const shiftValue = watch('shift')
  const serieIdValue = watch('serieId')
  const academicYearIdValue = watch('academicYearId')

  useEffect(() => {
    if (!open) return
    setStep(0)
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
  }, [open, schoolClass, reset])

  async function handleNextStep() {
    const fields: Array<keyof FormData> = step === 0 ? ['name'] : ['shift']
    if (await trigger(fields)) setStep((current) => current + 1)
  }

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
          {!isEdit && <p className="text-sm text-muted-foreground">Vamos organizar as informações em três etapas rápidas.</p>}
        </DialogHeader>
        {!isEdit && (
          <ol aria-label="Etapas para criar uma turma" className="grid grid-cols-3 gap-2">
            {['Identificação', 'Organização', 'Revisão'].map((label, index) => (
              <li key={label} aria-current={step === index ? 'step' : undefined} className={`rounded-lg border px-3 py-2 text-xs ${step === index ? 'border-primary bg-primary/5 text-foreground' : 'text-muted-foreground'}`}>
                <span className="font-semibold">{index + 1}.</span> {label}
              </li>
            ))}
          </ol>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(isEdit || step === 0) && <>
          <div className="space-y-1">
            <Label htmlFor="class-name">Nome *</Label>
            <Input id="class-name" placeholder="Ex: 1A, 2B..." {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="class-series">Série (opcional)</Label>
            <Select
              value={serieIdValue ?? ''}
              onValueChange={(v) => { if (v !== null) setValue('serieId', v === 'none' ? '' : v, { shouldDirty: true }) }}
              items={[
                { value: 'none', label: 'Nenhuma' },
                ...(seriesList?.map((s) => ({ value: s.id, label: `${s.educationLevel ? `${s.educationLevel.name} — ` : ''}${s.name}` })) ?? []),
              ]}
            >
              <SelectTrigger id="class-series"><SelectValue placeholder="Selecione a série" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {seriesList?.map((s) => <SelectItem key={s.id} value={s.id}>{s.educationLevel ? `${s.educationLevel.name} — ` : ''}{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          </>}
          {(isEdit || step === 1) && <>
          <div className="space-y-1">
            <Label htmlFor="class-shift">Turno *</Label>
            <Select value={shiftValue} onValueChange={(v) => { if (v !== null) setValue('shift', v, { shouldDirty: true }) }}
              items={[{ value: 'manhã', label: 'Manhã' }, { value: 'tarde', label: 'Tarde' }, { value: 'noite', label: 'Noite' }, { value: 'integral', label: 'Integral' }]}>
              <SelectTrigger id="class-shift">
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
            <Label htmlFor="class-academic-year">Ano letivo (opcional)</Label>
            <Select
              value={academicYearIdValue ?? ''}
              onValueChange={(v) => { if (v !== null) setValue('academicYearId', v === 'none' ? '' : v, { shouldDirty: true }) }}
              items={[
                { value: 'none', label: 'Nenhuma' },
                ...(academicYears?.map((year) => ({ value: year.id, label: year.name })) ?? []),
              ]}
            >
              <SelectTrigger id="class-academic-year"><SelectValue placeholder="Selecione o ano letivo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {academicYears?.map((year) => <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {academicYears?.length === 0 && <p className="text-xs text-muted-foreground">Nenhum ano letivo cadastrado. Crie um ano letivo antes de organizar esta turma.</p>}
          </div>
          </>}
          {!isEdit && step === 2 && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <h3 className="font-medium">Confira os dados da turma</h3>
              <p className="text-sm"><span className="text-muted-foreground">Nome:</span> {watch('name')}</p>
              <p className="text-sm"><span className="text-muted-foreground">Série:</span> {seriesList?.find((item) => item.id === serieIdValue)?.name ?? 'Não informada'}</p>
              <p className="text-sm"><span className="text-muted-foreground">Turno:</span> {shiftValue || 'Não informado'}</p>
              <p className="text-sm"><span className="text-muted-foreground">Ano letivo:</span> {academicYears?.find((item) => item.id === academicYearIdValue)?.name ?? 'Não informado'}</p>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            {!isEdit && step > 0 && <Button type="button" variant="outline" onClick={() => setStep((current) => current - 1)}>Voltar</Button>}
            {!isEdit && step < 2
              ? <Button type="button" onClick={handleNextStep}>Continuar</Button>
              : <Button type="submit" disabled={isPending}>{isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar turma'}</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
