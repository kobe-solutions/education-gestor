import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { AxiosError } from 'axios'
import { useSchools, useCreateSchool, useUpdateSchool, useDeleteSchool } from '../hooks/useSchools'
import { useAuth } from '../../../contexts/AuthContext'
import { toast } from '../../../lib/toast'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
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
          const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message
          toast.error(msg ?? 'Erro inesperado')
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
          const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message
          toast.error(msg ?? 'Erro inesperado')
        },
      },
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Escolas</h1>
        {isSecretaria && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova escola
          </Button>
        )}
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {filtered?.length ?? 0} escolas cadastradas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Diretor</TableHead>
                  <TableHead>Coordenador</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  {isSecretaria && <TableHead className="w-24" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {!filtered?.length && (
                  <TableRow>
                    <TableCell colSpan={isSecretaria ? 6 : 5} className="text-center text-muted-foreground">
                      Nenhuma escola encontrada
                    </TableCell>
                  </TableRow>
                )}
                {filtered?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.director ?? '—'}</TableCell>
                    <TableCell>{s.coordinator ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email}</TableCell>
                    <TableCell className="text-muted-foreground">{s.phone ?? '—'}</TableCell>
                    {isSecretaria && (
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
                    toast.success('Escola removida')
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
