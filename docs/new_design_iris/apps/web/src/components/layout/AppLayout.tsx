import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import {
  Users,
  BookOpen,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Building2,
  School,
  Settings2,
  Network,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { SchoolSelector } from '../SchoolSelector'
import { cn } from '../../lib/utils'
import { Tooltip, TooltipProvider } from '../ui/tooltip'
import type { TenantPayload } from '@education-gestor/types'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  roles: string[]
  matchPaths?: string[]
}

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'gestor', 'professor', 'secretaria'],
    matchPaths: ['/'],
  },
  {
    to: '/pessoas',
    label: 'Pessoas',
    icon: Users,
    roles: ['gestor', 'secretaria'],
    matchPaths: ['/pessoas', '/students', '/teachers'],
  },
  {
    to: '/academico',
    label: 'Acadêmico',
    icon: BookOpen,
    roles: ['gestor', 'professor', 'secretaria'],
    matchPaths: ['/academico', '/classes'],
  },
  {
    to: '/financial',
    label: 'Financeiro',
    icon: DollarSign,
    roles: ['gestor', 'secretaria'],
    matchPaths: ['/financial'],
  },
  {
    to: '/estrutura',
    label: 'Estrutura',
    icon: Network,
    roles: ['gestor'],
    matchPaths: ['/estrutura', '/education-levels', '/series'],
  },
  {
    to: '/configuracoes',
    label: 'Configurações',
    icon: Settings2,
    roles: ['gestor'],
    matchPaths: ['/configuracoes', '/subjects', '/academic-periods'],
  },
  {
    to: '/admin',
    label: 'Administração',
    icon: Building2,
    roles: ['admin'],
    matchPaths: ['/admin', '/secretarias'],
  },
  {
    to: '/escolas',
    label: 'Escolas',
    icon: School,
    roles: ['secretaria'],
    matchPaths: ['/escolas', '/schools', '/my-schools'],
  },
]

function isActive(item: NavItem, pathname: string) {
  if (item.matchPaths) {
    return item.matchPaths.some((p) =>
      p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p + '/'),
    )
  }
  return item.to === '/'
    ? pathname === '/'
    : pathname === item.to || pathname.startsWith(item.to + '/')
}

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
      <aside className="w-[72px] border-r flex flex-col items-center py-0 shrink-0">
        <div className="h-14 w-full flex items-center justify-center border-b">
          <span className="text-xs font-bold text-primary tracking-wider">EG</span>
        </div>

        <TooltipProvider>
          <nav className="flex-1 flex flex-col items-center gap-1 py-3 w-full px-2">
            {visibleItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item, location.pathname)
              return (
                <Tooltip key={item.to} content={item.label}>
                  <Link
                    to={item.to}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 w-full rounded-lg py-2 transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    <span className="text-[10px] font-medium leading-none text-center w-full truncate px-1">
                      {item.label}
                    </span>
                  </Link>
                </Tooltip>
              )
            })}
          </nav>
        </TooltipProvider>

        <div className="pb-3 px-2 w-full">
          <TooltipProvider>
            <Tooltip content="Sair">
              <button
                onClick={handleLogout}
                className="flex flex-col items-center justify-center gap-1 w-full rounded-lg py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <LogOut className="h-[18px] w-[18px]" />
                <span className="text-[10px] font-medium leading-none">Sair</span>
              </button>
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b flex items-center px-6 gap-4">
          <span className="text-sm text-muted-foreground capitalize">{role}</span>
          {role === 'gestor' && (
            <span className="text-sm font-medium">
              {(payload as TenantPayload).schoolName}
            </span>
          )}
          {role === 'secretaria' && <SchoolSelector />}
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
