import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, UserPlus, Upload } from 'lucide-react'
import { useStudents, useDeleteStudent } from '../hooks/useStudents'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { PageHead } from '../../../components/PageHead'
import { Button } from '../../../components/ui/button'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { SearchInput } from '../../../components/SearchInput'
import { StatusBadge } from '../../../components/StatusBadge'
import { DataTable, type Column } from '../../../components/DataTable'
import type { Student } from '@education-gestor/types'

const PAGE_SIZE = 15

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const columns: Column<Student>[] = [
  {
    key: 'avatar',
    label: '',
    width: 48,
    render: (s) => (
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white shrink-0"
        style={{ background: 'hsl(var(--primary))' }}
      >
        {s.photoUrl ? (
          <img src={s.photoUrl} alt={s.name} className="w-8 h-8 rounded-full object-cover" loading="lazy" decoding="async"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          getInitials(s.name)
        )}
      </div>
    ),
  },
  {
    key: 'name',
    label: 'Nome',
    render: (s) => (
      <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
        {s.name}
      </span>
    ),
  },
  {
    key: 'enrollmentCode',
    label: 'Matrícula',
    render: (s) => (
      <span className="mono text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {s.enrollmentCode}
      </span>
    ),
  },
  {
    key: 'enrollmentStatus',
    label: 'Situação',
    render: (s) => <StatusBadge status={s.enrollmentStatus} kind="enrollment" />,
  },
]

export function StudentsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useStudents({ page, limit: PAGE_SIZE })
  const students = data?.data
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const deleteMutation = useDeleteStudent()

  const deleteApiMutation = useApiMutation({
    mutationFn: (id: string) => deleteMutation.mutateAsync(id),
    successMessage: 'Aluno removido',
    onSuccess: () => setDeleteTarget(null),
    onError: () => setDeleteTarget(null),
  })

  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const statusFilter = searchParams.get('status') ?? 'all'
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filtered = students?.filter((s) => {
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.enrollmentCode.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || s.enrollmentStatus === statusFilter
    return matchesSearch && matchesStatus
  }) ?? []

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endItem = Math.min(page * PAGE_SIZE, total)

  function getPageNumbers() {
    const pages: (number | '...')[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="space-y-5">
      <PageHead
        title="Alunos"
        subtitle={
          statusFilter === 'all'
            ? `${total} aluno${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`
            : `${filtered.length} aluno${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`
        }
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('/students/import')}>
              <Upload className="h-4 w-4 mr-1" />
              Importar
            </Button>
            <Button size="sm" onClick={() => navigate('/students/new')}>
              <Plus className="h-4 w-4 mr-1" />
              Novo aluno
            </Button>
          </div>
        }
      />

      <div className="flex gap-3 flex-wrap">
        <div className="w-full max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => { setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!v) next.delete('q'); else next.set('q', v); return next }) }}
            placeholder="Buscar por nome ou matrícula…"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!v || v === 'all') next.delete('status'); else next.set('status', v); return next }) }}
          items={[
            { value: 'all', label: 'Todos' },
            { value: 'active', label: 'Ativo' },
            { value: 'inactive', label: 'Inativo' },
            { value: 'transferred', label: 'Transferido' },
            { value: 'cancelled', label: 'Cancelado' },
          ]}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="transferred">Transferido</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(s) => s.id}
        onRowClick={(s) => navigate(`/students/${s.id}`)}
        actions={(s) => (
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              title="Editar"
              aria-label="Editar"
              onClick={() => navigate(`/students/${s.id}`)}
            >
              <Pencil size={14} className="text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              title="Excluir"
              aria-label="Excluir"
              onClick={() => setDeleteTarget(s.id)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )}
        emptyMessage={search ? `Nenhum aluno encontrado para "${search}".` : 'Nenhum aluno cadastrado.'}
        emptyIcon={UserPlus}
        caption="Lista de alunos"
        loading={isLoading}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Mostrando {startItem}–{endItem} de {total} aluno{total !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              aria-label="Página anterior"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
              ) : (
                <Button
                  key={p}
                  size="sm"
                  variant={p === page ? 'default' : 'outline'}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ),
            )}
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
          deleteApiMutation.mutate(deleteTarget!)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
