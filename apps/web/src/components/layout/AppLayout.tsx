import { useState, useEffect, useCallback } from 'react'
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
  Eye,
  EyeOff,
  UserCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useFinancialVisibility } from '../../contexts/FinancialVisibilityContext'
import { useFinancialBlocked } from '../../lib/useFinancialBlocked'
import { SchoolSelector } from '../SchoolSelector'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { SIDEBAR_BG, ACCENT_COLOR } from '../../lib/colors'
import { Avatar } from '../Avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip'
import { useTeacher } from '../../features/teachers/hooks/useTeachers'
import { useSchool } from '../../features/schools/hooks/useSchools'
import { NotificationsMenu } from '../../features/notifications/components/NotificationsMenu'

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
    to: '/professor/grades',
    label: 'Notas',
    icon: BookOpen,
    roles: ['professor'],
    matchPaths: ['/professor/grades'],
  },
  {
    to: '/professor/attendance',
    label: 'Frequência',
    icon: ClipboardCheck,
    roles: ['professor'],
    matchPaths: ['/professor/attendance'],
  },
  {
    to: '/professor/profile',
    label: 'Meu Perfil',
    icon: UserCircle,
    roles: ['professor'],
    matchPaths: ['/professor/profile'],
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
    to: '/school-events',
    label: 'Eventos escolares',
    icon: CalendarDays,
    roles: ['gestor', 'professor', 'secretaria'],
    matchPaths: ['/school-events'],
  },
  {
    to: '/settings',
    label: 'Configurações',
    icon: Settings2,
    roles: ['gestor'],
    matchPaths: ['/settings', '/subjects', '/academic-periods'],
  },
  {
    to: '/secretarias',
    label: 'Secretarias',
    icon: Building2,
    roles: ['admin'],
    matchPaths: ['/secretarias'],
  },
  {
    to: '/schools',
    label: 'Escolas',
    icon: School,
    roles: ['admin', 'secretaria'],
    matchPaths: ['/schools', '/my-schools'],
  },
  {
    to: '/admin/activity',
    label: 'Atividade',
    icon: Activity,
    roles: ['admin'],
    matchPaths: ['/admin/activity'],
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

const SIDEBAR_COLLAPSED_KEY = 'iris-sidebar-collapsed'

function SidebarLink({ to, icon: Icon, label, active, collapsed }: { to: string; icon: React.ElementType; label: string; active: boolean; collapsed: boolean }) {
  const link = (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-all duration-150 relative',
        collapsed ? 'justify-center px-0' : '',
        active
          ? 'text-white'
          : 'text-gray-400 hover:text-white hover:bg-white/5',
      )}
      style={active ? { background: ACCENT_COLOR + '15' } : undefined}
    >
      {active && !collapsed && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-6 rounded-r-full"
          style={{ background: ACCENT_COLOR }}
        />
      )}
      <Icon
        className="h-5 w-5 shrink-0"
        style={active ? { color: ACCENT_COLOR } : undefined}
      />
      {!collapsed && (
        <span className={cn('text-sm font-medium truncate', active && 'font-semibold')}>
          {label}
        </span>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={link} />
        <TooltipContent side="right" sideOffset={12}>{label}</TooltipContent>
      </Tooltip>
    )
  }

  return link
}

export function AppLayout() {
  const { payload, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true')

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      return next
    })
  }, [])

  const role = payload?.role
  const { data: teacherProfile } = useTeacher(role === 'professor' ? payload!.userId : '')
  const userPhotoUrl = role === 'professor' ? teacherProfile?.photoUrl : undefined

  const schoolId = payload && 'schoolId' in payload ? (payload as { schoolId: string }).schoolId : undefined
  const { data: schoolProfile } = useSchool(schoolId ?? '')
  const schoolLogoUrl = role === 'gestor' ? schoolProfile?.logoUrl : undefined

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

  useEffect(() => {
    if (!mobileDrawerOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileDrawerOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileDrawerOpen])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const { hideFinancialData, toggleFinancialVisibility } = useFinancialVisibility()
  const { blocked: financialBlocked } = useFinancialBlocked()

  const visibleItems = navItems.filter((item) => {
    if (!role || !item.roles.includes(role)) return false
    if (item.to === '/financial' && financialBlocked) return false
    return true
  })
  const activeItem = getActiveItem(visibleItems, location.pathname)
  const userName = payload?.name ?? ''
  const userEmail = payload && 'email' in payload ? (payload as { email?: string }).email : ''

  function renderSidebarContent() {
    return (
      <>
        {/* Logo / School branding */}
        <div className={cn('flex items-center shrink-0', sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-4')} style={{ height: 'var(--header-h)' }}>
          {schoolLogoUrl ? (
            <img src={schoolLogoUrl} alt="" className="h-8 w-8 rounded object-contain shrink-0" />
          ) : (
            <svg width="28" height="28" viewBox="0 0 120 120" aria-label="IRIS" className="shrink-0">
              <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke={ACCENT_COLOR} strokeWidth="3.4" />
              <circle cx="60" cy="60" r="18" fill={ACCENT_COLOR + 'CC'} />
              <circle cx="60" cy="60" r="12" fill={ACCENT_COLOR} />
              <circle cx="60" cy="60" r="7" fill="#1e1b4b" />
            </svg>
          )}
          {!sidebarCollapsed && (
            <span className="font-bold text-sm truncate text-white">
              {schoolProfile?.name ?? 'Painel Geral'}
            </span>
          )}
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
              collapsed={sidebarCollapsed}
            />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-3 flex flex-col gap-2">
          {/* Collapse toggle */}
          <Button
            variant="outline"
            size={sidebarCollapsed ? 'icon' : 'default'}
            className={cn(
              'bg-transparent text-gray-400 hover:text-white hover:bg-white/5',
              sidebarCollapsed ? 'self-center h-9 w-9' : 'w-full justify-center gap-3',
            )}
            style={{ borderColor: 'hsl(var(--primary) / 0.3)' }}
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
            aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!sidebarCollapsed && <span className="text-sm font-medium">Recolher</span>}
          </Button>

          {/* Financial visibility toggle — admin only */}
          {role === 'admin' && (
          <Tooltip>
            <TooltipTrigger
              render={
              <Button
                variant="outline"
                size={sidebarCollapsed ? 'icon' : 'default'}
                className={cn(
                  'bg-transparent hover:bg-primary/10',
                  sidebarCollapsed ? 'self-center h-9 w-9' : 'w-full justify-center gap-3',
                )}
                style={{ borderColor: hideFinancialData ? '#EF4444' : '#22C55E' }}
                onClick={toggleFinancialVisibility}
              >
                {hideFinancialData ? <EyeOff size={18} className="text-red-500" /> : <Eye size={18} className="text-green-500" />}
                {!sidebarCollapsed && <span className="text-sm font-medium">{hideFinancialData ? 'Mostrar valores' : 'Ocultar valores'}</span>}
              </Button>
              }
            />
            {sidebarCollapsed && <TooltipContent side="right" sideOffset={12}>{hideFinancialData ? 'Mostrar valores' : 'Ocultar valores'}</TooltipContent>}
          </Tooltip>
          )}

          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger
              render={
              <Button
                variant="outline"
                size={sidebarCollapsed ? 'icon' : 'default'}
                className={cn(
                  'bg-transparent text-primary hover:bg-primary/10',
                  sidebarCollapsed ? 'self-center h-9 w-9' : 'w-full justify-center gap-3',
                )}
                style={{ borderColor: 'hsl(var(--primary))' }}
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                {!sidebarCollapsed && <span className="text-sm font-medium">Alternar tema</span>}
              </Button>
              }
            />
            {sidebarCollapsed && <TooltipContent side="right" sideOffset={12}>Alternar tema</TooltipContent>}
          </Tooltip>

          {/* Logout */}
          <Tooltip>
            <TooltipTrigger
              render={
              <Button
                variant="outline"
                size={sidebarCollapsed ? 'icon' : 'default'}
                className={cn(
                  'bg-transparent text-primary hover:bg-primary/10',
                  sidebarCollapsed ? 'self-center h-9 w-9' : 'w-full justify-center gap-3',
                )}
                style={{ borderColor: 'hsl(var(--primary))' }}
                onClick={handleLogout}
              >
                <LogOut size={18} />
                {!sidebarCollapsed && <span className="text-sm font-medium">Sair</span>}
              </Button>
              }
            />
            {sidebarCollapsed && <TooltipContent side="right" sideOffset={12}>Sair</TooltipContent>}
          </Tooltip>

          {/* User card */}
          {!sidebarCollapsed && (
          <div
            className="flex items-center gap-3 rounded-xl px-3 py-3 mt-1"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {userPhotoUrl ? (
              <img src={userPhotoUrl} alt={userName} className="shrink-0 rounded-full object-cover p-2" style={{ width: 36, height: 36 }} />
            ) : (
              <div
                className="flex items-center justify-center text-white text-xs font-bold shrink-0 rounded-full"
                style={{ width: 36, height: 36, background: ACCENT_COLOR }}
              >
                {userName ? getInitials(userName) : role?.[0]?.toUpperCase() ?? 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              {userEmail && (
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              )}
            </div>
          </div>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="flex h-screen" style={{ background: 'hsl(var(--background))' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col shrink-0 transition-all duration-200"
        style={{
          width: sidebarCollapsed ? 'var(--sidebar-w)' : 'var(--sidebar-expanded-w)',
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
            {schoolLogoUrl ? (
              <img src={schoolLogoUrl} alt="" className="h-8 w-8 rounded object-contain shrink-0" />
            ) : (
              <svg width="28" height="28" viewBox="0 0 120 120" aria-label="IRIS">
                <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke={ACCENT_COLOR} strokeWidth="3.4" />
                <circle cx="60" cy="60" r="18" fill={ACCENT_COLOR + 'CC'} />
                <circle cx="60" cy="60" r="12" fill={ACCENT_COLOR} />
                <circle cx="60" cy="60" r="7" fill="#1e1b4b" />
              </svg>
            )}
            <span className="font-bold text-sm text-white">{schoolProfile?.name ?? 'Painel Geral'}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <X size={18} />
          </Button>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 py-2 px-2 overflow-y-auto">
          {visibleItems.map((item) => (
            <SidebarLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={activeItem?.to === item.to}
              collapsed={false}
            />
          ))}
        </nav>

        <div className="px-3 pb-3 flex flex-col gap-2">
          {/* Financial visibility toggle — admin only */}
          {role === 'admin' && (
          <Button
            variant="outline"
            size="default"
            className="w-full justify-start gap-3 bg-transparent hover:bg-primary/10"
            style={{ borderColor: hideFinancialData ? '#EF4444' : '#22C55E' }}
            onClick={toggleFinancialVisibility}
          >
            {hideFinancialData ? <EyeOff size={18} className="text-red-500" /> : <Eye size={18} className="text-green-500" />}
            <span className="text-sm font-medium">
              {hideFinancialData ? 'Mostrar valores' : 'Ocultar valores'}
            </span>
          </Button>
          )}

          <Button
            variant="outline"
            size="default"
            className="w-full justify-start gap-3 bg-transparent text-primary hover:bg-primary/10"
            style={{ borderColor: 'hsl(var(--primary))' }}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span className="text-sm font-medium">Alternar tema</span>
          </Button>

          {/* Logout */}
          <Button
            variant="outline"
            size="default"
            className="w-full justify-start gap-3 bg-transparent text-primary hover:bg-primary/10"
            style={{ borderColor: 'hsl(var(--primary))' }}
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sair</span>
          </Button>

          {/* User card */}
          <div
            className="flex items-center gap-3 rounded-xl px-3 py-3 mt-1"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {userPhotoUrl ? (
              <img src={userPhotoUrl} alt={userName} className="shrink-0 rounded-full object-cover" style={{ width: 36, height: 36 }} />
            ) : (
              <div
                className="flex items-center justify-center text-white text-xs font-bold shrink-0 rounded-full"
                style={{ width: 36, height: 36, background: ACCENT_COLOR }}
              >
                {userName ? getInitials(userName) : role?.[0]?.toUpperCase() ?? 'U'}
              </div>
            )}
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
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            aria-label="Abrir menu"
            onClick={() => setMobileDrawerOpen(true)}
          >
            <Menu size={20} />
          </Button>

          <span
            className="text-lg font-bold md:hidden"
            style={{ color: ACCENT_COLOR }}
          >
            IRIS
          </span>

          <span
            className="text-xs font-medium uppercase tracking-wide hidden sm:inline"
            style={{ color: ACCENT_COLOR, letterSpacing: '0.12em' }}
          >
            {role}
          </span>
          {role === 'secretaria' && <SchoolSelector />}

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {/* Notificações — gestor/secretaria */}
            <NotificationsMenu />

            {/* Financial visibility toggle (navbar) — admin only */}
            {role === 'admin' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label={hideFinancialData ? 'Mostrar valores financeiros' : 'Ocultar valores financeiros'}
              onClick={toggleFinancialVisibility}
              title={hideFinancialData ? 'Mostrar valores financeiros' : 'Ocultar valores financeiros'}
            >
              {hideFinancialData ? <EyeOff size={18} className="text-red-500" /> : <Eye size={18} className="text-green-500" />}
            </Button>
            )}

            {userName && (
              <span className="text-sm font-medium hidden sm:inline" style={{ color: 'hsl(var(--foreground))' }}>
                {userName}
              </span>
            )}

            <Avatar
              name={userName}
              photoUrl={userPhotoUrl}
              size={40}
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
