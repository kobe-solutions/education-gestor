import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStudents, useDeleteStudent } from '../hooks/useStudents'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { PageHead } from '../../../components/PageHead'
import { Surface } from '../../../components/Surface'
import { Button } from '../../../components/ui/button'
import { Skeleton } from '../../../components/ui/skeleton'
import { ConfirmDialog } from '../../../components/ConfirmDialog'

import { SearchInput } from '../../../components/SearchInput'
import { StatusBadge } from '../../../components/StatusBadge'

const PAGE_SIZE = 15

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

  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filtered = students?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.enrollmentCode.toLowerCase().includes(search.toLowerCase()),
  ) ?? []

  return (
    <div className="space-y-5">
      <PageHead
        title="Alunos"
        subtitle={`${total} aluno${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`}
        actions={
          <Button size="sm" onClick={() => navigate('/students/new')}>
            <Plus className="h-4 w-4 mr-1" />
            Novo aluno
          </Button>
        }
      />

      {/* Busca */}
      <div className="w-full max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome ou matrícula…"
        />
      </div>

      {/* Tabela */}
      {isLoading ? (
        <Surface>
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </Surface>
      ) : (
        <Surface>
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Matrícula</th>
                  <th>Situação</th>
                  <th style={{ width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-10"
                      style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13 }}
                    >
                      {search
                        ? `Nenhum aluno encontrado para "${search}".`
                        : 'Nenhum aluno cadastrado.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr
                      key={s.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/students/${s.id}`)}
                    >
                      <td>
                        <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                          {s.name}
                        </span>
                      </td>
                      <td>
                        <span className="mono text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {s.enrollmentCode}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={s.enrollmentStatus} kind="enrollment" />
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            onClick={() => navigate(`/students/${s.id}`)}
                          >
                            <Pencil size={14} className="text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            onClick={() => setDeleteTarget(s.id)}
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
          <span className="text-xs" style={{ color: 'var(--iris-slate-500)' }}>
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
          deleteApiMutation.mutate(deleteTarget!)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
