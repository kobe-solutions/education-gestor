import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLogin } from '../hooks/useLogin'
import { useAuth } from '../../../contexts/AuthContext'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { token, payload } = useAuth()
  const { mutate: login, isPending, error } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (token && payload) navigate('/', { replace: true })
  }, [token, payload, navigate])

  function onSubmit(data: FormData) {
    login(data)
  }

  return (
    <div
      className="w-full flex flex-col gap-5"
      style={{
        maxWidth: 380,
        background: '#FFFFFF',
        border: '1px solid var(--iris-slate-200)',
        borderRadius: 16,
        padding: '28px 28px 24px',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Logo IRIS vertical */}
      <div className="flex flex-col items-center gap-3 mb-1">
        <svg width="48" height="48" viewBox="0 0 120 120" aria-label="IRIS">
          <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke="#042C53" strokeWidth="3.4" />
          <circle cx="60" cy="60" r="18" fill="#378ADD" />
          <circle cx="60" cy="60" r="12" fill="#185FA5" />
          <circle cx="60" cy="60" r="7"  fill="#042C53" />
        </svg>
        <div className="text-center">
          <div
            className="font-bold tracking-widest"
            style={{ fontSize: 17, color: '#042C53', letterSpacing: 3 }}
          >
            IRIS
          </div>
          <div
            className="font-semibold tracking-widest"
            style={{ fontSize: 10, color: '#378ADD', letterSpacing: 6, marginTop: 1 }}
          >
            EDUCAÇÃO
          </div>
        </div>
      </div>

      <div className="text-center -mt-1">
        <h1 className="font-bold" style={{ fontSize: 18, color: '#042C53' }}>
          Bem-vindo
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--iris-slate-500)' }}>
          Acesse a gestão escolar da sua instituição
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" style={{ fontSize: 13, color: 'var(--iris-slate-700)', fontWeight: 500 }}>
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="email@escola.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs" style={{ color: 'var(--iris-danger-600)' }}>{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" style={{ fontSize: 13, color: 'var(--iris-slate-700)', fontWeight: 500 }}>
            Senha
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs" style={{ color: 'var(--iris-danger-600)' }}>{errors.password.message}</p>
          )}
        </div>

        {error && (
          <p className="text-xs text-center" style={{ color: 'var(--iris-danger-600)' }}>
            Email ou senha incorretos
          </p>
        )}

        <Button type="submit" className="w-full mt-1" disabled={isPending}>
          {isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
