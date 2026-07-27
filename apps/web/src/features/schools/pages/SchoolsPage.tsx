import { useState, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Pencil,
  Trash2,
  School as SchoolIcon,
  Mail,
  Phone,
  User,
  MapPin,
  KeyRound,
  ShieldCheck,
  BookOpen,
  Eye,
  EyeOff,
} from 'lucide-react'
import { extractErrorMessage } from '../../../lib/errors'
import { useSchools, useCreateSchool, useUpdateSchool, useDeleteSchool, useChangeSchoolPassword } from '../hooks/useSchools'
import { useAuth } from '../../../contexts/AuthContext'
import { toast } from '../../../lib/toast'
import { PageHead } from '../../../components/PageHead'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Switch } from '../../../components/ui/switch'
import { Separator } from '../../../components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { SearchInput } from '../../../components/SearchInput'
import { Avatar } from '../../../components/Avatar'
import type { School } from '@education-gestor/types'
import { TONE_CONFIG } from '../../../lib/colors'
import { useToggleSchoolFinancialVisibility } from '../hooks/useSchools'

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

const passwordSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>
type PasswordForm = z.infer<typeof passwordSchema>

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\u0300-\u036f/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface SchoolCardProps {
  school: School
  isSecretaria: boolean
  onEdit: (school: School) => void
  onDelete: (id: string) => void
  onResetPassword: (school: School) => void
}

function SchoolCard({ school, isSecretaria, onEdit, onDelete, onResetPassword }: SchoolCardProps) {
  const toggleFinancial = useToggleSchoolFinancialVisibility()
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md"
      style={{
        background: 'hsl(var(--card))',
        border: `1px solid ${TONE_CONFIG.indigo.borderColor}`,
      }}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <Avatar name={school.name} size={48} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight" style={{ color: 'hsl(var(--foreground))' }}>
              {school.name}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              slug: {school.slug} &middot; Criada em {new Date(school.createdAt).toLocaleDateString('pt-BR')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <Mail size={14} className="shrink-0" />
                <span className="truncate">{school.email}</span>
              </div>
              {school.director && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <User size={14} className="shrink-0" />
                  <span className="truncate">Dir: {school.director}</span>
                </div>
              )}
              {school.coordinator && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <BookOpen size={14} className="shrink-0" />
                  <span className="truncate">Coord: {school.coordinator}</span>
                </div>
              )}
              {school.phone && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Phone size={14} className="shrink-0" />
                  <span>{school.phone}</span>
                </div>
              )}
              {school.address && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <MapPin size={14} className="shrink-0" />
                  <span className="truncate">{school.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex items-center gap-2 flex-wrap">
          {!isSecretaria && (
          <div className="flex items-center gap-2 mr-2">
            <Switch
              checked={school.showFinancial}
              onCheckedChange={() => toggleFinancial.mutate(school.id)}
              disabled={toggleFinancial.isPending}
              id={`school-financial-${school.id}`}
            />
            <Label htmlFor={`school-financial-${school.id}`} className="text-xs cursor-pointer">
              {school.showFinancial ? <Eye size={14} /> : <EyeOff size={14} />}
            </Label>
            {school.showFinancial ? 'Informações financeiras visíveis' : 'Informações financeiras ocultas'}
          </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResetPassword(school)}
          >
            <KeyRound size={14} className="mr-1.5" />
            Resetar senha
          </Button>
          {isSecretaria && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(school)}
              >
                <Pencil size={14} className="mr-1.5" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(school.id)}
              >
                <Trash2 size={14} className="mr-1.5" />
                Excluir
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function SchoolsPage() {
  const { payload } = useAuth()
  const { data: schools, isLoading } = useSchools()
  const createMutation = useCreateSchool()
  const updateMutation = useUpdateSchool()
  const deleteMutation = useDeleteSchool()
  const changeSchoolPassword = useChangeSchoolPassword()

  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<School | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [passwordTarget, setPasswordTarget] = useState<{ id: string; name: string } | null>(null)

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) })
  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) })
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })
  const slugManuallyEdited = useRef(false)

  const filtered = schools?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

  const isSecretaria = payload?.role === 'secretaria'

  function handleEdit(school: School) {
    setCreateOpen(false)
    createForm.reset()
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

  function handleCreate() {
    setEditing(undefined)
    setCreateOpen(true)
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

  async function onPasswordSubmit(data: PasswordForm) {
    if (!passwordTarget) return
    try {
      await changeSchoolPassword.mutateAsync({ id: passwordTarget.id, password: data.password })
      toast.success(`Senha de "${passwordTarget.name}" redefinida com sucesso`)
      setPasswordTarget(null)
      passwordForm.reset()
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Erro ao redefinir senha'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Escolas"
        subtitle={`${schools?.length ?? 0} escolas cadastradas`}
        actions={
          isSecretaria ? (
            <Button size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Nova escola
            </Button>
          ) : undefined
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{
            background: 'hsl(var(--card))',
            border: `1px solid ${TONE_CONFIG.indigo.borderColor}`,
          }}
        >
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 44, height: 44, background: TONE_CONFIG.indigo.iconBg, color: TONE_CONFIG.indigo.iconColor }}
          >
            <SchoolIcon size={20} />
          </div>
          <div>
            <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: TONE_CONFIG.indigo.valueColor }}>
              {schools?.length ?? 0}
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Total de escolas
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{
            background: 'hsl(var(--card))',
            border: `1px solid ${TONE_CONFIG.emerald.borderColor}`,
          }}
        >
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 44, height: 44, background: TONE_CONFIG.emerald.iconBg, color: TONE_CONFIG.emerald.iconColor }}
          >
            <User size={20} />
          </div>
          <div>
            <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: TONE_CONFIG.emerald.valueColor }}>
              {schools?.filter((s) => s.director).length ?? 0}
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Com diretor definido
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{
            background: 'hsl(var(--card))',
            border: `1px solid ${TONE_CONFIG.violet.borderColor}`,
          }}
        >
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 44, height: 44, background: TONE_CONFIG.violet.iconBg, color: TONE_CONFIG.violet.iconColor }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: TONE_CONFIG.violet.valueColor }}>
              {schools?.filter((s) => s.coordinator).length ?? 0}
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Com coordenador definido
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <SearchInput
          value={search}
          onChange={(v) => { setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!v) next.delete('q'); else next.set('q', v); return next }) }}
          placeholder="Buscar por nome..."
        />
      </div>

      {/* List */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl h-32 animate-pulse"
              style={{ background: 'hsl(var(--muted))' }}
            />
          ))}
        </div>
      )}

      {!isLoading && (!filtered || filtered.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 56, height: 56, background: 'hsl(var(--accent))' }}
          >
            <SchoolIcon size={24} className="text-muted-foreground" />
          </div>
          <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            {search ? 'Nenhuma escola encontrada' : 'Nenhuma escola cadastrada'}
          </p>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {search ? 'Tente alterar o termo de busca' : 'Clique em "Nova escola" para começar'}
          </p>
        </div>
      )}

      {!isLoading && filtered && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((s) => (
            <SchoolCard
              key={s.id}
              school={s}
              isSecretaria={isSecretaria}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteTarget(id)}
              onResetPassword={(school) => {
                passwordForm.reset()
                setPasswordTarget({ id: school.id, name: school.name })
              }}
            />
          ))}
        </div>
      )}

      {/* Dialog criação */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) { setCreateOpen(false); createForm.reset(); slugManuallyEdited.current = false } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova escola</DialogTitle>
            <DialogDescription className="sr-only">Criar uma nova escola</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input
                  {...createForm.register('name')}
                  onChange={(e) => {
                    createForm.setValue('name', e.target.value)
                    if (!slugManuallyEdited.current) {
                      createForm.setValue('slug', slugify(e.target.value))
                    }
                  }}
                />
                {createForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{createForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Slug *</Label>
                <Input
                  placeholder="ex: escola-modelo"
                  {...createForm.register('slug')}
                  onChange={(e) => {
                    slugManuallyEdited.current = true
                    createForm.setValue('slug', e.target.value)
                  }}
                />
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
              <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); createForm.reset(); slugManuallyEdited.current = false }}>
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
            <DialogDescription className="sr-only">Editar dados da escola</DialogDescription>
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

      {/* Dialog redefinição de senha */}
      <Dialog open={!!passwordTarget} onOpenChange={(v) => { if (!v) { setPasswordTarget(null); passwordForm.reset() } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>
              Redefinindo senha de <strong>{passwordTarget?.name ?? ''}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Nova senha *</Label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                {...passwordForm.register('password')}
              />
              {passwordForm.formState.errors.password && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setPasswordTarget(null); passwordForm.reset() }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={changeSchoolPassword.isPending}>
                Redefinir senha
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
