import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { extractErrorMessage } from '../../../lib/errors'
import { useSchools, useCreateSchool, useUpdateSchool, useDeleteSchool } from '../hooks/useSchools'
import { useAuth } from '../../../contexts/AuthContext'
import { toast } from '../../../lib/toast'
import { PageHead } from '../../../components/PageHead'
import { Surface } from '../../../components/Surface'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Skeleton } from '../../../components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { SearchInput } from '../../../components/SearchInput'
import type { School } from '@education-gestor/types'

const createSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  slug: z.string().min(2, 'Slug obrigatório').regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  director: z.string().optional(),
  coordinator: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

const editSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  slug: z.string().min(2, 'Slug obrigatório').regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  email: z.string().email('Email inválido'),
  director: z.string().optional(),
  coordinator: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

export function SchoolsPage() {
  const { payload } = useAuth()
  const { data: schools, isLoading } = useSchools()
  const createMutation = useCreateSchool()
  const updateMutation = useUpdateSchool()
  const deleteMutation = useDeleteSchool()

  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<School | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) })
  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) })

  const filtered = schools?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

  const isSecretaria = payload?.role === 'secretaria'

  function handleEdit(school: School) {
    setEditing(school)
    editForm.reset({
      name: school.name,
      slug: school.slug,
      email: school.email,
      director: school.director ?? '',
      coordinator: school.coordinator ?? '',
      phone: school.phone ?? '',
      address: school.address ?? '',
    })
  }

  function onCreateSubmit(data: CreateForm) {
    createMutation.mutate(
      {
        ...data,
        director: data.director || undefined,
        coordinator: data.coordinator || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Escola criada com sucesso')
          setCreateOpen(false)
          createForm.reset()
        },
        onError: (err) => {
          const msg = extractErrorMessage(err)
          toast.error(msg)
        },
      },
    )
  }

  function onEditSubmit(data: EditForm) {
    if (!editing) return
    updateMutation.mutate(
      {
        id: editing.id,
        data: {
          name: data.name,
          slug: data.slug,
          email: data.email,
          director: data.director || null,
          coordinator: data.coordinator || null,
          phone: data.phone || null,
          address: data.address || null,
        },
      },
      {
        onSuccess: () => {
          toast.success('Escola atualizada')
          setEditing(undefined)
        },
        onError: (err) => {
          const msg = extractErrorMessage(err)
          toast.error(msg)
        },
      },
    )
  }

  return (
    <div className="space-y-5">
      <PageHead
        title="Escolas"
        subtitle={`${filtered?.length ?? 0} escolas cadastradas`}
        actions={
          isSecretaria ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova escola
            </Button>
          ) : undefined
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
            {Array.from({ length: 4 }).map((_, i) => (
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
                  <th className="hidden md:table-cell">Diretor</th>
                  <th className="hidden lg:table-cell">Coordenador</th>
                  <th>Email</th>
                  <th className="hidden sm:table-cell">Telefone</th>
                  {isSecretaria && <th style={{ width: 80 }} />}
                </tr>
              </thead>
              <tbody>
                {!filtered?.length && (
                  <tr>
                    <td
                      colSpan={isSecretaria ? 6 : 5}
                      className="text-center py-10"
                      style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13 }}
                    >
                      Nenhuma escola encontrada
                    </td>
                  </tr>
                )}
                {filtered?.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                        {s.name}
                      </span>
                    </td>
                    <td className="hidden md:table-cell" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {s.director ?? '—'}
                    </td>
                    <td className="hidden lg:table-cell" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {s.coordinator ?? '—'}
                    </td>
                    <td style={{ color: 'hsl(var(--muted-foreground))' }}>{s.email}</td>
                    <td className="hidden sm:table-cell" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {s.phone ?? '—'}
                    </td>
                    {isSecretaria && (
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
                            onClick={() => setDeleteTarget(s.id)}
                          >
                            <Trash2 size={14} className="text-destructive" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      )}

      {/* Dialog criação */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) { setCreateOpen(false); createForm.reset() } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova escola</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input {...createForm.register('name')} />
                {createForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{createForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Slug *</Label>
                <Input placeholder="ex: escola-modelo" {...createForm.register('slug')} />
                {createForm.formState.errors.slug && (
                  <p className="text-xs text-destructive">{createForm.formState.errors.slug.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" {...createForm.register('email')} />
                {createForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{createForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Senha *</Label>
                <Input type="password" {...createForm.register('password')} />
                {createForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{createForm.formState.errors.password.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Diretor</Label>
                <Input placeholder="Nome do diretor" {...createForm.register('director')} />
              </div>
              <div className="space-y-1">
                <Label>Coordenador</Label>
                <Input placeholder="Nome do coordenador" {...createForm.register('coordinator')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input placeholder="(00) 00000-0000" {...createForm.register('phone')} />
              </div>
              <div className="space-y-1">
                <Label>Endereço</Label>
                <Input placeholder="Rua, número, bairro" {...createForm.register('address')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); createForm.reset() }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog edição */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(undefined)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar escola</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input {...editForm.register('name')} />
                {editForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{editForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Slug *</Label>
                <Input {...editForm.register('slug')} />
                {editForm.formState.errors.slug && (
                  <p className="text-xs text-destructive">{editForm.formState.errors.slug.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" {...editForm.register('email')} />
              {editForm.formState.errors.email && (
                <p className="text-xs text-destructive">{editForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Diretor</Label>
                <Input placeholder="Nome do diretor" {...editForm.register('director')} />
              </div>
              <div className="space-y-1">
                <Label>Coordenador</Label>
                <Input placeholder="Nome do coordenador" {...editForm.register('coordinator')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input placeholder="(00) 00000-0000" {...editForm.register('phone')} />
              </div>
              <div className="space-y-1">
                <Label>Endereço</Label>
                <Input placeholder="Rua, número, bairro" {...editForm.register('address')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(undefined)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog exclusão */}
      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => {
          deleteMutation.mutate(deleteTarget!, {
            onSuccess: () => {
              toast.success('Escola removida')
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
