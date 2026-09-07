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
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useFinancialVisibility } from '../../contexts/FinancialVisibilityContext'
import { useFinancialBlocked } from '../../lib/useFinancialBlocked'
import { SchoolSelector } from '../SchoolSelector'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { ACCENT_COLOR } from '../../lib/colors'
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

function NavLink({ to, icon: Icon, label, active }: { to: string; icon: React.ElementType; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap',
        active
          ? 'text-white'
          : 'text-gray-400 hover:text-white hover:bg-white/5',
      )}
      style={active ? { background: ACCENT_COLOR + '18' } : undefined}
    >
      {active && (
        <div
          className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
          style={{ background: ACCENT_COLOR }}
        />
      )}
      <Icon
        size={16}
        className="shrink-0"
        style={active ? { color: ACCENT_COLOR } : undefined}
      />
      <span>{label}</span>
    </Link>
  )
}

export function AppLayout() {
  const { payload, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  useKeyboardShortcuts(() => setShortcutsOpen(true))

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

  return (
    <div className="flex flex-col h-screen" style={{ background: 'hsl(var(--background))' }}>
      {/* Top Header */}
      <header
        className="shrink-0 border-b"
        style={{
          background: '#0a0f1a',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        {/* Main header row */}
        <div className="flex items-center h-14 px-4 md:px-6 gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            {schoolLogoUrl ? (
              <img src={schoolLogoUrl} alt="" className="h-7 w-7 rounded object-contain shrink-0" />
            ) : (
              <svg width="26" height="26" viewBox="0 0 120 120" aria-label="IRIS" className="shrink-0">
                <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke={ACCENT_COLOR} strokeWidth="3.4" />
                <circle cx="60" cy="60" r="18" fill={ACCENT_COLOR + 'CC'} />
                <circle cx="60" cy="60" r="12" fill={ACCENT_COLOR} />
                <circle cx="60" cy="60" r="7" fill="#1e1b4b" />
              </svg>
            )}
            <span className="font-bold text-sm text-white hidden sm:inline truncate max-w-[160px]">
              {schoolProfile?.name ?? 'Painel Geral'}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 overflow-x-auto ml-4 scrollbar-none">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                active={activeItem?.to === item.to}
              />
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
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
                    className="h-8 w-8 text-gray-400 hover:text-white"
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
                    className="h-8 w-8 text-gray-400 hover:text-white"
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

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              aria-label="Abrir menu"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-72 flex flex-col md:hidden transition-transform duration-200 ease-out',
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{ background: '#0a0f1a' }}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <Avatar name={userName} photoUrl={userPhotoUrl} size={28} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              {userEmail && <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={18} />
          </Button>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 py-2 px-2 overflow-y-auto">
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      <ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  )
}
