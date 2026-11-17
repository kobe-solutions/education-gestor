import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useLogin } from '../hooks/useLogin'
import { useAuth } from '../../../contexts/AuthContext'
import { extractErrorMessage } from '../../../lib/errors'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { token, payload } = useAuth()
  const { mutate: login, isPending, error } = useLogin()
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(() => !!localStorage.getItem('rememberedEmail'))

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: localStorage.getItem('rememberedEmail') ?? '',
    },
  })

  useEffect(() => {
    if (token && payload) {
      sessionStorage.clear()
      navigate('/', { replace: true })
    }
  }, [token, payload, navigate])

  function onSubmit(data: FormData) {
    if (remember) {
      localStorage.setItem('rememberedEmail', data.email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }
    login(data)
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border bg-card p-6 shadow-(--shadow-md) sm:p-8">
      <div className="flex items-center justify-center gap-3">
        <img src="/iris-icon.svg" alt="" className="size-12 rounded-xl bg-secondary p-1" />
        <div>
          <p className="text-lg font-bold tracking-widest text-primary">IRIS</p>
          <p className="text-[10px] font-semibold tracking-[0.32em] text-primary">EDUCAÇÃO</p>
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Acesse sua conta</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Entre com o e-mail e a senha cadastrados.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            E-mail
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="email@escola.com"
              autoComplete="email"
              className="pl-9"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-sm font-medium">
            Senha
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="pl-9 pr-9"
              {...register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && (
            <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.password.message}</p>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox 
            checked={remember}
            onCheckedChange={(checked) => setRemember(checked)}
            className="rounded border-input"
          />
          <span className="text-sm text-muted-foreground">Lembrar meu e-mail neste dispositivo</span>
        </label>

        {error && (
          <p className="text-xs text-center" style={{ color: 'hsl(var(--destructive))' }}>
            {extractErrorMessage(error, 'Email ou senha incorretos')}
          </p>
        )}

        <Button type="submit" className="mt-1 w-full" disabled={isPending}>
          {isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
