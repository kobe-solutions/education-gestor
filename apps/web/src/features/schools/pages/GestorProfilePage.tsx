import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, KeyRound, School, ShieldCheck, Upload } from 'lucide-react'
import {
  useChangeMySchoolPassword,
  useMySchool,
  useUpdateMySchool,
  useUploadMySchoolLogo,
} from '../hooks/useSchools'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { PageHead } from '../../../components/PageHead'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { MaskedInput } from '../../../components/ui/masked-input'
import { Skeleton } from '../../../components/ui/skeleton'

const profileSchema = z.object({
  name: z.string().min(2, 'Nome da escola obrigatório'),
  email: z.string().email('E-mail inválido'),
  director: z.string().optional(),
  coordinator: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  minPassingGrade: z.coerce.number().min(0, 'Mínimo 0').max(10, 'Máximo 10'),
  minAttendancePercentage: z.coerce.number().int('Use número inteiro').min(0, 'Mínimo 0%').max(100, 'Máximo 100%'),
})

type ProfileFormData = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirme a nova senha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
})

type PasswordFormData = z.infer<typeof passwordSchema>

export function GestorProfilePage() {
  const { data: school, isLoading } = useMySchool()
  const updateMutation = useUpdateMySchool()
  const passwordMutation = useChangeMySchoolPassword()
  const uploadLogoMutation = useUploadMySchoolLogo()
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      director: '',
      coordinator: '',
      phone: '',
      address: '',
      minPassingGrade: 6,
      minAttendancePercentage: 75,
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (!school) return
    profileForm.reset({
      name: school.name,
      email: school.email,
      director: school.director ?? '',
      coordinator: school.coordinator ?? '',
      phone: school.phone ?? '',
      address: school.address ?? '',
      minPassingGrade: school.minPassingGrade ?? 6,
      minAttendancePercentage: school.minAttendancePercentage ?? 75,
    })
  }, [school, profileForm])

  const saveProfile = useApiMutation({
    mutationFn: (data: ProfileFormData) =>
      updateMutation.mutateAsync({
        name: data.name,
        email: data.email,
        director: data.director || null,
        coordinator: data.coordinator || null,
        phone: data.phone || null,
        address: data.address || null,
        minPassingGrade: data.minPassingGrade,
        minAttendancePercentage: data.minAttendancePercentage,
      }),
    successMessage: 'Perfil e critérios de aprovação atualizados!',
  })

  const savePassword = useApiMutation({
    mutationFn: (data: PasswordFormData) => passwordMutation.mutateAsync(data.password),
    successMessage: 'Senha de acesso atualizada!',
    onSuccess: () => passwordForm.reset({ password: '', confirmPassword: '' }),
  })

  const uploadLogo = useApiMutation({
    mutationFn: (file: File) => uploadLogoMutation.mutateAsync(file),
    successMessage: 'Logotipo atualizado!',
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHead
        title="Perfil da Escola e Critérios"
        subtitle="Atualize os dados da gestão, senha de acesso e regras de aprovação do boletim."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              {school?.logoUrl ? (
                <img
                  src={school.logoUrl}
                  alt={school.name}
                  className="h-14 w-14 rounded-xl object-cover border"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <School className="h-7 w-7" />
                </div>
              )}
              <div>
                <CardTitle>{school?.name ?? 'Minha Escola'}</CardTitle>
                <CardDescription>Identificador: {school?.slug}</CardDescription>
              </div>
            </div>
            <div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadLogo.mutate(file)
                  e.target.value = ''
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadLogo.isPending}
                onClick={() => logoInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                {uploadLogo.isPending ? 'Enviando...' : 'Alterar logotipo'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={profileForm.handleSubmit((data) => saveProfile.mutate(data))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados da Gestão e Instituição</CardTitle>
            <CardDescription>Informações exibidas no painel e nos documentos emitidos pela escola.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="gestor-school-name">Nome da escola *</Label>
              <Input id="gestor-school-name" {...profileForm.register('name')} />
              {profileForm.formState.errors.name && (
                <p className="text-xs text-destructive">{profileForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gestor-school-email">E-mail de acesso (Gestor) *</Label>
              <Input id="gestor-school-email" type="email" {...profileForm.register('email')} />
              {profileForm.formState.errors.email && (
                <p className="text-xs text-destructive">{profileForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gestor-director">Diretor(a)</Label>
              <Input id="gestor-director" placeholder="Nome do(a) diretor(a)" {...profileForm.register('director')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gestor-coordinator">Coordenador(a)</Label>
              <Input id="gestor-coordinator" placeholder="Nome do(a) coordenador(a)" {...profileForm.register('coordinator')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gestor-phone">Telefone</Label>
              <MaskedInput
                id="gestor-phone"
                mask="phone"
                value={profileForm.watch('phone') ?? ''}
                onChange={(e) => profileForm.setValue('phone', e.target.value, { shouldDirty: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gestor-address">Endereço</Label>
              <Input id="gestor-address" placeholder="Rua, número, bairro..." {...profileForm.register('address')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Critérios de Aprovação (Boletim)
            </CardTitle>
            <CardDescription>
              Defina a média mínima e a frequência mínima exigidas para aprovação nos boletins escolares.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="gestor-min-grade">Média mínima para aprovação (0 a 10) *</Label>
              <Input
                id="gestor-min-grade"
                type="number"
                step="0.5"
                min={0}
                max={10}
                {...profileForm.register('minPassingGrade')}
              />
              {profileForm.formState.errors.minPassingGrade && (
                <p className="text-xs text-destructive">{profileForm.formState.errors.minPassingGrade.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gestor-min-attendance">Frequência mínima (%) *</Label>
              <Input
                id="gestor-min-attendance"
                type="number"
                min={0}
                max={100}
                {...profileForm.register('minAttendancePercentage')}
              />
              {profileForm.formState.errors.minAttendancePercentage && (
                <p className="text-xs text-destructive">{profileForm.formState.errors.minAttendancePercentage.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" />
            Alterar Senha de Acesso
          </CardTitle>
          <CardDescription>Mínimo de 8 caracteres.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit((data) => savePassword.mutate(data))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="gestor-new-password">Nova senha *</Label>
              <div className="relative">
                <Input
                  id="gestor-new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="pr-10"
                  {...passwordForm.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.password && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gestor-confirm-password">Confirmar nova senha *</Label>
              <Input
                id="gestor-confirm-password"
                type={showPassword ? 'text' : 'password'}
                {...passwordForm.register('confirmPassword')}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" variant="outline" disabled={savePassword.isPending}>
                {savePassword.isPending ? 'Atualizando...' : 'Atualizar senha'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
