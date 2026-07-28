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
  Search,
  X,
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
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Switch } from '../../../components/ui/switch'
import { Separator } from '../../../components/ui/separator'
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
      className="rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        background: 'hsl(var(--card))',
        border: `1px solid ${t.borderColor}`,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="relative group shrink-0">
            <Avatar name={secretaria.name} photoUrl={secretaria.logoUrl} size={52} />
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
                <h3 className="font-bold text-lg leading-tight" style={{ color: 'hsl(var(--foreground))' }}>
                  {secretaria.name}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Criada em {new Date(secretaria.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <StatusBadge status={String(secretaria.active)} kind="active" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 mt-4">
              <div className="flex items-center gap-2.5 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <Mail size={14} className="shrink-0" style={{ color: ACCENT_COLOR }} />
                <span className="truncate">{secretaria.email}</span>
              </div>
              {secretaria.responsible && (
                <div className="flex items-center gap-2.5 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <User size={14} className="shrink-0" style={{ color: ACCENT_COLOR }} />
                  <span className="truncate">{secretaria.responsible}</span>
                </div>
              )}
              {secretaria.phone && (
                <div className="flex items-center gap-2.5 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Phone size={14} className="shrink-0" style={{ color: ACCENT_COLOR }} />
                  <span>{secretaria.phone}</span>
                </div>
              )}
              {secretaria.address && (
                <div className="flex items-center gap-2.5 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <MapPin size={14} className="shrink-0" style={{ color: ACCENT_COLOR }} />
                  <span className="truncate">{secretaria.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 mr-2">
            <Switch
              checked={secretaria.showFinancial}
              onCheckedChange={() => toggleFinancial.mutate(secretaria.id)}
              disabled={toggleFinancial.isPending}
              id={`sec-financial-${secretaria.id}`}
            />
            <Label htmlFor={`sec-financial-${secretaria.id}`} className="text-xs cursor-pointer flex items-center gap-1">
              {secretaria.showFinancial ? <Eye size={14} /> : <EyeOff size={14} />}
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>Financeiro</span>
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

      {expanded && (
        <div
          className="p-5 sm:p-6 border-t transition-all duration-300 animate-in fade-in slide-in-from-top-2"
          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--muted) / 0.3)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'hsl(var(--foreground))' }}>
            <SchoolIcon size={14} />
            Escolas vinculadas
            </h4>
          </div>

          {loadingSchools ? (
            <div className="flex items-center gap-3 py-3">
              <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Carregando...</span>
            </div>
          ) : schools.length === 0 ? (
            <p className="text-sm py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Nenhuma escola vinculada a esta secretaria.
            </p>
          ) : (
            <div className="space-y-2 mb-4">
              {schools.map((school) => (
                <div
                  key={school.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50"
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
  const inactiveCount = secretarias.length - activeCount

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

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, hsl(245 58% 51% / 0.12), hsl(245 58% 51% / 0.04))',
          border: '1px solid hsl(245 58% 51% / 0.15)',
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.04] pointer-events-none">
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(245 58% 51%), transparent)' }}
          />
        </div>
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="flex items-center justify-center rounded-lg p-2"
                  style={{ background: TONE_CONFIG.indigo.iconBg, color: TONE_CONFIG.indigo.iconColor }}
                >
                  <Building2 size={20} />
                </div>
                <h1
                  className="font-bold leading-tight"
                  style={{ fontSize: 24, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}
                >
                  Secretarias
                </h1>
              </div>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Gerencie as secretarias regionais de ensino
              </p>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="shrink-0 shadow-sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Nova secretaria
            </Button>
          </div>

          {/* Stats inline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <div
              className="rounded-xl p-4 flex items-center gap-4 bg-card"
              style={{
                border: `1px solid ${TONE_CONFIG.indigo.borderColor}`,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                className="flex items-center justify-center rounded-lg shrink-0"
                style={{ width: 44, height: 44, background: TONE_CONFIG.indigo.iconBg, color: TONE_CONFIG.indigo.iconColor }}
              >
                <Building2 size={20} />
              </div>
              <div>
                <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: 'hsl(var(--foreground))' }}>
                  {secretarias.length}
                </p>
                <p className="text-xs font-medium mt-1.5 uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Total
                </p>
              </div>
            </div>

            <div
              className="rounded-xl p-4 flex items-center gap-4 bg-card"
              style={{
                border: `1px solid ${TONE_CONFIG.emerald.borderColor}`,
                boxShadow: 'var(--shadow-sm)',
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
                <p className="text-xs font-medium mt-1.5 uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Ativas
                </p>
              </div>
            </div>

            <div
              className="rounded-xl p-4 flex items-center gap-4 bg-card"
              style={{
                border: `1px solid ${TONE_CONFIG.slate.borderColor}`,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                className="flex items-center justify-center rounded-lg shrink-0"
                style={{ width: 44, height: 44, background: TONE_CONFIG.slate.iconBg, color: TONE_CONFIG.slate.iconColor }}
              >
                <User size={20} />
              </div>
              <div>
                <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: 'hsl(var(--foreground))' }}>
                  {inactiveCount}
                </p>
                <p className="text-xs font-medium mt-1.5 uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Inativas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <Input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => {
              const v = e.target.value
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev)
                if (!v) next.delete('q')
                else next.set('q', v)
                return next
              })
            }}
            className="pl-9 h-9 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete('q'); return next })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {search && (
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {filtered.length} de {secretarias.length} resultado(s)
          </p>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            >
              <div className="p-5 sm:p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-[52px] h-[52px] rounded-full" style={{ background: 'hsl(var(--muted))' }} />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-48 rounded-md" style={{ background: 'hsl(var(--muted))' }} />
                    <div className="h-3 w-32 rounded-sm" style={{ background: 'hsl(var(--muted))' }} />
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="h-4 rounded-sm" style={{ background: 'hsl(var(--muted))' }} />
                      <div className="h-4 rounded-sm" style={{ background: 'hsl(var(--muted))' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 64, height: 64, background: TONE_CONFIG.indigo.iconBg }}
          >
            <Building2 size={28} style={{ color: TONE_CONFIG.indigo.iconColor }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg" style={{ color: 'hsl(var(--foreground))' }}>
              {search ? 'Nenhuma secretaria encontrada' : 'Nenhuma secretaria cadastrada'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {search ? 'Tente alterar o termo de busca' : 'Clique em "Nova secretaria" para começar'}
            </p>
          </div>
          {!search && (
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova secretaria
            </Button>
          )}
        </div>
      )}

      {/* List */}
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
                checked={watchEdit('active')}
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
