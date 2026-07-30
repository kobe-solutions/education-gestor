import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { extractErrorMessage } from '../../../lib/errors'
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '../hooks/useSubjects'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { PageHead } from '../../../components/PageHead'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { SearchInput } from '../../../components/SearchInput'
import { DataTable, type Column } from '../../../components/DataTable'
import type { Subject } from '@education-gestor/types'

interface SubjectFormData {
  name: string
  code: string
  weeklyHours: string
}

const emptyForm: SubjectFormData = { name: '', code: '', weeklyHours: '' }

export function SubjectsPage() {
  const { data: subjects, isLoading } = useSubjects()
  const createMutation = useCreateSubject()
  const updateMutation = useUpdateSubject()
  const deleteMutation = useDeleteSubject()

  const createApiMutation = useApiMutation({
    mutationFn: (data: { name: string; code?: string; weeklyHours: number }) => createMutation.mutateAsync(data),
    successMessage: 'Disciplina criada com sucesso',
    onSuccess: () => handleClose(),
  })

  const updateApiMutation = useApiMutation({
    mutationFn: (vars: { id: string; data: { name: string; code: string | null; weeklyHours: number } }) =>
      updateMutation.mutateAsync(vars),
    successMessage: 'Disciplina atualizada',
    onSuccess: () => handleClose(),
  })

  const deleteApiMutation = useApiMutation({
    mutationFn: (id: string) => deleteMutation.mutateAsync(id),
    successMessage: 'Disciplina removida',
    onSuccess: () => setDeleteTarget(null),
    onError: () => setDeleteTarget(null),
  })

  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const [sortColumn, setSortColumn] = useState<string | null>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState<SubjectFormData>(emptyForm)
  const [errors, setErrors] = useState<Partial<SubjectFormData>>({})

  const filtered = subjects?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

  // TODO: SubjectsPage precisa de paginação server-side quando passar de ~50 itens.
  // useSubjects hoje retorna array simples. Adicionar `useSubjects({ page, limit })` no backend.
  function handleSortChange(column: string, direction: 'asc' | 'desc' | null) {
    setSortColumn(direction ? column : null)
    setSortDirection(direction)
  }

  function handleCreate() {
    setEditing(undefined)
    setForm(emptyForm)
    setErrors({})
    setDialogOpen(true)
  }

  function handleEdit(subject: Subject) {
    setEditing(subject)
    setForm({
      name: subject.name,
      code: subject.code ?? '',
      weeklyHours: String(subject.weeklyHours),
    })
    setErrors({})
    setDialogOpen(true)
  }

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        code: editing.code ?? '',
        weeklyHours: String(editing.weeklyHours),
      })
      setErrors({})
    }
  }, [editing])

  function handleDelete(id: string) {
    setDeleteTarget(id)
  }

  function handleClose() {
    setDialogOpen(false)
    setEditing(undefined)
    setForm(emptyForm)
    setErrors({})
    createMutation.reset()
    updateMutation.reset()
  }

  function validate(): boolean {
    const errs: Partial<SubjectFormData> = {}
    if (!form.name || form.name.length < 2) errs.name = 'Nome deve ter ao menos 2 caracteres'
    if (!form.weeklyHours || Number(form.weeklyHours) < 1) errs.weeklyHours = 'Mínimo 1 hora semanal'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const weeklyHours = Number(form.weeklyHours)

    if (editing) {
      updateApiMutation.mutate({
        id: editing.id,
        data: {
          name: form.name,
          code: form.code || null,
          weeklyHours,
        },
      })
    } else {
      createApiMutation.mutate({
        name: form.name,
        ...(form.code ? { code: form.code } : {}),
        weeklyHours,
      })
    }
  }

  const activeMutation = editing ? updateApiMutation : createApiMutation
  const isPending = activeMutation.isPending
  const apiError = extractErrorMessage(activeMutation.error)

  return (
    <div className="space-y-5">
      <PageHead
        title="Disciplinas"
        subtitle={`${filtered?.length ?? 0} disciplinas cadastradas`}
        actions={
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Nova disciplina
          </Button>
        }
      />

      {/* Busca */}
      <div className="w-full max-w-sm">
        <SearchInput
          value={search}
          onChange={(v) => { setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!v) next.delete('q'); else next.set('q', v); return next }) }}
          placeholder="Buscar disciplina..."
        />
      </div>

      <DataTable
        columns={[
          {
            key: 'name',
            label: 'Nome',
            sortable: true,
            render: (s) => (
              <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                {s.name}
              </span>
            ),
          },
          {
            key: 'code',
            label: 'Código',
            render: (s) => <span style={{ color: 'hsl(var(--muted-foreground))' }}>{s.code ?? '—'}</span>,
          },
          {
            key: 'weeklyHours',
            label: 'Horas Semanais',
            render: (s) => <span style={{ color: 'hsl(var(--muted-foreground))' }}>{s.weeklyHours}h</span>,
          },
        ]}
        data={filtered ?? []}
        rowKey={(s) => s.id}
        actions={(s) => (
          <div className="flex gap-1 justify-end">
            <Button variant="ghost" size="icon" title="Editar" aria-label="Editar" onClick={() => handleEdit(s)}>
              <Pencil size={14} className="text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" title="Excluir" aria-label="Excluir" onClick={() => handleDelete(s.id)}>
              <Trash2 size={14} className="text-destructive" />
            </Button>
          </div>
        )}
        emptyMessage="Nenhuma disciplina cadastrada"
        caption="Lista de disciplinas"
        loading={isLoading}
        sort={{
          column: sortColumn,
          direction: sortDirection,
          onSortChange: handleSortChange,
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar disciplina' : 'Nova disciplina'}</DialogTitle>
            <DialogDescription className="sr-only">{editing ? 'Editar dados da disciplina' : 'Criar uma nova disciplina'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Matemática"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <Label>Código (opcional)</Label>
              <Input
                placeholder="Ex: MAT"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Horas Semanais *</Label>
              <Input
                type="number"
                min={1}
                placeholder="Ex: 4"
                value={form.weeklyHours}
                onChange={(e) => setForm({ ...form, weeklyHours: e.target.value })}
              />
              {errors.weeklyHours && <p className="text-xs text-destructive">{errors.weeklyHours}</p>}
            </div>
            {apiError && <p className="text-xs text-destructive">{apiError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
