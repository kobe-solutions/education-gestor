import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { useTuitions, useCreateTuition, useRegisterPayment } from '../hooks/useFinancial'
import { useStudents } from '../../students/hooks/useStudents'
import { TuitionStatusBadge } from '../components/TuitionStatusBadge'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import type { Tuition } from '@education-gestor/types'

const tuitionSchema = z.object({
  studentId: z.string().min(1, 'Selecione o aluno'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
})

type TuitionForm = z.infer<typeof tuitionSchema>

export function TuitionsPage() {
  const { data: tuitions, isLoading } = useTuitions()
  const { data: students } = useStudents()
  const createMutation = useCreateTuition()
  const payMutation = useRegisterPayment()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmPay, setConfirmPay] = useState<Tuition | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TuitionForm>({
    resolver: zodResolver(tuitionSchema),
  })

  const studentIdValue = watch('studentId')

  function onSubmit(data: TuitionForm) {
    createMutation.mutate(data, { onSuccess: () => { setDialogOpen(false); reset() } })
  }

  function handlePay(tuition: Tuition) {
    payMutation.mutate(tuition.id, { onSuccess: () => setConfirmPay(null) })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mensalidades</h1>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova mensalidade
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {tuitions?.length ?? 0} mensalidades
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tuitions?.map((t) => {
                  const student = students?.find((s) => s.id === t.studentId)
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{student?.name ?? t.studentId}</TableCell>
                      <TableCell>R$ {parseFloat(t.amount).toFixed(2)}</TableCell>
                      <TableCell>{new Date(t.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell><TuitionStatusBadge status={t.status} /></TableCell>
                      <TableCell>
                        {t.status !== 'paid' && (
                          <Button size="sm" variant="outline" onClick={() => setConfirmPay(t)}>
                            Registrar pagamento
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova mensalidade</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Aluno</Label>
              <Select value={studentIdValue} onValueChange={(v) => setValue('studentId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent>
                  {students?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" placeholder="500.00" {...register('amount')} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Vencimento</Label>
              <Input type="date" {...register('dueDate')} />
              {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmPay} onOpenChange={(v) => !v && setConfirmPay(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar pagamento</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Registrar pagamento de <strong>R$ {confirmPay ? parseFloat(confirmPay.amount).toFixed(2) : ''}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPay(null)}>Cancelar</Button>
            <Button onClick={() => confirmPay && handlePay(confirmPay)} disabled={payMutation.isPending}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
