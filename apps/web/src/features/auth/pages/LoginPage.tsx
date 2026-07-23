import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLogin } from '../hooks/useLogin'
import { useAuth } from '../../../contexts/AuthContext'
import { extractErrorMessage } from '../../../lib/errors'
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
    if (token && payload) {
      sessionStorage.clear()
      navigate('/', { replace: true })
    }
  }, [token, payload, navigate])

  function onSubmit(data: FormData) {
    login(data)
  }

  return (
    <div
      className="w-full max-w-sm mx-auto flex flex-col gap-5"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--iris-slate-200)',
        borderRadius: 16,
        padding: '24px 24px 20px',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Logo IRIS vertical */}
      <div className="flex flex-col items-center gap-3 mb-1">
        <svg width="48" height="48" viewBox="0 0 120 120" aria-label="IRIS">
          <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke="#312E81" strokeWidth="3.4" />
          <circle cx="60" cy="60" r="18" fill="#818CF8" />
          <circle cx="60" cy="60" r="12" fill="#4F46E5" />
          <circle cx="60" cy="60" r="7"  fill="#312E81" />
        </svg>
        <div className="text-center">
          <div
            className="font-bold tracking-widest"
            style={{ fontSize: 17, color: 'var(--iris-blue-900)', letterSpacing: 3 }}
          >
            IRIS
          </div>
          <div
            className="font-semibold tracking-widest"
            style={{ fontSize: 10, color: 'var(--iris-blue-500)', letterSpacing: 6, marginTop: 1 }}
          >
            EDUCAÇÃO
          </div>
        </div>
      </div>

      <div className="text-center -mt-1">
        <h1 className="font-bold" style={{ fontSize: 18, color: 'var(--iris-blue-900)' }}>
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
            {extractErrorMessage(error, 'Email ou senha incorretos')}
          </p>
        )}

        <Button type="submit" className="w-full mt-1" disabled={isPending}>
          {isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
