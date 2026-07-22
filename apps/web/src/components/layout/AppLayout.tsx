import { useState, useEffect } from 'react'
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
  Menu,
  X,
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

const SIDEBAR_W = 220

export function AppLayout() {
  const { payload, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const role = payload?.role

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileDrawerOpen(false)
  }, [location.pathname])

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileDrawerOpen])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const visibleItems = navItems.filter((item) => role && item.roles.includes(role))
  const userName = payload?.name ?? ''

  // ── Desktop sidebar ───────────────────────────────────────────────────────

  function renderDesktopSidebar() {
    return (
      <aside
        className="hidden md:flex flex-col shrink-0"
        style={{
          width: SIDEBAR_W,
          background: '#FFFFFF',
          borderRight: '1px solid var(--iris-slate-200)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-4 shrink-0"
          style={{ height: 'var(--header-h)', borderBottom: '1px solid var(--iris-slate-200)' }}
        >
          <svg width="28" height="28" viewBox="0 0 120 120" aria-label="IRIS" className="shrink-0">
            <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke="#042C53" strokeWidth="3.4" />
            <circle cx="60" cy="60" r="18" fill="#378ADD" />
            <circle cx="60" cy="60" r="12" fill="#185FA5" />
            <circle cx="60" cy="60" r="7"  fill="#042C53" />
          </svg>
          <span className="font-bold text-sm truncate" style={{ color: '#042C53', letterSpacing: '0.06em' }}>
            IRIS
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-1 py-3 px-3">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item, location.pathname)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-colors duration-120',
                  active
                    ? 'text-white'
                    : 'text-[#6B7280] hover:text-[#042C53]',
                )}
                style={active ? { background: '#185FA5' } : undefined}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = '#EAF4FD'
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = ''
                }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sair */}
        <div className="pb-3 px-3">
          <button
            onClick={handleLogout}
            title="Sair"
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-[#6B7280] hover:text-[#042C53] transition-colors duration-120"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#EAF4FD' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>
    )
  }

  // ── Mobile drawer nav items ───────────────────────────────────────────────

  function renderMobileNavItems() {
    return visibleItems.map((item) => {
      const Icon = item.icon
      const active = isActive(item, location.pathname)
      return (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-colors duration-120',
            active
              ? 'text-white'
              : 'text-[#6B7280] hover:text-[#042C53]',
          )}
          style={active ? { background: '#185FA5' } : undefined}
          onMouseEnter={(e) => {
            if (!active) (e.currentTarget as HTMLElement).style.background = '#EAF4FD'
          }}
          onMouseLeave={(e) => {
            if (!active) (e.currentTarget as HTMLElement).style.background = ''
          }}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium truncate">{item.label}</span>
        </Link>
      )
    })
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-app)' }}>
      {/* Desktop sidebar */}
      {renderDesktopSidebar()}

      {/* Mobile drawer overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-64 md:hidden transition-transform duration-200 ease-out',
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          background: '#FFFFFF',
          borderRight: '1px solid var(--iris-slate-200)',
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-4 shrink-0"
          style={{ height: 'var(--header-h)', borderBottom: '1px solid var(--iris-slate-200)' }}
        >
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 120 120" aria-label="IRIS">
              <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke="#042C53" strokeWidth="3.4" />
              <circle cx="60" cy="60" r="18" fill="#378ADD" />
              <circle cx="60" cy="60" r="12" fill="#185FA5" />
              <circle cx="60" cy="60" r="7"  fill="#042C53" />
            </svg>
            <span className="font-bold text-sm" style={{ color: '#042C53', letterSpacing: '0.08em' }}>IRIS</span>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#6B7280] hover:text-[#042C53] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-1 py-3 px-3 overflow-y-auto">
          {renderMobileNavItems()}
        </nav>

        {/* Sair */}
        <div className="pb-4 px-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-[#6B7280] hover:text-[#042C53] transition-colors duration-120"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header
          className="flex items-center px-4 md:px-6 gap-3 shrink-0"
          style={{
            height: 'var(--header-h)',
            background: '#FFFFFF',
            borderBottom: '1px solid var(--iris-slate-200)',
          }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-[#6B7280] hover:text-[#042C53] hover:bg-[#EAF4FD] transition-colors md:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>

          <span
            className="text-xs font-medium uppercase tracking-wide hidden sm:inline"
            style={{ color: 'var(--iris-blue-500)', letterSpacing: '0.12em' }}
          >
            {role}
          </span>
          {role === 'secretaria' && <SchoolSelector />}

          <div className="flex-1" />

          {/* Usuário + avatar */}
          <div className="flex items-center gap-2">
            {userName && (
              <span className="text-sm font-medium hidden sm:inline" style={{ color: 'var(--iris-slate-700)' }}>
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

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
