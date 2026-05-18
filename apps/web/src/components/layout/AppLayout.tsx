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
  CalendarDays,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { SchoolSelector } from '../SchoolSelector'
import { cn } from '../../lib/utils'

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
    label: 'Painel',
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
    matchPaths: ['/academico', '/classes', '/estrutura', '/education-levels', '/series', '/locacao'],
  },
  {
    to: '/financial',
    label: 'Financeiro',
    icon: DollarSign,
    roles: ['gestor', 'secretaria'],
    matchPaths: ['/financial'],
  },
  {
    to: '/academic-years',
    label: 'Anos Letivos',
    icon: CalendarDays,
    roles: ['gestor', 'secretaria'],
    matchPaths: ['/academic-years'],
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

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
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

  const userName = payload?.name ?? ''

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-app)' }}>
      {/* Sidebar icon-rail */}
      <aside
        className="flex flex-col items-center py-0 shrink-0"
        style={{
          width: 'var(--sidebar-w)',
          background: '#FFFFFF',
          borderRight: '1px solid var(--iris-slate-200)',
        }}
      >
        {/* Logo IRIS */}
        <div
          className="flex items-center justify-center shrink-0"
          style={{ height: 'var(--header-h)', width: '100%', borderBottom: '1px solid var(--iris-slate-200)' }}
        >
          <svg width="32" height="32" viewBox="0 0 120 120" aria-label="IRIS">
            <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke="#042C53" strokeWidth="3.4" />
            <circle cx="60" cy="60" r="18" fill="#378ADD" />
            <circle cx="60" cy="60" r="12" fill="#185FA5" />
            <circle cx="60" cy="60" r="7"  fill="#042C53" />
          </svg>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-3 w-full px-2">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item, location.pathname)
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 w-full rounded-lg py-2 transition-colors duration-[120ms]',
                  active
                    ? 'text-white'
                    : 'text-[#6B7280] hover:text-[#042C53]',
                )}
                style={
                  active
                    ? { background: '#185FA5' }
                    : undefined
                }
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = '#EAF4FD'
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = ''
                }}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="text-[10px] font-medium leading-none text-center w-full truncate px-1">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Sair */}
        <div className="pb-3 px-2 w-full">
          <button
            onClick={handleLogout}
            title="Sair"
            className="flex flex-col items-center justify-center gap-1 w-full rounded-lg py-2 text-[#6B7280] hover:text-[#042C53] transition-colors duration-[120ms]"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#EAF4FD' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span className="text-[10px] font-medium leading-none">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center px-6 gap-3 shrink-0"
          style={{
            height: 'var(--header-h)',
            background: '#FFFFFF',
            borderBottom: '1px solid var(--iris-slate-200)',
          }}
        >
          <span
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--iris-blue-500)', letterSpacing: '0.12em' }}
          >
            {role}
          </span>
          {role === 'secretaria' && <SchoolSelector />}

          <div className="flex-1" />

          {/* Usuário + avatar */}
          <div className="flex items-center gap-2">
            {userName && (
              <span className="text-sm font-medium" style={{ color: 'var(--iris-slate-700)' }}>
                {userName}
              </span>
            )}
            <div
              className="flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{
                width: 32,
                height: 32,
                borderRadius: 9999,
                background: '#185FA5',
              }}
            >
              {userName ? getInitials(userName) : role?.[0]?.toUpperCase() ?? 'U'}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
