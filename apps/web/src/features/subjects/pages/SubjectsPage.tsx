import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { extractErrorMessage } from '../../../lib/errors'
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '../hooks/useSubjects'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { PageHead } from '../../../components/PageHead'
import { Surface } from '../../../components/Surface'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Skeleton } from '../../../components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { SearchInput } from '../../../components/SearchInput'
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

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState<SubjectFormData>(emptyForm)
  const [errors, setErrors] = useState<Partial<SubjectFormData>>({})

  const filtered = subjects?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

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
          onChange={setSearch}
          placeholder="Buscar disciplina..."
        />
      </div>

      {/* Tabela */}
      {isLoading ? (
        <Surface>
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Surface>
      ) : (
        <Surface>
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Código</th>
                  <th>Horas Semanais</th>
                  <th style={{ width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {filtered?.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                        {s.name}
                      </span>
                    </td>
                    <td style={{ color: 'hsl(var(--muted-foreground))' }}>{s.code ?? '—'}</td>
                    <td style={{ color: 'hsl(var(--muted-foreground))' }}>{s.weeklyHours}h</td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => handleEdit(s)}
                        >
                          <Pencil size={14} className="text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar disciplina' : 'Nova disciplina'}</DialogTitle>
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
