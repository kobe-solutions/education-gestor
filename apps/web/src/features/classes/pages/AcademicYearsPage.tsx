import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import {
  useAcademicYears,
  useDeleteAcademicYear,
  useUpdateAcademicYearStatus,
} from '../hooks/useAcademicYears'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { PageHead } from '../../../components/PageHead'
import { Surface } from '../../../components/Surface'
import { Button } from '../../../components/ui/button'
import { StatusBadge } from '../../../components/StatusBadge'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { PageSkeleton } from '../../../components/skeletons'
import { YearDialog } from '../components/YearDialog'
import { PeriodsSection } from '../components/PeriodsSection'
import type { AcademicYear } from '@education-gestor/types'

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

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
        <PageSkeleton />
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
                    aria-label={isOpen ? 'Recolher períodos' : 'Expandir períodos'}
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
                      aria-label="Editar ano letivo"
                      onClick={() => { setEditingYear(year); setYearDialog(true) }}
                    >
                      <Pencil size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="Excluir ano letivo"
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
