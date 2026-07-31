import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateTuition } from '../hooks/useFinancial'
import { useStudents } from '../../students/hooks/useStudents'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'

function maskBRL(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const raw = parseInt(digits, 10)
  const formatted = (raw / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
  return formatted
}

function unmaskBRL(value: string) {
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

const tuitionSchema = z.object({
  studentId: z.string().min(1, 'Selecione o aluno'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
})

type TuitionForm = z.infer<typeof tuitionSchema>

interface TuitionCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TuitionCreateDialog({ open, onOpenChange }: TuitionCreateDialogProps) {
  const { data: studentsData } = useStudents()
  const students = studentsData?.data ?? []
  const createMutation = useCreateTuition()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TuitionForm>({
    resolver: zodResolver(tuitionSchema),
  })

  const [amountDisplay, setAmountDisplay] = useState('')
  const studentIdValue = watch('studentId')

  const createApiMutation = useApiMutation({
    mutationFn: (data: TuitionForm) => createMutation.mutateAsync(data),
    successMessage: 'Mensalidade criada',
    onSuccess: () => { onOpenChange(false); reset(); setAmountDisplay('') },
  })

  function onSubmit(data: TuitionForm) {
    createApiMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onOpenChange(false); reset(); setAmountDisplay('') } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova mensalidade</DialogTitle>
          <DialogDescription className="sr-only">Criar uma nova mensalidade para um aluno</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Aluno</Label>
            <Select value={studentIdValue} onValueChange={(v) => { if (v !== null) setValue('studentId', v) }}
              items={students?.map((s) => ({ value: s.id, label: s.name }))}>
              <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
              <SelectContent>
                {students?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.studentId && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.studentId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Valor (R$)</Label>
            <Input
              placeholder="R$ 500,00"
              value={amountDisplay}
              onChange={(e) => {
                const raw = e.target.value
                const masked = maskBRL(raw.replace(/[R$\s.]/g, '').replace(',', '.'))
                setAmountDisplay(masked)
                setValue('amount', unmaskBRL(masked))
              }}
              onFocus={(e) => { if (!amountDisplay) setAmountDisplay('R$ 0,00') }}
            />
            {errors.amount && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.amount.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Vencimento</Label>
            <Input type="date" {...register('dueDate')} />
            {errors.dueDate && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.dueDate.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createApiMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
