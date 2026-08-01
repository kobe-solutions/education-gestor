import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { useAcademicPeriods, useDeleteAcademicPeriod } from '../hooks/useAcademicYears'
import { PERIOD_TYPE_LABELS } from '../../../lib/labels'
import { PeriodDialog } from './PeriodDialog'
import type { AcademicPeriod, AcademicYear } from '@education-gestor/types'

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

export function PeriodsSection({ year }: { year: AcademicYear }) {
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
                  aria-label="Editar período"
                  onClick={() => { setEditingPeriod(p); setDialogOpen(true) }}
                >
                  <Pencil size={11} style={{ color: 'hsl(var(--muted-foreground))' }} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Excluir período"
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
