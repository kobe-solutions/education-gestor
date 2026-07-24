import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { extractErrorMessage } from '../../../lib/errors'
import { useTeachers, useDeleteTeacher } from '../hooks/useTeachers'
import { toast } from '../../../lib/toast'
import { PageHead } from '../../../components/PageHead'
import { Surface } from '../../../components/Surface'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { ConfirmDialog } from '../../../components/ConfirmDialog'

import { SearchInput } from '../../../components/SearchInput'
import { EMPLOYMENT_STATUS_LABELS } from '../../../lib/labels'

const PAGE_SIZE = 15

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

      {/* Busca */}
      <div className="w-full max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome..."
        />
      </div>

      {/* Tabela */}
      {isLoading ? (
        <Surface>
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </Surface>
      ) : (
        <Surface>
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th className="hidden sm:table-cell">Email</th>
                  <th>Cargo</th>
                  <th>Situação</th>
                  <th style={{ width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-10"
                      style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13 }}
                    >
                      {search
                        ? `Nenhum professor encontrado para "${search}".`
                        : 'Nenhum professor cadastrado.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className="cursor-pointer" onClick={() => navigate(`/teachers/${t.id}/edit`)}>
                      <td>
                        <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                          {t.name}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {t.email}
                      </td>
                      <td style={{ color: 'hsl(var(--muted-foreground))' }}>{t.position ?? '—'}</td>
                      <td>
                        <Badge
                          variant={t.employmentStatus === 'ativo' ? 'success' : 'secondary'}
                          className="text-[10px]"
                        >
                          {EMPLOYMENT_STATUS_LABELS[t.employmentStatus] ?? t.employmentStatus}
                        </Badge>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            onClick={() => navigate(`/teachers/${t.id}/edit`)}
                          >
                            <Pencil size={14} className="text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            onClick={() => setDeleteTarget(t.id)}
                          >
                            <Trash2 size={14} className="text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Surface>
      )}

      {/* Paginação */}
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
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
