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
  Sun,
  Moon,
  Activity,
  Presentation,
  BarChart3,
  ClipboardCheck,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
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
    roles: ['admin', 'gestor', 'secretaria'],
    matchPaths: ['/'],
  },
  {
    to: '/professor',
    label: 'Meu Painel',
    icon: Presentation,
    roles: ['professor'],
    matchPaths: ['/professor'],
  },
  {
    to: '/professor/classes',
    label: 'Minhas Turmas',
    icon: Users,
    roles: ['professor'],
    matchPaths: ['/professor/classes'],
  },
  {
    to: '/professor/performance',
    label: 'Desempenho',
    icon: BarChart3,
    roles: ['professor'],
    matchPaths: ['/professor/performance'],
  },
  {
    to: '/professor/attendance',
    label: 'Frequência',
    icon: ClipboardCheck,
    roles: ['professor'],
    matchPaths: ['/professor/attendance'],
  },
  {
    to: '/people',
    label: 'Pessoas',
    icon: Users,
    roles: ['gestor', 'secretaria'],
    matchPaths: ['/people', '/students', '/teachers'],
  },
  {
    to: '/academic',
    label: 'Acadêmico',
    icon: BookOpen,
    roles: ['gestor', 'secretaria'],
    matchPaths: ['/academic', '/classes', '/structure', '/education-levels', '/series', '/scheduling'],
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
    to: '/settings',
    label: 'Configurações',
    icon: Settings2,
    roles: ['gestor'],
    matchPaths: ['/settings', '/subjects', '/academic-periods'],
  },
  {
    to: '/admin',
    label: 'Administração',
    icon: Building2,
    roles: ['admin'],
    matchPaths: ['/admin', '/secretarias'],
  },
  {
    to: '/admin/activity',
    label: 'Atividade',
    icon: Activity,
    roles: ['admin'],
    matchPaths: ['/admin/activity'],
  },
  {
    to: '/schools-hub',
    label: 'Escolas',
    icon: School,
    roles: ['secretaria'],
    matchPaths: ['/schools-hub', '/schools', '/my-schools'],
  },
]

function isActive(item: NavItem, pathname: string) {
  if (item.matchPaths) {
    return item.matchPaths.some((p) => {
      if (p === '/') return pathname === '/'
      if (pathname === p) return true
      if (pathname.startsWith(p) && pathname[p.length] === '/') return true
      return false
    })
  }
  return item.to === '/'
    ? pathname === '/'
    : pathname === item.to || (pathname.startsWith(item.to) && pathname[item.to.length] === '/')
}

function getActiveItem(items: NavItem[], pathname: string): NavItem | null {
  let best: NavItem | null = null
  let bestLen = -1
  for (const item of items) {
    if (isActive(item, pathname)) {
      const longest = item.matchPaths
        ? Math.max(...item.matchPaths.filter((p) => {
            if (p === '/') return pathname === '/'
            if (pathname === p) return true
            return pathname.startsWith(p) && pathname[p.length] === '/'
          }).map((p) => p.length))
        : item.to.length
      if (longest > bestLen) {
        bestLen = longest
        best = item
      }
    }
  }
  return best
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

const SIDEBAR_W = 240
const SIDEBAR_BG = '#0a0f1a'
const SIDEBAR_ITEM_HOVER = '#111827'
const ACCENT_COLOR = '#818CF8'

function SidebarLink({ to, icon: Icon, label, active }: { to: string; icon: React.ElementType; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-all duration-150 relative',
        active
          ? 'text-white'
          : 'text-gray-400 hover:text-white hover:bg-white/5',
      )}
      style={active ? { background: ACCENT_COLOR + '15' } : undefined}
    >
      {active && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
          style={{ background: ACCENT_COLOR }}
        />
      )}
      <Icon
        className="h-5 w-5 shrink-0"
        style={active ? { color: ACCENT_COLOR } : undefined}
      />
      <span className={cn('text-sm font-medium truncate', active && 'font-semibold')}>
        {label}
      </span>
    </Link>
  )
}

export function AppLayout() {
  const { payload, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const role = payload?.role

  useEffect(() => {
    setMobileDrawerOpen(false)
  }, [location.pathname])

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
  const activeItem = getActiveItem(visibleItems, location.pathname)
  const userName = payload?.name ?? ''
  const userEmail = payload && 'email' in payload ? (payload as { email?: string }).email : ''

  function renderSidebarContent(isMobile = false) {
    return (
      <>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 shrink-0" style={{ height: 'var(--header-h)' }}>
          <svg width="28" height="28" viewBox="0 0 120 120" aria-label="IRIS" className="shrink-0">
            <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke={ACCENT_COLOR} strokeWidth="3.4" />
            <circle cx="60" cy="60" r="18" fill={ACCENT_COLOR + 'CC'} />
            <circle cx="60" cy="60" r="12" fill={ACCENT_COLOR} />
            <circle cx="60" cy="60" r="7" fill="#1e1b4b" />
          </svg>
          <span className="font-bold text-sm truncate text-white">Painel Geral</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-0.5 py-2 px-2 overflow-y-auto">
          {visibleItems.map((item) => (
            <SidebarLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={activeItem?.to === item.to}
            />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-3 flex flex-col gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-all duration-150 text-gray-400 hover:text-white hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span className="text-sm font-medium">Alternar tema</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-all duration-150 text-gray-400 hover:text-white hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sair</span>
          </button>

          {/* User card */}
          <div
            className="flex items-center gap-3 rounded-xl px-3 py-3 mt-1"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="flex items-center justify-center text-white text-xs font-bold shrink-0 rounded-full"
              style={{
                width: 36,
                height: 36,
                background: ACCENT_COLOR,
              }}
            >
              {userName ? getInitials(userName) : role?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              {userEmail && (
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="flex h-screen" style={{ background: 'hsl(var(--background))' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col shrink-0"
        style={{
          width: SIDEBAR_W,
          background: SIDEBAR_BG,
        }}
      >
        {renderSidebarContent()}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-64 md:hidden transition-transform duration-200 ease-out',
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ background: SIDEBAR_BG }}
      >
        <div className="flex items-center justify-between px-4 shrink-0" style={{ height: 'var(--header-h)' }}>
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 120 120" aria-label="IRIS">
              <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke={ACCENT_COLOR} strokeWidth="3.4" />
              <circle cx="60" cy="60" r="18" fill={ACCENT_COLOR + 'CC'} />
              <circle cx="60" cy="60" r="12" fill={ACCENT_COLOR} />
              <circle cx="60" cy="60" r="7" fill="#1e1b4b" />
            </svg>
            <span className="font-bold text-sm text-white">Painel Geral</span>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 py-2 px-2 overflow-y-auto">
          {visibleItems.map((item) => (
            <SidebarLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={activeItem?.to === item.to}
            />
          ))}
        </nav>

        <div className="px-3 pb-3 flex flex-col gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-all duration-150 text-gray-400 hover:text-white hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span className="text-sm font-medium">Alternar tema</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-all duration-150 text-gray-400 hover:text-white hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sair</span>
          </button>

          <div
            className="flex items-center gap-3 rounded-xl px-3 py-3 mt-1"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="flex items-center justify-center text-white text-xs font-bold shrink-0 rounded-full"
              style={{ width: 36, height: 36, background: ACCENT_COLOR }}
            >
              {userName ? getInitials(userName) : role?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              {userEmail && (
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header
          className="flex items-center px-4 md:px-6 gap-3 shrink-0"
          style={{
            height: 'var(--header-h)',
            background: 'hsl(var(--card))',
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors md:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>

          <span
            className="text-xs font-medium uppercase tracking-wide hidden sm:inline"
            style={{ color: ACCENT_COLOR, letterSpacing: '0.12em' }}
          >
            {role}
          </span>
          {role === 'secretaria' && <SchoolSelector />}

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {userName && (
              <span className="text-sm font-medium hidden sm:inline" style={{ color: 'hsl(var(--foreground))' }}>
                {userName}
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
