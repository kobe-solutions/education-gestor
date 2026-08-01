import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
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

const emptyPeriod: PeriodFormData = { name: '', type: 'bimestre', order: '1', startDate: '', endDate: '', gradeClosingDate: '' }

export function PeriodDialog({
  open,
  yearId,
  editing,
  onClose,
}: {
  open: boolean
  yearId: string
  editing?: AcademicPeriod
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
      : emptyPeriod,
  )
  const [errors, setErrors] = useState<Partial<Record<keyof PeriodFormData, string>>>({})

  const createMutation = useCreateAcademicPeriod(yearId)
  const updateMutation = useUpdateAcademicPeriod(yearId)
  const mutation = editing ? updateMutation : createMutation

  const createApiMutation = useApiMutation({
    mutationFn: (data: Omit<PeriodFormData, 'order'> & { order: number }) => createMutation.mutateAsync(data),
    successMessage: 'Período criado',
    onSuccess: () => onClose(),
  })

  const updateApiMutation = useApiMutation({
    mutationFn: (vars: { id: string; data: Record<string, unknown> }) => updateMutation.mutateAsync(vars),
    successMessage: 'Período atualizado',
    onSuccess: () => onClose(),
  })

  const activeApiMutation = editing ? updateApiMutation : createApiMutation

  function validate() {
    const errs: Partial<Record<keyof PeriodFormData, string>> = {}
    if (!form.name) errs.name = 'Nome obrigatório'
    if (!form.startDate) errs.startDate = 'Data início obrigatória'
    if (!form.endDate) errs.endDate = 'Data fim obrigatória'
    if (!form.order || isNaN(Number(form.order))) errs.order = 'Ordem obrigatória'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar período' : 'Novo período letivo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input placeholder="Ex: 1º Bimestre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as PeriodType })}
                items={[{ value: 'bimestre', label: 'Bimestre' }, { value: 'trimestre', label: 'Trimestre' }, { value: 'semestre', label: 'Semestre' }]}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bimestre">Bimestre</SelectItem>
                  <SelectItem value="trimestre">Trimestre</SelectItem>
                  <SelectItem value="semestre">Semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Ordem *</Label>
              <Input type="number" min={1} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              {errors.order && <p className="text-xs text-destructive">{errors.order}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Início *</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
            </div>
            <div className="space-y-1">
              <Label>Fim *</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Fechamento de notas</Label>
            <Input type="date" value={form.gradeClosingDate} onChange={(e) => setForm({ ...form, gradeClosingDate: e.target.value })} />
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
