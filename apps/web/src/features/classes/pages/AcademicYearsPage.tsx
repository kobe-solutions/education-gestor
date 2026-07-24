import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import {
  useAcademicYears,
  useCreateAcademicYear,
  useUpdateAcademicYear,
  useUpdateAcademicYearStatus,
  useDeleteAcademicYear,
  useAcademicPeriods,
  useCreateAcademicPeriod,
  useUpdateAcademicPeriod,
  useDeleteAcademicPeriod,
} from '../hooks/useAcademicYears'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { PageHead } from '../../../components/PageHead'
import { Surface } from '../../../components/Surface'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { Skeleton } from '../../../components/ui/skeleton'
import type { AcademicYear, AcademicPeriod, PeriodType } from '@education-gestor/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { PERIOD_TYPE_LABELS } from '../../../lib/labels'
import { StatusBadge } from '../../../components/StatusBadge'

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

// ─── Dialogs de período ───────────────────────────────────────────────────────

interface PeriodFormData {
  name: string
  type: PeriodType
  order: string
  startDate: string
  endDate: string
  gradeClosingDate: string
}

const emptyPeriod: PeriodFormData = { name: '', type: 'bimestre', order: '1', startDate: '', endDate: '', gradeClosingDate: '' }

function PeriodDialog({
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
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as PeriodType })}>
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

// ─── Seção de períodos de um ano ──────────────────────────────────────────────

function PeriodsSection({ year }: { year: AcademicYear }) {
  const { data: periods, isLoading } = useAcademicPeriods(year.id)
  const deleteMutation = useDeleteAcademicPeriod(year.id)

  const deletePeriodApiMutation = useApiMutation({
    mutationFn: (id: string) => deleteMutation.mutateAsync(id),
    successMessage: 'Período removido',
    onSuccess: () => setDeleteTarget(null),
    onError: () => setDeleteTarget(null),
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const sorted = [...(periods ?? [])].sort((a, b) => a.order - b.order)

  return (
    <div style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--accent))' }}>
      <div className="px-5 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Períodos letivos
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => { setEditingPeriod(undefined); setDialogOpen(true) }}
        >
          <Plus className="h-3 w-3 mr-1" /> Adicionar
        </Button>
      </div>

      {isLoading ? (
        <div className="px-5 pb-4 space-y-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      ) : sorted.length === 0 ? (
        <p className="px-5 pb-4 text-xs italic" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
          Nenhum período cadastrado.
        </p>
      ) : (
        <div className="px-5 pb-4 space-y-1.5">
          {sorted.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-md px-3 py-2"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            >
              <span className="text-xs font-medium w-4 text-center" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                {p.order}
              </span>
              <span className="text-sm font-medium flex-1" style={{ color: 'hsl(var(--primary))' }}>
                {p.name}
              </span>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                {PERIOD_TYPE_LABELS[p.type]}
              </Badge>
              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {fmtDate(p.startDate)} – {fmtDate(p.endDate)}
              </span>
              {p.gradeClosingDate && (
                <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                  Fechamento: {fmtDate(p.gradeClosingDate)}
                </span>
              )}
              <div className="flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => { setEditingPeriod(p); setDialogOpen(true) }}
                >
                  <Pencil size={11} style={{ color: 'hsl(var(--muted-foreground))' }} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setDeleteTarget(p.id)}
                >
                  <Trash2 size={11} style={{ color: 'hsl(var(--destructive))' }} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {dialogOpen && (
        <PeriodDialog
          open={dialogOpen}
          yearId={year.id}
          editing={editingPeriod}
          onClose={() => { setDialogOpen(false); setEditingPeriod(undefined) }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => {
          deletePeriodApiMutation.mutate(deleteTarget!)
        }}
        onCancel={() => setDeleteTarget(null)}
        title="Excluir período"
      />
    </div>
  )
}

// ─── Formulário de ano letivo ─────────────────────────────────────────────────

interface YearFormData {
  year: string
  name: string
  startDate: string
  endDate: string
  registrationStart: string
  registrationEnd: string
}

const emptyYear: YearFormData = { year: String(new Date().getFullYear()), name: '', startDate: '', endDate: '', registrationStart: '', registrationEnd: '' }

function YearDialog({
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

// ─── Página principal ─────────────────────────────────────────────────────────

export function AcademicYearsPage() {
  const { data: years, isLoading } = useAcademicYears()
  const deleteMutation = useDeleteAcademicYear()
  const statusMutation = useUpdateAcademicYearStatus()

  const deleteYearApiMutation = useApiMutation({
    mutationFn: (id: string) => deleteMutation.mutateAsync(id),
    successMessage: 'Ano letivo removido',
    onSuccess: () => setDeleteTarget(null),
    onError: () => setDeleteTarget(null),
  })

  const statusApiMutation = useApiMutation({
    mutationFn: (vars: { id: string; status: 'active' | 'planning' | 'closed' }) => statusMutation.mutateAsync(vars),
    successMessage: 'Status atualizado',
  })

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [yearDialog, setYearDialog] = useState(false)
  const [editingYear, setEditingYear] = useState<AcademicYear | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const sorted = [...(years ?? [])].sort((a, b) => b.year - a.year)

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleNextStatus(year: AcademicYear) {
    const next = year.status === 'planning' ? 'active' : year.status === 'active' ? 'closed' : null
    if (!next) return
    statusApiMutation.mutate({ id: year.id, status: next })
  }

  return (
    <div className="space-y-5">
      <PageHead
        title="Anos Letivos"
        subtitle={`${years?.length ?? 0} anos cadastrados`}
        actions={
          <Button size="sm" onClick={() => { setEditingYear(undefined); setYearDialog(true) }}>
            <Plus className="h-4 w-4 mr-1" /> Novo ano letivo
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : sorted.length === 0 ? (
        <Surface>
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Nenhum ano letivo cadastrado.</p>
          </div>
        </Surface>
      ) : (
        <div className="space-y-3">
          {sorted.map((year) => {
            const isOpen = expanded.has(year.id)
            return (
              <div
                key={year.id}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', boxShadow: 'var(--shadow-sm)' }}
              >
                {/* Cabeçalho do ano */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => toggleExpand(year.id)}
                  >
                    {isOpen
                      ? <ChevronDown size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
                      : <ChevronRight size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: 'hsl(var(--primary))' }}>
                        {year.name}
                      </span>
                      <StatusBadge status={year.status} kind="year" />
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {fmtDate(year.startDate)} – {fmtDate(year.endDate)}
                      {year.registrationStart && (
                        <span className="ml-2">· Matrículas: {fmtDate(year.registrationStart)} – {year.registrationEnd ? fmtDate(year.registrationEnd) : '?'}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {year.status !== 'closed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        title={year.status === 'planning' ? 'Ativar' : 'Encerrar'}
                        className="h-7 text-xs gap-1"
                        onClick={() => handleNextStatus(year)}
                        disabled={statusApiMutation.isPending}
                      >
                        <RefreshCw size={11} />
                        {year.status === 'planning' ? 'Ativar' : 'Encerrar'}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setEditingYear(year); setYearDialog(true) }}
                    >
                      <Pencil size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setDeleteTarget(year.id)}
                    >
                      <Trash2 size={13} style={{ color: 'hsl(var(--destructive))' }} />
                    </Button>
                  </div>
                </div>

                {isOpen && <PeriodsSection year={year} />}
              </div>
            )
          })}
        </div>
      )}

      <YearDialog
        open={yearDialog}
        editing={editingYear}
        onClose={() => { setYearDialog(false); setEditingYear(undefined) }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => {
          deleteYearApiMutation.mutate(deleteTarget!)
        }}
        onCancel={() => setDeleteTarget(null)}
        title="Excluir ano letivo"
        description="Todos os períodos vinculados também serão removidos. Esta ação não pode ser desfeita."
      />
    </div>
  )
}
