import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUpdateTuition } from '../hooks/useFinancial'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog'
import { maskBRL, unmaskBRL } from '../lib/brlMask'
import type { Tuition } from '@education-gestor/types'

const tuitionSchema = z.object({
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
})

type TuitionForm = z.infer<typeof tuitionSchema>

interface TuitionEditDialogProps {
  tuition: Tuition | null
  onOpenChange: (open: boolean) => void
}

export function TuitionEditDialog({ tuition, onOpenChange }: TuitionEditDialogProps) {
  const updateMutation = useUpdateTuition()
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TuitionForm>({
    resolver: zodResolver(tuitionSchema),
    values: tuition
      ? { amount: unmaskBRL(maskBRL(String(tuition.amount))), dueDate: tuition.dueDate }
      : undefined,
  })

  const [amountDisplay, setAmountDisplay] = useState(tuition ? maskBRL(String(tuition.amount)) : '')

  const editApiMutation = useApiMutation({
    mutationFn: (data: TuitionForm) => {
      if (!tuition) throw new Error('Nenhuma mensalidade selecionada')
      return updateMutation.mutateAsync({ id: tuition.id, data })
    },
    successMessage: 'Mensalidade atualizada',
    onSuccess: () => { onOpenChange(false); reset() },
  })

  function onSubmit(data: TuitionForm) {
    editApiMutation.mutate(data)
  }

  return (
    <Dialog open={!!tuition} onOpenChange={(v) => { if (!v) { onOpenChange(false); reset() } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar mensalidade</DialogTitle>
          <DialogDescription className="sr-only">Editar valor e vencimento de uma mensalidade</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="submit" disabled={editApiMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
