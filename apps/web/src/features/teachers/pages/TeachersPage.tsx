import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { AxiosError } from 'axios'
import { useTeachers, useDeleteTeacher } from '../hooks/useTeachers'
import { toast } from '../../../lib/toast'
import { PageHead } from '../../../components/PageHead'
import { Surface } from '../../../components/Surface'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog'

const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  licenca: 'Licença',
}

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
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            size={14}
            style={{ color: 'var(--iris-slate-500)' }}
          />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-md outline-hidden transition-shadow"
            style={{
              border: '1px solid var(--iris-slate-300)',
              background: 'var(--bg-surface)',
              color: 'var(--iris-blue-900)',
            }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.boxShadow = 'var(--shadow-focus)' }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.boxShadow = 'none' }}
          />
        </div>
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
                      style={{ color: 'var(--iris-slate-500)', fontSize: 13 }}
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
                        <span className="font-semibold" style={{ color: 'var(--iris-blue-900)' }}>
                          {t.name}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell" style={{ color: 'var(--iris-slate-500)' }}>
                        {t.email}
                      </td>
                      <td style={{ color: 'var(--iris-slate-500)' }}>{t.position ?? '—'}</td>
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
                          <button
                            className="flex items-center justify-center rounded-sm w-8 h-8 transition-colors hover:bg-[var(--iris-blue-50)]"
                            title="Editar"
                            onClick={() => navigate(`/teachers/${t.id}/edit`)}
                          >
                            <Pencil size={14} style={{ color: 'var(--iris-slate-500)' }} />
                          </button>
                          <button
                            className="flex items-center justify-center rounded-sm w-8 h-8 transition-colors hover:bg-[var(--iris-danger-50)]"
                            title="Excluir"
                            onClick={() => setDeleteTarget(t.id)}
                          >
                            <Trash2 size={14} style={{ color: 'var(--iris-danger-600)' }} />
                          </button>
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteMutation.mutate(deleteTarget!, {
                  onSuccess: () => {
                    toast.success('Professor removido')
                    setDeleteTarget(null)
                  },
                  onError: (err) => {
                    const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message
                    toast.error(msg ?? 'Erro inesperado')
                    setDeleteTarget(null)
                  },
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
