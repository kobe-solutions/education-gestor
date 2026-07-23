import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import type { AxiosError } from 'axios'
import { useStudents, useDeleteStudent } from '../hooks/useStudents'
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

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  transferred: 'Transferido',
  cancelled: 'Cancelado',
}

function statusVariant(status: string) {
  if (status === 'active') return 'success'
  if (status === 'transferred') return 'warning'
  if (status === 'inactive' || status === 'cancelled') return 'outline'
  return 'outline'
}

export function StudentsPage() {
  const navigate = useNavigate()
  const { data: students, isLoading } = useStudents()
  const deleteMutation = useDeleteStudent()
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
        subtitle={`${students?.length ?? 0} alunos cadastrados`}
        actions={
          <Button size="sm" onClick={() => navigate('/students/new')}>
            <Plus className="h-4 w-4 mr-1" />
            Novo aluno
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
            placeholder="Buscar por nome ou matrícula…"
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
                      style={{ color: 'var(--iris-slate-500)', fontSize: 13 }}
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
                        <span className="font-semibold" style={{ color: 'var(--iris-blue-900)' }}>
                          {s.name}
                        </span>
                      </td>
                      <td>
                        <span className="mono text-xs" style={{ color: 'var(--iris-slate-500)' }}>
                          {s.enrollmentCode}
                        </span>
                      </td>
                      <td>
                        <Badge variant={statusVariant(s.enrollmentStatus) as any}>
                          {STATUS_LABELS[s.enrollmentStatus] ?? s.enrollmentStatus}
                        </Badge>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <button
                            className="flex items-center justify-center rounded-sm w-8 h-8 transition-colors hover:bg-[var(--iris-blue-50)]"
                            title="Editar"
                            onClick={() => navigate(`/students/${s.id}`)}
                          >
                            <Pencil size={14} style={{ color: 'var(--iris-slate-500)' }} />
                          </button>
                          <button
                            className="flex items-center justify-center rounded-sm w-8 h-8 transition-colors hover:bg-[var(--iris-danger-50)]"
                            title="Excluir"
                            onClick={() => setDeleteTarget(s.id)}
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
                  onSuccess: () => { toast.success('Aluno removido'); setDeleteTarget(null) },
                  onError: (err) => {
                    toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Erro inesperado')
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
