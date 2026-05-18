import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import type { AxiosError } from 'axios'
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
import { toast } from '../../../lib/toast'
import { PageHead } from '../../../components/PageHead'
import { Surface } from '../../../components/Surface'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/alert-dialog'
import { Skeleton } from '../../../components/ui/skeleton'
import type { AcademicYear, AcademicPeriod, PeriodType } from '@education-gestor/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = { planning: 'Planejamento', active: 'Ativo', closed: 'Encerrado' }
const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'outline'> = {
  planning: 'warning',
  active: 'success',
  closed: 'outline',
}
const PERIOD_TYPE_LABEL: Record<PeriodType, string> = {
  bimestre: 'Bimestre',
  trimestre: 'Trimestre',
  semestre: 'Semestre',
}

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
      updateMutation.mutate(
        { id: editing.id, data: payload },
        {
          onSuccess: () => { toast.success('Período atualizado'); onClose() },
          onError: (err) => toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Erro inesperado'),
        },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { toast.success('Período criado'); onClose() },
        onError: (err) => toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Erro inesperado'),
      })
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
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Salvando…' : 'Salvar'}</Button>
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const sorted = [...(periods ?? [])].sort((a, b) => a.order - b.order)

  return (
    <div style={{ borderTop: '1px solid var(--iris-slate-100)', background: 'var(--iris-slate-50)' }}>
      <div className="px-5 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--iris-slate-500)' }}>
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
        <p className="px-5 pb-4 text-xs italic" style={{ color: 'var(--iris-slate-400)' }}>
          Nenhum período cadastrado.
        </p>
      ) : (
        <div className="px-5 pb-4 space-y-1.5">
          {sorted.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2"
              style={{ background: '#fff', border: '1px solid var(--iris-slate-200)' }}
            >
              <span className="text-xs font-medium w-4 text-center" style={{ color: 'var(--iris-slate-400)' }}>
                {p.order}
              </span>
              <span className="text-sm font-medium flex-1" style={{ color: 'var(--iris-blue-900)' }}>
                {p.name}
              </span>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                {PERIOD_TYPE_LABEL[p.type]}
              </Badge>
              <span className="text-xs" style={{ color: 'var(--iris-slate-500)' }}>
                {fmtDate(p.startDate)} – {fmtDate(p.endDate)}
              </span>
              {p.gradeClosingDate && (
                <span className="text-xs" style={{ color: 'var(--iris-slate-400)' }}>
                  Fechamento: {fmtDate(p.gradeClosingDate)}
                </span>
              )}
              <div className="flex gap-0.5">
                <button
                  className="flex items-center justify-center rounded w-6 h-6 transition-colors"
                  onClick={() => { setEditingPeriod(p); setDialogOpen(true) }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--iris-blue-50)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                >
                  <Pencil size={11} style={{ color: 'var(--iris-slate-500)' }} />
                </button>
                <button
                  className="flex items-center justify-center rounded w-6 h-6 transition-colors"
                  onClick={() => setDeleteTarget(p.id)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FEE2E2' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                >
                  <Trash2 size={11} style={{ color: 'var(--iris-danger-600)' }} />
                </button>
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir período</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteMutation.mutate(deleteTarget!, {
                  onSuccess: () => { toast.success('Período removido'); setDeleteTarget(null) },
                  onError: (err) => { toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Erro inesperado'); setDeleteTarget(null) },
                })
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const mutation = editing ? updateMutation : createMutation

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
      updateMutation.mutate(
        { id: editing.id, data: updatePayload },
        {
          onSuccess: () => { toast.success('Ano letivo atualizado'); onClose() },
          onError: (err) => toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Erro inesperado'),
        },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { toast.success('Ano letivo criado'); onClose() },
        onError: (err) => toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Erro inesperado'),
      })
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
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Salvando…' : 'Salvar'}</Button>
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
    statusMutation.mutate(
      { id: year.id, status: next },
      {
        onSuccess: () => toast.success('Status atualizado'),
        onError: (err) => toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Erro inesperado'),
      },
    )
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
            <p className="text-sm" style={{ color: 'var(--iris-slate-500)' }}>Nenhum ano letivo cadastrado.</p>
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
                style={{ border: '1px solid var(--iris-slate-200)', background: '#fff', boxShadow: 'var(--shadow-sm)' }}
              >
                {/* Cabeçalho do ano */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <button
                    className="flex items-center justify-center rounded transition-colors shrink-0"
                    style={{ width: 28, height: 28 }}
                    onClick={() => toggleExpand(year.id)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--iris-blue-50)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                  >
                    {isOpen
                      ? <ChevronDown size={16} style={{ color: 'var(--iris-slate-500)' }} />
                      : <ChevronRight size={16} style={{ color: 'var(--iris-slate-500)' }} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: 'var(--iris-blue-900)' }}>
                        {year.name}
                      </span>
                      <Badge variant={STATUS_VARIANT[year.status]}>{STATUS_LABEL[year.status]}</Badge>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--iris-slate-500)' }}>
                      {fmtDate(year.startDate)} – {fmtDate(year.endDate)}
                      {year.registrationStart && (
                        <span className="ml-2">· Matrículas: {fmtDate(year.registrationStart)} – {year.registrationEnd ? fmtDate(year.registrationEnd) : '?'}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {year.status !== 'closed' && (
                      <button
                        title={year.status === 'planning' ? 'Ativar' : 'Encerrar'}
                        className="flex items-center justify-center rounded-md px-2 h-7 text-xs font-medium gap-1 transition-colors"
                        style={{ border: '1px solid var(--iris-slate-300)', color: 'var(--iris-slate-600)' }}
                        onClick={() => handleNextStatus(year)}
                        disabled={statusMutation.isPending}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--iris-blue-50)' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                      >
                        <RefreshCw size={11} />
                        {year.status === 'planning' ? 'Ativar' : 'Encerrar'}
                      </button>
                    )}
                    <button
                      className="flex items-center justify-center rounded-md w-7 h-7 transition-colors"
                      onClick={() => { setEditingYear(year); setYearDialog(true) }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--iris-blue-50)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                    >
                      <Pencil size={13} style={{ color: 'var(--iris-slate-500)' }} />
                    </button>
                    <button
                      className="flex items-center justify-center rounded-md w-7 h-7 transition-colors"
                      onClick={() => setDeleteTarget(year.id)}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FEE2E2' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                    >
                      <Trash2 size={13} style={{ color: 'var(--iris-danger-600)' }} />
                    </button>
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ano letivo</AlertDialogTitle>
            <AlertDialogDescription>Todos os períodos vinculados também serão removidos. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteMutation.mutate(deleteTarget!, {
                  onSuccess: () => { toast.success('Ano letivo removido'); setDeleteTarget(null) },
                  onError: (err) => { toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Erro inesperado'); setDeleteTarget(null) },
                })
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
