import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router'
import { Button } from './ui/button'
import { AlertTriangle } from 'lucide-react'

export function RouteError() {
  const error = useRouteError()
  const navigate = useNavigate()

  let title = 'Algo deu errado'
  let message = 'Ocorreu um erro inesperado. Tente novamente.'

  if (isRouteErrorResponse(error)) {
    title = `${error.status} — ${error.statusText || 'Erro'}`
    message = error.status === 404
      ? 'A página que você procura não existe.'
      : error.data?.message || 'O servidor retornou um erro.'
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 56,
            height: 56,
            background: 'hsl(var(--destructive) / 0.1)',
          }}
        >
          <AlertTriangle className="h-7 w-7" style={{ color: 'hsl(var(--destructive))' }} />
        </div>
        <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          {title}
        </h2>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {message}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
          <Button onClick={() => navigate('/')}>
            Ir para o painel
          </Button>
        </div>
      </div>
    </div>
  )
}
