import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { extractErrorMessage } from '../../../lib/errors'
import type { Secretaria } from '@education-gestor/types'
import {
  useSecretarias,
  useCreateSecretaria,
  useUpdateSecretaria,
  useDeleteSecretaria,
} from '../hooks/useSecretarias'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { Button } from '../../../components/ui/button'
import { SearchInput } from '../../../components/SearchInput'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { PageHead } from '../../../components/PageHead'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { StatusBadge } from '../../../components/StatusBadge'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'

const createSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  responsible: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

const editSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').optional(),
  email: z.string().email('Email inválido').optional(),
  responsible: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  active: z.boolean().optional(),
})

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>

export function SecretariasPage() {
  const { data: secretarias = [], isLoading } = useSecretarias()
  const createMutation = useCreateSecretaria()
  const updateMutation = useUpdateSecretaria()
  const deleteMutation = useDeleteSecretaria()

  const createApiMutation = useApiMutation({
    mutationFn: (data: CreateFormData) => createMutation.mutateAsync(data),
    successMessage: 'Secretaria criada com sucesso',
    onSuccess: () => { setCreateOpen(false); resetCreate() },
  })

  const updateApiMutation = useApiMutation({
    mutationFn: (vars: { id: string; data: Record<string, unknown> }) => updateMutation.mutateAsync(vars),
    successMessage: 'Secretaria atualizada',
    onSuccess: () => setEditTarget(null),
  })

  const deleteApiMutation = useApiMutation({
    mutationFn: (id: string) => deleteMutation.mutateAsync(id),
    successMessage: 'Secretaria removida',
    onSuccess: () => setDeleteTarget(null),
    onError: () => setDeleteTarget(null),
  })

  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Secretaria | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Secretaria | null>(null)

  const filtered = secretarias.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateFormData>({ resolver: zodResolver(createSchema) })

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    setValue: setEditValue,
    watch: watchEdit,
    formState: { errors: editErrors },
  } = useForm<EditFormData>({ resolver: zodResolver(editSchema) })

  function openEdit(secretaria: Secretaria) {
    setEditTarget(secretaria)
    resetEdit({
      name: secretaria.name,
      email: secretaria.email,
      responsible: secretaria.responsible ?? '',
      phone: secretaria.phone ?? '',
      address: secretaria.address ?? '',
      active: secretaria.active,
    })
  }

  function onCreateSubmit(data: CreateFormData) {
    createApiMutation.mutate(data)
  }

  function onEditSubmit(data: EditFormData) {
    if (!editTarget) return
    updateApiMutation.mutate({
      id: editTarget.id,
      data: {
        ...data,
        phone: data.phone || null,
        address: data.address || null,
        responsible: data.responsible || null,
      },
    })
  }

  function onDeleteConfirm() {
    if (!deleteTarget) return
    deleteApiMutation.mutate(deleteTarget.id)
  }

  const createApiError = createApiMutation.isError
    ? extractErrorMessage(createApiMutation.error, 'Erro ao criar secretaria')
    : null

  const editApiError = updateApiMutation.isError
    ? extractErrorMessage(updateApiMutation.error, 'Erro ao atualizar secretaria')
    : null

  const activeValue = watchEdit('active')

  return (
    <div className="space-y-4">
      <PageHead
        title="Secretarias"
        subtitle={`${filtered.length} secretarias cadastradas`}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova secretaria
          </Button>
        }
      />

      <div className="max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome..."
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma secretaria encontrada.</p>
      )}

      {!isLoading && filtered.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.responsible ?? '—'}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>{s.phone ?? '—'}</TableCell>
                <TableCell>
                  <StatusBadge status={String(s.active)} kind="active" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(s)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog criação */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) { setCreateOpen(false); resetCreate() } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova secretaria</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input placeholder="Ex: Rede ABC" {...registerCreate('name')} />
              {createErrors.name && (
                <p className="text-xs text-destructive">{createErrors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" {...registerCreate('email')} />
              {createErrors.email && (
                <p className="text-xs text-destructive">{createErrors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Senha *</Label>
              <Input type="password" {...registerCreate('password')} />
              {createErrors.password && (
                <p className="text-xs text-destructive">{createErrors.password.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Responsável</Label>
              <Input {...registerCreate('responsible')} />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input {...registerCreate('phone')} />
            </div>
            <div className="space-y-1">
              <Label>Endereço</Label>
              <Input {...registerCreate('address')} />
            </div>
            {createApiError && (
              <p className="text-xs text-destructive text-center">{createApiError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setCreateOpen(false); resetCreate() }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createApiMutation.isPending}>
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog edição */}
      <Dialog open={!!editTarget} onOpenChange={(v) => { if (!v) setEditTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar secretaria</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input {...registerEdit('name')} />
              {editErrors.name && (
                <p className="text-xs text-destructive">{editErrors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" {...registerEdit('email')} />
              {editErrors.email && (
                <p className="text-xs text-destructive">{editErrors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Responsável</Label>
              <Input {...registerEdit('responsible')} />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input {...registerEdit('phone')} />
            </div>
            <div className="space-y-1">
              <Label>Endereço</Label>
              <Input {...registerEdit('address')} />
            </div>
            <div className="flex items-center gap-3">
              <Label>Ativo</Label>
              <Button
                type="button"
                variant={activeValue ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditValue('active', !activeValue)}
              >
                {activeValue ? 'Ativo' : 'Inativo'}
              </Button>
            </div>
            {editApiError && (
              <p className="text-xs text-destructive text-center">{editApiError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateApiMutation.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog confirmação de exclusão */}
      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={onDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
