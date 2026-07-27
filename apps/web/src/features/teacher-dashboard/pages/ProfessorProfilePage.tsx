import { useState, useRef } from 'react'
import { Camera } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '../../../contexts/AuthContext'
import { useTeacher, useUpdateMyProfile, useChangeMyPassword, useUploadMyPhoto } from '../../teachers/hooks/useTeachers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { Separator } from '../../../components/ui/separator'
import { Avatar } from '../../../components/Avatar'

const profileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme a senha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

export function ProfessorProfilePage() {
  const { payload } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const teacherId = payload?.userId ?? ''
  const { data: teacher, isLoading } = useTeacher(teacherId)
  const updateProfile = useUpdateMyProfile()
  const changePassword = useChangeMyPassword()
  const uploadPhoto = useUploadMyPhoto()

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: teacher?.name ?? '',
      email: teacher?.email ?? '',
      phone: teacher?.phone ?? '',
    },
  })

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function onProfileSubmit(data: ProfileValues) {
    await updateProfile.mutateAsync(data, {
      onSuccess: () => toast.success('Perfil atualizado com sucesso'),
      onError: () => toast.error('Erro ao atualizar perfil'),
    })
  }

  async function onPasswordSubmit(data: PasswordValues) {
    await changePassword.mutateAsync(data.password, {
      onSuccess: () => {
        toast.success('Senha alterada com sucesso')
        resetPassword()
      },
      onError: () => toast.error('Erro ao alterar senha'),
    })
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido. Use JPEG, PNG ou WebP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.')
      return
    }
    setUploading(true)
    await uploadPhoto.mutateAsync(file, {
      onSuccess: () => toast.success('Foto atualizada com sucesso'),
      onError: () => toast.error('Erro ao enviar foto'),
      onSettled: () => setUploading(false),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      {/* Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Foto</CardTitle>
          <CardDescription>Sua foto será exibida no painel e nas turmas</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative group">
            <Avatar
              name={teacher?.name ?? ''}
              photoUrl={teacher?.photoUrl}
              size={96}
              className="rounded-full"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
            >
              <Camera className="h-6 w-6 text-white" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>JPEG, PNG ou WebP</p>
            <p>Máximo 10MB</p>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Atualize seu nome, e-mail e telefone</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" {...regProfile('name')} />
              {profileErrors.name && (
                <p className="text-sm text-red-500">{profileErrors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...regProfile('email')} />
              {profileErrors.email && (
                <p className="text-sm text-red-500">{profileErrors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(11) 99999-9999" {...regProfile('phone')} />
              {profileErrors.phone && (
                <p className="text-sm text-red-500">{profileErrors.phone.message}</p>
              )}
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
          <CardDescription>Defina uma nova senha para sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" type="password" {...regPassword('password')} />
              {passwordErrors.password && (
                <p className="text-sm text-red-500">{passwordErrors.password.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input id="confirmPassword" type="password" {...regPassword('confirmPassword')} />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-red-500">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Alterando...' : 'Alterar senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
