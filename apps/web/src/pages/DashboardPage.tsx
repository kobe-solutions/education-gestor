import { useAuth } from '../contexts/AuthContext'

export function DashboardPage() {
  const { payload } = useAuth()

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Bem-vindo ao Education Gestor. Use o menu lateral para navegar.
      </p>
      <p className="text-xs text-muted-foreground">
        Perfil: <span className="font-medium capitalize">{payload?.role}</span>
      </p>
    </div>
  )
}
