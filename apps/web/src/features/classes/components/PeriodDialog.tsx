import { useState } from 'react'
import { extractErrorMessage } from '../../../lib/errors'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { useApiMutation } from '../../../hooks/useApiMutation'
import {
  useCreateAcademicPeriod,
  useUpdateAcademicPeriod,
} from '../hooks/useAcademicYears'
import type { AcademicPeriod, PeriodType } from '@education-gestor/types'

interface PeriodFormData {
  name: string
  type: PeriodType
  order: string
  startDate: string
  endDate: string
  gradeClosingDate: string
}

function getNextStartDate(periods: AcademicPeriod[]): string {
  if (periods.length === 0) return ''
  const sorted = [...periods].sort((a, b) => {
    const aRef = a.gradeClosingDate ?? a.endDate
    const bRef = b.gradeClosingDate ?? b.endDate
    return aRef.localeCompare(bRef)
  })
  const last = sorted[sorted.length - 1]
  const ref = last.gradeClosingDate ?? last.endDate
  const [y, m, d] = ref.split('-').map(Number)
  const date = new Date(y, m - 1, d + 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function getNextOrder(periods: AcademicPeriod[]): number {
  if (periods.length === 0) return 1
  return Math.max(...periods.map((p) => p.order)) + 1
}

export function PeriodDialog({
  open,
  yearId,
  editing,
  existingPeriods = [],
  onClose,
}: {
  open: boolean
  yearId: string
  editing?: AcademicPeriod
  existingPeriods?: AcademicPeriod[]
  onClose: () => void
}) {
  const [form, setForm] = useState<PeriodFormData>(
    editing
      ? {
          name: editing.name,
          type: editing.type,
          order: String(editing.order),
          startDate: editing.startDate.slice(0, 10),
          endDate: editing.endDate.slice(0, 10),
          gradeClosingDate: editing.gradeClosingDate?.slice(0, 10) ?? '',
        }
      : {
          name: '',
          type: 'bimestre',
          order: String(getNextOrder(existingPeriods)),
          startDate: getNextStartDate(existingPeriods),
          endDate: '',
          gradeClosingDate: '',
        },
  )
  const [errors, setErrors] = useState<Partial<Record<keyof PeriodFormData, string>>>({})
  const [overlapError, setOverlapError] = useState<string | null>(null)

  const createMutation = useCreateAcademicPeriod(yearId)
  const updateMutation = useUpdateAcademicPeriod(yearId)
  const mutation = editing ? updateMutation : createMutation

  const createApiMutation = useApiMutation({
    mutationFn: (data: Omit<PeriodFormData, 'order'> & { order: number }) => createMutation.mutateAsync(data),
    successMessage: 'Período criado',
    onSuccess: () => onClose(),
    onError: (err) => {
      const msg = extractErrorMessage(err)
      if (msg.includes('sobrepõe')) {
        setOverlapError(msg)
      }
    },
  })

  const updateApiMutation = useApiMutation({
    mutationFn: (vars: { id: string; data: Record<string, unknown> }) => updateMutation.mutateAsync(vars),
    successMessage: 'Período atualizado',
    onSuccess: () => onClose(),
    onError: (err) => {
      const msg = extractErrorMessage(err)
      if (msg.includes('sobrepõe')) {
        setOverlapError(msg)
      }
    },
  })

  const activeApiMutation = editing ? updateApiMutation : createApiMutation

  function validate() {
    const errs: Partial<Record<keyof PeriodFormData, string>> = {}
    if (!form.name) errs.name = 'Nome obrigatório'
    if (!form.startDate) errs.startDate = 'Data início obrigatória'
    if (!form.endDate) errs.endDate = 'Data fim obrigatória'
    if (form.startDate && form.endDate && form.startDate >= form.endDate) {
      errs.endDate = 'A data de término deve ser posterior à data de início'
    }
    if (!form.order || isNaN(Number(form.order))) errs.order = 'Ordem obrigatória'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setOverlapError(null)
    if (!validate()) return
    const payload = {
      name: form.name,
      type: form.type,
      order: Number(form.order),
      startDate: form.startDate,
      endDate: form.endDate,
      ...(form.gradeClosingDate ? { gradeClosingDate: form.gradeClosingDate } : {}),
    }
    if (editing) {
      updateApiMutation.mutate({ id: editing.id, data: payload })
    } else {
      createApiMutation.mutate(payload as Omit<PeriodFormData, 'order'> & { order: number })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setOverlapError(null); onClose() } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar período' : 'Novo período letivo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="period-name">Nome *</Label>
            <Input id="period-name" placeholder="Ex: 1º Bimestre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="period-order">Ordem *</Label>
            <Input id="period-order" type="number" min={1} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
            {errors.order && <p className="text-xs text-destructive">{errors.order}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="period-start">Início *</Label>
              <input
                id="period-start"
                type="date"
                value={form.startDate}
                onChange={(e) => { setForm({ ...form, startDate: e.target.value }); setOverlapError(null) }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="period-end">Fim *</Label>
              <input
                id="period-end"
                type="date"
                value={form.endDate}
                onChange={(e) => { setForm({ ...form, endDate: e.target.value }); setOverlapError(null) }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
            </div>
          </div>
          {overlapError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-xs text-destructive font-medium">{overlapError}</p>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="period-grade-closing">Fechamento de notas</Label>
            <input
              id="period-grade-closing"
              type="date"
              value={form.gradeClosingDate}
              onChange={(e) => setForm({ ...form, gradeClosingDate: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={activeApiMutation.isPending}>{activeApiMutation.isPending ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
