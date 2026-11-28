import { useState } from 'react'
import { useCreateBulkTuitions } from '../hooks/useFinancial'
import { useClasses } from '../../classes/hooks/useClasses'
import { useSeries } from '../../series/hooks/useSeries'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'

interface TuitionBulkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TuitionBulkDialog({ open, onOpenChange }: TuitionBulkDialogProps) {
  const [scope, setScope] = useState<'school' | 'class' | 'series'>('class')
  const [classId, setClassId] = useState('')
  const [seriesId, setSeriesId] = useState('')
  const [amount, setAmount] = useState('')
  const [firstDueDate, setFirstDueDate] = useState('')
  const [installments, setInstallments] = useState('1')

  const { data: classes = [] } = useClasses()
  const { data: seriesList = [] } = useSeries()
  const bulkMutation = useCreateBulkTuitions()

  const bulkApi = useApiMutation({
    mutationFn: () =>
      bulkMutation.mutateAsync({
        scope,
        ...(scope === 'class' ? { classId } : {}),
        ...(scope === 'series' ? { seriesId } : {}),
        amount: Number(amount),
        firstDueDate,
        installments: Number(installments) || 1,
      }),
    successMessage: 'Mensalidades geradas em lote com sucesso!',
    onSuccess: () => {
      setAmount('')
      setFirstDueDate('')
      setInstallments('1')
      onOpenChange(false)
    },
  })

  const canSubmit =
    Number(amount) > 0 &&
    !!firstDueDate &&
    Number(installments) >= 1 &&
    Number(installments) <= 12 &&
    (scope === 'school' || (scope === 'class' && !!classId) || (scope === 'series' && !!seriesId))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    bulkApi.mutate(undefined as unknown as void)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar mensalidades em lote</DialogTitle>
          <DialogDescription>
            Crie cobranças mensais para todos os alunos ativos de uma turma, série ou de toda a escola.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bulk-scope">Público-alvo *</Label>
            <select
              id="bulk-scope"
              value={scope}
              onChange={(e) => setScope(e.target.value as 'school' | 'class' | 'series')}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="class">Turma específica</option>
              <option value="series">Série específica</option>
              <option value="school">Toda a escola (alunos ativos)</option>
            </select>
          </div>

          {scope === 'class' && (
            <div className="space-y-1.5">
              <Label htmlFor="bulk-class">Turma *</Label>
              <select
                id="bulk-class"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">Selecione uma turma</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {scope === 'series' && (
            <div className="space-y-1.5">
              <Label htmlFor="bulk-series">Série *</Label>
              <select
                id="bulk-series"
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">Selecione uma série</option>
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bulk-amount">Valor (R$) *</Label>
              <Input
                id="bulk-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bulk-due-date">1º Vencimento *</Label>
              <Input
                id="bulk-due-date"
                type="date"
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bulk-installments">Meses (1 a 12) *</Label>
              <Input
                id="bulk-installments"
                type="number"
                min={1}
                max={12}
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit || bulkApi.isPending}>
              {bulkApi.isPending ? 'Gerando...' : 'Gerar mensalidades'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
