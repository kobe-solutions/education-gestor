import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { useCreateAcademicYear, useUpdateAcademicYear } from '../hooks/useAcademicYears'
import type { AcademicYear } from '@education-gestor/types'

interface YearFormData {
  year: string
  name: string
  startDate: string
  endDate: string
  registrationStart: string
  registrationEnd: string
}

const emptyYear: YearFormData = { year: String(new Date().getFullYear()), name: '', startDate: '', endDate: '', registrationStart: '', registrationEnd: '' }

export function YearDialog({
  open,
  editing,
  onClose,
}: {
  open: boolean
  editing?: AcademicYear
  onClose: () => void
}) {
  const [form, setForm] = useState<YearFormData>(
    editing
      ? {
          year: String(editing.year),
          name: editing.name,
          startDate: editing.startDate.slice(0, 10),
          endDate: editing.endDate.slice(0, 10),
          registrationStart: editing.registrationStart?.slice(0, 10) ?? '',
          registrationEnd: editing.registrationEnd?.slice(0, 10) ?? '',
        }
      : emptyYear,
  )
  const [errors, setErrors] = useState<Partial<Record<keyof YearFormData, string>>>({})

  const createMutation = useCreateAcademicYear()
  const updateMutation = useUpdateAcademicYear()

  const createYearApiMutation = useApiMutation({
    mutationFn: (data: { year: number; name: string; startDate: string; endDate: string; registrationStart?: string; registrationEnd?: string }) =>
      createMutation.mutateAsync(data),
    successMessage: 'Ano letivo criado',
    onSuccess: () => onClose(),
  })

  const updateYearApiMutation = useApiMutation({
    mutationFn: (vars: { id: string; data: Record<string, unknown> }) => updateMutation.mutateAsync(vars),
    successMessage: 'Ano letivo atualizado',
    onSuccess: () => onClose(),
  })

  const activeYearMutation = editing ? updateYearApiMutation : createYearApiMutation

  function validate() {
    const errs: Partial<Record<keyof YearFormData, string>> = {}
    if (!form.year || isNaN(Number(form.year))) errs.year = 'Ano obrigatório'
    if (!form.name) errs.name = 'Nome obrigatório'
    if (!form.startDate) errs.startDate = 'Data início obrigatória'
    if (!form.endDate) errs.endDate = 'Data fim obrigatória'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      year: Number(form.year),
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      ...(form.registrationStart ? { registrationStart: form.registrationStart } : {}),
      ...(form.registrationEnd ? { registrationEnd: form.registrationEnd } : {}),
    }
    if (editing) {
      const { year: _year, ...updatePayload } = payload
      updateYearApiMutation.mutate({ id: editing.id, data: updatePayload })
    } else {
      createYearApiMutation.mutate(payload)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar ano letivo' : 'Novo ano letivo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Ano *</Label>
              <Input
                type="number"
                min={2000}
                max={2100}
                value={form.year}
                disabled={!!editing}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              />
              {errors.year && <p className="text-xs text-destructive">{errors.year}</p>}
            </div>
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input placeholder="Ex: Ano Letivo 2025" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Início das matrículas</Label>
              <Input type="date" value={form.registrationStart} onChange={(e) => setForm({ ...form, registrationStart: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Fim das matrículas</Label>
              <Input type="date" value={form.registrationEnd} onChange={(e) => setForm({ ...form, registrationEnd: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={activeYearMutation.isPending}>{activeYearMutation.isPending ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
