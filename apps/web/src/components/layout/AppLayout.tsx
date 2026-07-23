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
    roles: ['admin', 'gestor', 'professor', 'secretaria'],
    matchPaths: ['/'],
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
    roles: ['gestor', 'professor', 'secretaria'],
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
      // Prioriza o match mais específico (caminho mais longo)
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

function SidebarLink({ to, icon: Icon, label, active }: { to: string; icon: React.ElementType; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 w-full rounded-md px-3 py-2.5 transition-colors duration-120',
        active
          ? 'bg-[#4F46E5] text-white'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="text-sm font-medium truncate">{label}</span>
    </Link>
  )
}

const SIDEBAR_W = 220

export function AppLayout() {
  const { payload, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
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
  const activeItem = getActiveItem(visibleItems, location.pathname)
  const userName = payload?.name ?? ''

  // ── Desktop sidebar ───────────────────────────────────────────────────────

  function renderDesktopSidebar() {
    return (
      <aside
        className="hidden md:flex flex-col shrink-0"
        style={{
          width: SIDEBAR_W,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--iris-slate-200)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-4 shrink-0"
          style={{ height: 'var(--header-h)', borderBottom: '1px solid var(--iris-slate-200)' }}
        >
          <svg width="28" height="28" viewBox="0 0 120 120" aria-label="IRIS" className="shrink-0">
            <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke="#312E81" strokeWidth="3.4" />
            <circle cx="60" cy="60" r="18" fill="#818CF8" />
            <circle cx="60" cy="60" r="12" fill="#4F46E5" />
            <circle cx="60" cy="60" r="7"  fill="#312E81" />
          </svg>
          <span className="font-bold text-sm truncate" style={{ color: 'var(--iris-blue-900)', letterSpacing: '0.06em' }}>
            IRIS
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-1 py-3 px-3">
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

        {/* Sair */}
        <div className="pb-3 px-3">
          <button
            onClick={handleLogout}
            title="Sair"
            className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-120"
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
    return visibleItems.map((item) => (
      <SidebarLink
        key={item.to}
        to={item.to}
        icon={item.icon}
        label={item.label}
        active={activeItem?.to === item.to}
      />
    ))
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
          background: 'var(--bg-surface)',
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
              <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke="#312E81" strokeWidth="3.4" />
              <circle cx="60" cy="60" r="18" fill="#818CF8" />
              <circle cx="60" cy="60" r="12" fill="#4F46E5" />
              <circle cx="60" cy="60" r="7"  fill="#312E81" />
            </svg>
            <span className="font-bold text-sm" style={{ color: 'var(--iris-blue-900)', letterSpacing: '0.08em' }}>IRIS</span>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground transition-colors"
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
            className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-120"
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
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--iris-slate-200)',
          }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors md:hidden"
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

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

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
                background: '#4F46E5',
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
