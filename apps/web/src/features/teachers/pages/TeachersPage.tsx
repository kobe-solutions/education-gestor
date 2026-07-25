import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { extractErrorMessage } from '../../../lib/errors'
import { useTeachers, useDeleteTeacher } from '../hooks/useTeachers'
import { toast } from '../../../lib/toast'
import { PageHead } from '../../../components/PageHead'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { SearchInput } from '../../../components/SearchInput'
import { EMPLOYMENT_STATUS_LABELS } from '../../../lib/labels'
import { DataTable, type Column } from '../../../components/DataTable'
import type { Teacher } from '@education-gestor/types'

const PAGE_SIZE = 15

const columns: Column<Teacher>[] = [
  {
    key: 'name',
    label: 'Nome',
    render: (t) => (
      <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
        {t.name}
      </span>
    ),
  },
  {
    key: 'email',
    label: 'Email',
    className: 'hidden sm:table-cell',
    render: (t) => (
      <span style={{ color: 'hsl(var(--muted-foreground))' }}>{t.email}</span>
    ),
  },
  {
    key: 'position',
    label: 'Cargo',
    render: (t) => (
      <span style={{ color: 'hsl(var(--muted-foreground))' }}>{t.position ?? '—'}</span>
    ),
  },
  {
    key: 'employmentStatus',
    label: 'Situação',
    render: (t) => (
      <Badge
        variant={t.employmentStatus === 'ativo' ? 'success' : 'secondary'}
        className="text-[10px]"
      >
        {EMPLOYMENT_STATUS_LABELS[t.employmentStatus] ?? t.employmentStatus}
      </Badge>
    ),
  },
]

export function TeachersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useTeachers({ page, limit: PAGE_SIZE })
  const teachers = data?.data
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const deleteMutation = useDeleteTeacher()
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filtered = teachers?.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  ) ?? []

  return (
    <div className="space-y-5">
      <PageHead
        title="Professores"
        subtitle={`${total} professor${total !== 1 ? 'es' : ''} cadastrado${total !== 1 ? 's' : ''}`}
        actions={
          <Button size="sm" onClick={() => navigate('/teachers/new')}>
            <Plus className="h-4 w-4 mr-1" />
            Novo professor
          </Button>
        }
      />

      <div className="w-full max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome..."
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(t) => t.id}
        onRowClick={(t) => navigate(`/teachers/${t.id}/edit`)}
        actions={(t) => (
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              title="Editar"
              aria-label="Editar"
              onClick={() => navigate(`/teachers/${t.id}/edit`)}
            >
              <Pencil size={14} className="text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Excluir"
              aria-label="Excluir"
              onClick={() => setDeleteTarget(t.id)}
            >
              <Trash2 size={14} className="text-destructive" />
            </Button>
          </div>
        )}
        emptyMessage={search ? `Nenhum professor encontrado para "${search}".` : 'Nenhum professor cadastrado.'}
        caption="Lista de professores"
        loading={isLoading}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              aria-label="Página anterior"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              aria-label="Próxima página"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => {
          deleteMutation.mutate(deleteTarget!, {
            onSuccess: () => {
              toast.success('Professor removido')
              setDeleteTarget(null)
            },
            onError: (err) => {
              const msg = extractErrorMessage(err)
              toast.error(msg)
              setDeleteTarget(null)
            },
          })
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
