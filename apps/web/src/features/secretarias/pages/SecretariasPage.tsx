import { useState, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Mail,
  Phone,
  User,
  MapPin,
  KeyRound,
  ChevronDown,
  ChevronRight,
  School as SchoolIcon,
  Link2,
  Unlink,
  ShieldCheck,
  Eye,
  EyeOff,
  Camera,
} from 'lucide-react'
import { extractErrorMessage } from '../../../lib/errors'
import { toast } from '../../../lib/toast'
import type { Secretaria, School } from '@education-gestor/types'
import {
  useSecretarias,
  useCreateSecretaria,
  useUpdateSecretaria,
  useDeleteSecretaria,
  useSecretariaSchools,
  useLinkSchool,
  useUnlinkSchool,
  useChangeSecretariaPassword,
  useChangeSchoolPassword,
  useToggleSecretariaFinancialVisibility,
  useUploadSecretariaLogo,
} from '../hooks/useSecretarias'
import { useSchools } from '../../schools/hooks/useSchools'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { Button } from '../../../components/ui/button'
import { SearchInput } from '../../../components/SearchInput'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Switch } from '../../../components/ui/switch'
import { Separator } from '../../../components/ui/separator'
import { PageHead } from '../../../components/PageHead'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { StatusBadge } from '../../../components/StatusBadge'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { Avatar } from '../../../components/Avatar'
import { ACCENT_COLOR, TONE_CONFIG } from '../../../lib/colors'
import { cn } from '../../../lib/utils'

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

const passwordSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

interface SecretariaCardProps {
  secretaria: Secretaria
  onEdit: (s: Secretaria) => void
  onDelete: (s: Secretaria) => void
  onResetPassword: (s: Secretaria) => void
  onSchoolResetPassword: (school: School, secretariaName: string) => void
}

function SecretariaCard({ secretaria, onEdit, onDelete, onResetPassword, onSchoolResetPassword }: SecretariaCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { data: schools = [], isLoading: loadingSchools } = useSecretariaSchools(expanded ? secretaria.id : '')
  const { data: allSchools } = useSchools()
  const toggleFinancial = useToggleSecretariaFinancialVisibility()
  const uploadLogo = useUploadSecretariaLogo()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const linkSchool = useLinkSchool(secretaria.id)
  const unlinkSchool = useUnlinkSchool(secretaria.id)

  const availableSchools = (allSchools ?? []).filter(
    (s) => !schools.find((linked) => linked.id === s.id),
  )

  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)

  async function handleLinkSchool() {
    if (!selectedSchoolId) return
    setLinkError(null)
    try {
      await linkSchool.mutateAsync(selectedSchoolId)
      toast.success('Escola vinculada com sucesso')
      setSelectedSchoolId(null)
    } catch (err) {
      setLinkError(extractErrorMessage(err, 'Erro ao vincular escola'))
    }
  }

  async function handleUnlinkSchool(schoolId: string) {
    try {
      await unlinkSchool.mutateAsync(schoolId)
      toast.success('Vínculo removido')
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Erro ao remover vínculo'))
    }
  }

  const t = secretaria.active ? TONE_CONFIG.emerald : TONE_CONFIG.slate

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md"
      style={{
        background: 'hsl(var(--card))',
        border: `1px solid ${t.borderColor}`,
      }}
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative group shrink-0">
            <Avatar name={secretaria.name} photoUrl={secretaria.logoUrl} size={48} />
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => logoInputRef.current?.click()}
            >
              <Camera className="h-4 w-4 text-white" />
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                uploadLogo.mutate({ id: secretaria.id, file }, {
                  onSuccess: () => toast.success('Logo atualizada'),
                  onError: () => toast.error('Erro ao enviar logo'),
                })
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-base leading-tight" style={{ color: 'hsl(var(--foreground))' }}>
                  {secretaria.name}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Criada em {new Date(secretaria.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <StatusBadge status={String(secretaria.active)} kind="active" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <Mail size={14} className="shrink-0" />
                <span className="truncate">{secretaria.email}</span>
              </div>
              {secretaria.responsible && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <User size={14} className="shrink-0" />
                  <span className="truncate">{secretaria.responsible}</span>
                </div>
              )}
              {secretaria.phone && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Phone size={14} className="shrink-0" />
                  <span>{secretaria.phone}</span>
                </div>
              )}
              {secretaria.address && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <MapPin size={14} className="shrink-0" />
                  <span className="truncate">{secretaria.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 mr-2">
            <Switch
              checked={secretaria.showFinancial}
              onCheckedChange={() => toggleFinancial.mutate(secretaria.id)}
              disabled={toggleFinancial.isPending}
              id={`sec-financial-${secretaria.id}`}
            />
            <Label htmlFor={`sec-financial-${secretaria.id}`} className="text-xs cursor-pointer">
              {secretaria.showFinancial ? <Eye size={14} /> : <EyeOff size={14} />}
            </Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(secretaria)}
          >
            <Pencil size={14} className="mr-1.5" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResetPassword(secretaria)}
          >
            <KeyRound size={14} className="mr-1.5" />
            Resetar senha
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(secretaria)}
          >
            <Trash2 size={14} className="mr-1.5" />
            Excluir
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setExpanded(!expanded)}
          >
            <Building2 size={14} className="mr-1.5" />
            {expanded && !loadingSchools ? `${schools.length} escola(s) vinculada(s)` : 'Ver escolas vinculadas'}
            {expanded ? <ChevronDown size={14} className="ml-1.5" /> : <ChevronRight size={14} className="ml-1.5" />}
          </Button>
        </div>
      </div>

      {/* Expanded: schools */}
      {expanded && (
        <div
          className="px-5 py-4 border-t"
          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--muted) / 0.3)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'hsl(var(--foreground))' }}>
            <SchoolIcon size={14} />
            Escolas vinculadas
            </h4>
          </div>

          {loadingSchools ? (
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Carregando...</p>
          ) : schools.length === 0 ? (
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Nenhuma escola vinculada a esta secretaria.
            </p>
          ) : (
            <div className="space-y-2 mb-4">
              {schools.map((school) => (
                <div
                  key={school.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex items-center justify-center rounded-full shrink-0"
                      style={{ width: 32, height: 32, background: TONE_CONFIG.indigo.iconBg, color: TONE_CONFIG.indigo.iconColor }}
                    >
                      <SchoolIcon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                        {school.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {school.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Resetar senha da escola"
                      title="Resetar senha"
                      onClick={() => onSchoolResetPassword(school, secretaria.name)}
                    >
                      <KeyRound size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      aria-label="Desvincular escola"
                      title="Desvincular"
                      onClick={() => handleUnlinkSchool(school.id)}
                    >
                      <Unlink size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Link new school */}
          {availableSchools.length > 0 && (
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Vincular escola</Label>
                <Select value={selectedSchoolId ?? ''} onValueChange={(v) => { setSelectedSchoolId(v); setLinkError(null) }}
                  items={availableSchools.map((s) => ({ value: s.id, label: s.name }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma escola" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSchools.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {linkError && (
                  <p className="text-xs text-destructive">{linkError}</p>
                )}
              </div>
              <Button
                size="sm"
                disabled={!selectedSchoolId || linkSchool.isPending}
                onClick={handleLinkSchool}
              >
                <Link2 size={14} className="mr-1" />
                Vincular
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function SecretariasPage() {
  const { data: secretarias = [], isLoading } = useSecretarias()
  const createMutation = useCreateSecretaria()
  const updateMutation = useUpdateSecretaria()
  const deleteMutation = useDeleteSecretaria()
  const changeSecretariaPassword = useChangeSecretariaPassword()
  const changeSchoolPassword = useChangeSchoolPassword()

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

  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Secretaria | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Secretaria | null>(null)
  const [passwordTarget, setPasswordTarget] = useState<{ type: 'secretaria' | 'school'; id: string; name: string } | null>(null)

  const filtered = secretarias.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

  const activeCount = secretarias.filter((s) => s.active).length

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

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })

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

  async function onPasswordSubmit(data: PasswordFormData) {
    if (!passwordTarget) return
    try {
      if (passwordTarget.type === 'secretaria') {
        await changeSecretariaPassword.mutateAsync({ id: passwordTarget.id, password: data.password })
      } else {
        await changeSchoolPassword.mutateAsync({ id: passwordTarget.id, password: data.password })
      }
      toast.success(`Senha de "${passwordTarget.name}" redefinida com sucesso`)
      setPasswordTarget(null)
      resetPassword()
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Erro ao redefinir senha'))
    }
  }

  const createApiError = createApiMutation.isError
    ? extractErrorMessage(createApiMutation.error, 'Erro ao criar secretaria')
    : null

  const editApiError = updateApiMutation.isError
    ? extractErrorMessage(updateApiMutation.error, 'Erro ao atualizar secretaria')
    : null

  const activeValue = watchEdit('active')

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHead
        title="Secretarias"
        subtitle={`${secretarias.length} secretarias cadastradas`}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova secretaria
          </Button>
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
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: TONE_CONFIG.indigo.valueColor }}>
              {secretarias.length}
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Total de secretarias
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
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: TONE_CONFIG.emerald.valueColor }}>
              {activeCount}
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Secretarias ativas
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{
            background: 'hsl(var(--card))',
            border: `1px solid ${TONE_CONFIG.slate.borderColor}`,
          }}
        >
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 44, height: 44, background: TONE_CONFIG.slate.iconBg, color: TONE_CONFIG.slate.iconColor }}
          >
            <User size={20} />
          </div>
          <div>
            <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: TONE_CONFIG.slate.valueColor }}>
              {secretarias.length - activeCount}
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Secretarias inativas
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

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 56, height: 56, background: 'hsl(var(--accent))' }}
          >
            <Building2 size={24} className="text-muted-foreground" />
          </div>
          <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            {search ? 'Nenhuma secretaria encontrada' : 'Nenhuma secretaria cadastrada'}
          </p>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {search ? 'Tente alterar o termo de busca' : 'Clique em "Nova secretaria" para começar'}
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((s) => (
            <SecretariaCard
              key={s.id}
              secretaria={s}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onResetPassword={(sec) => {
                resetPassword()
                setPasswordTarget({ type: 'secretaria', id: sec.id, name: sec.name })
              }}
              onSchoolResetPassword={(school, secretariaName) => {
                resetPassword()
                setPasswordTarget({ type: 'school', id: school.id, name: `${school.name} (${secretariaName})` })
              }}
            />
          ))}
        </div>
      )}

      {/* Dialog criação */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) { setCreateOpen(false); resetCreate() } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova secretaria</DialogTitle>
            <DialogDescription className="sr-only">
              Preencha os dados para cadastrar uma nova secretaria
            </DialogDescription>
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
            <DialogDescription className="sr-only">
              Altere os dados da secretaria
            </DialogDescription>
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
              <Label htmlFor="secretaria-active">Ativo</Label>
              <Switch
                id="secretaria-active"
                checked={activeValue}
                onCheckedChange={(checked) => setEditValue('active', checked)}
              />
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

      {/* Dialog redefinição de senha */}
      <Dialog open={!!passwordTarget} onOpenChange={(v) => { if (!v) { setPasswordTarget(null); resetPassword() } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>
              Redefinindo senha de <strong>{passwordTarget?.name ?? ''}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Nova senha *</Label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                {...registerPassword('password')}
              />
              {passwordErrors.password && (
                <p className="text-xs text-destructive">{passwordErrors.password.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setPasswordTarget(null); resetPassword() }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={changeSecretariaPassword.isPending || changeSchoolPassword.isPending}>
                Redefinir senha
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
