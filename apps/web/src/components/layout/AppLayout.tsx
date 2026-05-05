import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Building2,
  CalendarDays,
  ClipboardList,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'gestor', 'professor', 'secretaria'] },
  { to: '/students', label: 'Alunos', icon: Users, roles: ['gestor'] },
  { to: '/teachers', label: 'Professores', icon: GraduationCap, roles: ['gestor'] },
  { to: '/classes', label: 'Turmas', icon: BookOpen, roles: ['gestor', 'professor'] },
  { to: '/grades', label: 'Notas', icon: ClipboardList, roles: ['gestor', 'professor'] },
  { to: '/attendance', label: 'Frequência', icon: CalendarDays, roles: ['gestor', 'professor'] },
  { to: '/financial', label: 'Financeiro', icon: DollarSign, roles: ['gestor'] },
  { to: '/secretarias', label: 'Secretarias', icon: Building2, roles: ['admin'] },
]

export function AppLayout() {
  const { payload, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const role = payload?.role

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const visibleItems = navItems.filter((item) => role && item.roles.includes(role))

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-60 border-r flex flex-col">
        <div className="h-14 flex items-center px-4 border-b">
          <span className="font-semibold text-sm">Education Gestor</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b flex items-center px-6">
          <span className="text-sm text-muted-foreground capitalize">{role}</span>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
