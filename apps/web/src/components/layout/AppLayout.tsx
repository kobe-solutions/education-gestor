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
  CalendarClock,
  Menu,
  X,
  Sun,
  Moon,
  Activity,
  Presentation,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  Eye,
  EyeOff,
  UserCircle,
  GraduationCap,
  PartyPopper,
  CalendarRange,
  ChevronLeft,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useFinancialVisibility } from '../../contexts/FinancialVisibilityContext'
import { useFinancialBlocked } from '../../lib/useFinancialBlocked'
import { SchoolSelector } from '../SchoolSelector'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { ACCENT_COLOR, SIDEBAR_BG, SIDEBAR_ITEM_HOVER } from '../../lib/colors'
import { Avatar } from '../Avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip'
import { useTeacher } from '../../features/teachers/hooks/useTeachers'
import { useSchool } from '../../features/schools/hooks/useSchools'
import { NotificationsMenu } from '../../features/notifications/components/NotificationsMenu'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { ShortcutsHelp } from '../ShortcutsHelp'

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
    icon: GraduationCap,
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
    icon: ClipboardList,
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
    to: '/dashboard/registration-status',
    label: 'Registro de Aulas',
    icon: ClipboardCheck,
    roles: ['gestor', 'secretaria'],
    matchPaths: ['/dashboard/registration-status'],
  },
  {
    to: '/financial',
    label: 'Financeiro',
    icon: DollarSign,
    roles: ['gestor', 'secretaria'],
    matchPaths: ['/financial'],
  },
  {
    to: '/financial-control',
    label: 'Controle Financeiro',
    icon: CalendarClock,
    roles: ['gestor', 'secretaria'],
    matchPaths: ['/financial-control'],
  },
  {
    to: '/academic-years',
    label: 'Anos Letivos',
    icon: CalendarRange,
    roles: ['gestor', 'secretaria'],
    matchPaths: ['/academic-years'],
  },
  {
    to: '/school-events',
    label: 'Eventos',
    icon: PartyPopper,
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

const SIDEBAR_WIDTH = 240

function SidebarNav({
  items,
  activeItem,
  collapsed,
  onToggle,
}: {
  items: NavItem[]
  activeItem: NavItem | null
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex flex-col shrink-0 transition-[width] duration-200 ease-out"
      style={{
        width: collapsed ? 64 : SIDEBAR_WIDTH,
        background: SIDEBAR_BG,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center h-14 px-3 shrink-0 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <Link to="/" className="flex items-center gap-2.5 min-w-0 mx-auto">
          <svg width="26" height="26" viewBox="0 0 120 120" aria-label="IRIS" className="shrink-0">
            <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke={ACCENT_COLOR} strokeWidth="3.4" />
            <circle cx="60" cy="60" r="18" fill={ACCENT_COLOR + 'CC'} />
            <circle cx="60" cy="60" r="12" fill={ACCENT_COLOR} />
            <circle cx="60" cy="60" r="7" fill="#1e1b4b" />
          </svg>
          {!collapsed && (
            <span className="font-bold text-sm text-white truncate">
              Painel
            </span>
          )}
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-0.5 py-3 px-2 overflow-y-auto scrollbar-none">
        {items.map((item) => {
          const Icon = item.icon
          const active = activeItem?.to === item.to
          const link = (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                active
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white',
              )}
              style={{
                background: active ? ACCENT_COLOR + '18' : undefined,
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={18}
                className="shrink-0"
                style={active ? { color: ACCENT_COLOR } : undefined}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger render={link} />
                <TooltipContent side="right" sideOffset={8}>{item.label}</TooltipContent>
              </Tooltip>
            )
          }
          return link
        })}
      </nav>

      {/* Toggle at bottom */}
      <div
        className="shrink-0 px-2 pb-3 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-9 w-full text-gray-500 hover:text-white mt-2',
                  collapsed && 'px-0',
                )}
                onClick={onToggle}
                aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
              >
                <ChevronLeft
                  size={16}
                  className={cn('transition-transform duration-200', collapsed && 'rotate-180')}
                />
              </Button>
            }
          />
          <TooltipContent side="right" sideOffset={8}>
            {collapsed ? 'Expandir' : 'Recolher'}
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}

export function AppLayout() {
  const { payload, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useKeyboardShortcuts(() => setShortcutsOpen(true))

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    setIsDesktop(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const role = payload?.role
  const { data: teacherProfile } = useTeacher(role === 'professor' ? payload!.userId : '')
  const userPhotoUrl = role === 'professor' ? teacherProfile?.photoUrl : undefined

  const schoolId = payload && 'schoolId' in payload ? (payload as { schoolId: string }).schoolId : undefined
  const { data: schoolProfile } = useSchool(schoolId ?? '')
  const schoolLogoUrl = role === 'gestor' ? schoolProfile?.logoUrl : undefined

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!mobileMenuOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login')
  }, [logout, navigate])

  const { hideFinancialData, toggleFinancialVisibility } = useFinancialVisibility()
  const { blocked: financialBlocked } = useFinancialBlocked()

  const visibleItems = navItems.filter((item) => {
    if (!role || !item.roles.includes(role)) return false
    if ((item.to === '/financial' || item.to === '/financial-control') && financialBlocked) return false
    return true
  })
  const activeItem = getActiveItem(visibleItems, location.pathname)
  const userName = payload?.name ?? ''
  const userEmail = payload && 'email' in payload ? (payload as { email?: string }).email : ''

  const contentMargin = !isDesktop || mobileMenuOpen
    ? 0
    : sidebarCollapsed
      ? 64
      : SIDEBAR_WIDTH

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <SidebarNav
          items={visibleItems}
          activeItem={activeItem}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col md:hidden transition-transform duration-200 ease-out',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ width: SIDEBAR_WIDTH, background: SIDEBAR_BG }}
      >
        <div className="flex items-center justify-between px-3 h-14 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            {schoolLogoUrl ? (
              <img src={schoolLogoUrl} alt="" className="h-7 w-7 rounded object-contain shrink-0" />
            ) : (
              <svg width="26" height="26" viewBox="0 0 120 120" className="shrink-0">
                <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke={ACCENT_COLOR} strokeWidth="3.4" />
                <circle cx="60" cy="60" r="18" fill={ACCENT_COLOR + 'CC'} />
                <circle cx="60" cy="60" r="12" fill={ACCENT_COLOR} />
                <circle cx="60" cy="60" r="7" fill="#1e1b4b" />
              </svg>
            )}
            <span className="font-bold text-sm text-white truncate">
              {schoolProfile?.name ?? 'Painel'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white shrink-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={18} />
          </Button>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 py-3 px-2 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = activeItem?.to === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  active
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5',
                )}
                style={active ? { background: ACCENT_COLOR + '18' } : undefined}
              >
                <Icon
                  size={18}
                  style={active ? { color: ACCENT_COLOR } : undefined}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pb-3 flex flex-col gap-2 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5 px-1 pb-1">
            <Avatar name={userName} photoUrl={userPhotoUrl} size={28} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              {userEmail && <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>}
            </div>
          </div>

          {role === 'admin' && (
            <Button
              variant="outline"
              size="default"
              className="w-full justify-start gap-3 bg-transparent hover:bg-primary/10"
              style={{ borderColor: hideFinancialData ? '#EF4444' : '#22C55E' }}
              onClick={toggleFinancialVisibility}
            >
              {hideFinancialData ? <EyeOff size={16} className="text-red-500" /> : <Eye size={16} className="text-green-500" />}
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
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span className="text-sm font-medium">Alternar tema</span>
          </Button>

          <Button
            variant="outline"
            size="default"
            className="w-full justify-start gap-3 bg-transparent text-primary hover:bg-primary/10"
            style={{ borderColor: 'hsl(var(--primary))' }}
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Sair</span>
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div
        className="flex flex-col flex-1 min-w-0 transition-[margin] duration-200"
        style={{ marginLeft: contentMargin }}
      >
        {/* Top bar */}
        <header
          className="shrink-0 h-14 flex items-center gap-3 px-4 md:px-6 border-b"
          style={{
            background: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
          }}
        >
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden shrink-0"
            aria-label="Abrir menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </Button>

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 md:hidden">
            {schoolLogoUrl ? (
              <img src={schoolLogoUrl} alt="" className="h-7 w-7 rounded object-contain shrink-0" />
            ) : (
              <svg width="26" height="26" viewBox="0 0 120 120" className="shrink-0">
                <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke={ACCENT_COLOR} strokeWidth="3.4" />
                <circle cx="60" cy="60" r="18" fill={ACCENT_COLOR + 'CC'} />
                <circle cx="60" cy="60" r="12" fill={ACCENT_COLOR} />
                <circle cx="60" cy="60" r="7" fill="#1e1b4b" />
              </svg>
            )}
            <span className="font-bold text-sm truncate max-w-[140px]">
              {schoolProfile?.name ?? 'Painel'}
            </span>
          </Link>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            {activeItem && (
              <h1 className="text-sm font-semibold truncate hidden sm:block">
                {activeItem.label}
              </h1>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline px-2 py-0.5 rounded"
              style={{ color: ACCENT_COLOR, background: ACCENT_COLOR + '12', letterSpacing: '0.1em' }}
            >
              {role}
            </span>
            {role === 'secretaria' && <SchoolSelector />}

            <NotificationsMenu />

            {role === 'admin' && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={hideFinancialData ? 'Mostrar valores financeiros' : 'Ocultar valores financeiros'}
                      onClick={toggleFinancialVisibility}
                    >
                      {hideFinancialData ? <EyeOff size={16} className="text-red-500" /> : <Eye size={16} className="text-green-500" />}
                    </Button>
                  }
                />
                <TooltipContent>{hideFinancialData ? 'Mostrar valores' : 'Ocultar valores'}</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleTheme}
                  >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  </Button>
                }
              />
              <TooltipContent>Alternar tema</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                  </Button>
                }
              />
              <TooltipContent>Sair</TooltipContent>
            </Tooltip>

            <div className="hidden sm:block ml-1">
              <Avatar name={userName} photoUrl={userPhotoUrl} size={32} />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      <ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  )
}
