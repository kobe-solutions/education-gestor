import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import {
  Activity, BookOpen, Building2, CalendarCheck, ChartNoAxesColumn, ClipboardList,
  DollarSign, Eye, EyeOff, GraduationCap, LayoutDashboard, LogOut, Menu, Moon, School,
  Sun, Users, X,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useFinancialVisibility } from '../../contexts/FinancialVisibilityContext'
import { useFinancialBlocked } from '../../lib/useFinancialBlocked'
import { SchoolSelector } from '../SchoolSelector'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { Avatar } from '../Avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
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
  { to: '/', label: 'Início', icon: LayoutDashboard, roles: ['admin', 'gestor', 'secretaria'], matchPaths: ['/'] },
  { to: '/professor', label: 'Meu dia', icon: CalendarCheck, roles: ['professor'], matchPaths: ['/professor'] },
  { to: '/people', label: 'Pessoas', icon: Users, roles: ['gestor', 'secretaria'], matchPaths: ['/people', '/students', '/teachers'] },
  { to: '/academic', label: 'Rotina escolar', icon: BookOpen, roles: ['gestor', 'secretaria'], matchPaths: ['/academic', '/classes', '/structure', '/education-levels', '/series', '/scheduling', '/academic-years', '/academic-periods', '/class-periods', '/subjects', '/grades', '/attendance', '/lesson-records', '/dashboard/registration-status'] },
  { to: '/school-events', label: 'Calendário', icon: CalendarCheck, roles: ['gestor'], matchPaths: ['/school-events'] },
  { to: '/professor/classes', label: 'Minhas turmas', icon: GraduationCap, roles: ['professor'], matchPaths: ['/professor/classes', '/classes'] },
  { to: '/lesson-records', label: 'Registro de aulas', icon: ClipboardList, roles: ['professor'], matchPaths: ['/lesson-records'] },
  { to: '/professor/grades', label: 'Notas', icon: ChartNoAxesColumn, roles: ['professor'], matchPaths: ['/professor/grades', '/professor/performance'] },
  { to: '/professor/attendance', label: 'Frequência', icon: CalendarCheck, roles: ['professor'], matchPaths: ['/professor/attendance'] },
  { to: '/school-events', label: 'Calendário', icon: CalendarCheck, roles: ['professor'], matchPaths: ['/school-events'] },
  { to: '/professor/profile', label: 'Meu perfil', icon: Users, roles: ['professor'], matchPaths: ['/professor/profile'] },
  { to: '/financial', label: 'Financeiro', icon: DollarSign, roles: ['gestor', 'secretaria'], matchPaths: ['/financial', '/financial-control'] },
  { to: '/schools-hub', label: 'Rede de escolas', icon: School, roles: ['secretaria'], matchPaths: ['/schools-hub', '/schools', '/my-schools'] },
  { to: '/admin', label: 'Organizações', icon: Building2, roles: ['admin'], matchPaths: ['/admin', '/schools', '/secretarias'] },
  { to: '/admin/activity', label: 'Atividade', icon: Activity, roles: ['admin'], matchPaths: ['/admin/activity'] },
]

function isActive(item: NavItem, pathname: string) {
  return (item.matchPaths ?? [item.to]).some((path) =>
    path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`),
  )
}

function getActiveItem(items: NavItem[], pathname: string) {
  return items
    .map((item) => {
      const matchLength = (item.matchPaths ?? [item.to])
        .filter((path) => path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`))
        .reduce((longest, path) => Math.max(longest, path.length), -1)
      return { item, matchLength }
    })
    .filter(({ matchLength }) => matchLength >= 0)
    .sort((a, b) => b.matchLength - a.matchLength)[0]?.item ?? null
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador da plataforma',
  gestor: 'Gestor escolar',
  secretaria: 'Secretaria de Educação · Gestão da rede',
  professor: 'Professor',
}

function BrandMark() {
  return (
    <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-hidden="true">
      <svg width="23" height="23" viewBox="0 0 120 120" fill="none">
        <ellipse cx="60" cy="60" rx="46" ry="24" stroke="currentColor" strokeWidth="4" />
        <circle cx="60" cy="60" r="17" fill="currentColor" />
        <circle cx="60" cy="60" r="8" fill="hsl(var(--primary))" />
      </svg>
    </span>
  )
}

function Sidebar({ items, pathname, onNavigate, userName, userPhotoUrl, schoolName, role, onLogout }: {
  items: NavItem[]
  pathname: string
  onNavigate?: () => void
  userName: string
  userPhotoUrl?: string
  schoolName?: string
  role?: string
  onLogout: () => void
}) {
  const activeItem = getActiveItem(items, pathname)
  return (
    <aside className="flex h-full w-[252px] shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <Link to="/" onClick={onNavigate} className="flex h-[72px] items-center gap-3 border-b px-5">
        <BrandMark />
        <span className="min-w-0">
          <span className="block text-[15px] font-bold tracking-wide">IRIS Educação</span>
          <span className="block truncate text-xs text-muted-foreground">{schoolName || (role === 'secretaria' ? 'Gestão da rede de ensino' : 'Gestão escolar')}</span>
        </span>
      </Link>
      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground">MENU PRINCIPAL</p>
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon
            const active = activeItem?.to === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
                )}
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={userName} photoUrl={userPhotoUrl} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">Minha conta</p>
          </div>
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-9 shrink-0" onClick={onLogout} aria-label="Sair da conta"><LogOut size={17} /></Button>} />
            <TooltipContent>Sair da conta</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </aside>
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
  const schoolId = payload?.role !== 'admin' && payload && 'schoolId' in payload
    ? (payload as { schoolId: string }).schoolId
    : undefined
  const { data: schoolProfile } = useSchool(schoolId ?? '')
  const userPhotoUrl = role === 'professor' ? teacherProfile?.photoUrl : undefined
  const { hideFinancialData, toggleFinancialVisibility } = useFinancialVisibility()
  const { blocked: financialBlocked } = useFinancialBlocked()
  const userName = payload?.name ?? 'Usuário'
  const userEmail = payload && 'email' in payload ? (payload as { email?: string }).email : undefined

  const visibleItems = navItems.filter((item) => {
    if (!role || !item.roles.includes(role)) return false
    if (item.to === '/financial' && financialBlocked) return false
    return true
  })
  const activeItem = getActiveItem(visibleItems, location.pathname)

  useEffect(() => setMobileMenuOpen(false), [location.pathname])
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])
  useEffect(() => {
    if (!mobileMenuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [mobileMenuOpen])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <div className="hidden md:block">
        <Sidebar items={visibleItems} pathname={location.pathname} userName={userName} userPhotoUrl={userPhotoUrl ?? undefined} schoolName={schoolProfile?.name} role={role} onLogout={handleLogout} />
      </div>

      {mobileMenuOpen && <button type="button" className="fixed inset-0 z-40 bg-slate-950/45 md:hidden" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} />}
      <div className={cn('fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:hidden', mobileMenuOpen ? 'translate-x-0' : '-translate-x-full')} role="dialog" aria-modal="true" aria-label="Menu principal" aria-hidden={!mobileMenuOpen} inert={!mobileMenuOpen}>
        <div className="flex h-full">
          <Sidebar items={visibleItems} pathname={location.pathname} onNavigate={() => setMobileMenuOpen(false)} userName={userName} userPhotoUrl={userPhotoUrl ?? undefined} schoolName={schoolProfile?.name} role={role} onLogout={handleLogout} />
          <Button variant="ghost" size="icon" className="absolute right-2 top-4 size-9" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)}><X size={18} /></Button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm md:px-7">
          <Button variant="ghost" size="icon" className="size-10 md:hidden" aria-label="Abrir menu" onClick={() => setMobileMenuOpen(true)}><Menu size={20} /></Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{activeItem?.label ?? 'IRIS Educação'}</p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{schoolProfile?.name ?? ROLE_LABELS[role ?? ''] ?? 'Gestão escolar'}</p>
          </div>
          {role === 'secretaria' && (
            <div className="flex items-center gap-2">
              <span className="hidden text-right text-[11px] leading-tight text-muted-foreground lg:block">Escola<br />em uso</span>
              <div className="max-w-[210px]"><SchoolSelector /></div>
            </div>
          )}
          <NotificationsMenu />
          {role === 'admin' && (
            <Tooltip>
              <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-10" aria-label={hideFinancialData ? 'Mostrar valores financeiros' : 'Ocultar valores financeiros'} onClick={toggleFinancialVisibility}>{hideFinancialData ? <EyeOff size={18} /> : <Eye size={18} />}</Button>} />
              <TooltipContent>{hideFinancialData ? 'Mostrar valores' : 'Ocultar valores'}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-10" aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'} onClick={toggleTheme}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</Button>} />
            <TooltipContent>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</TooltipContent>
          </Tooltip>
          <div className="hidden items-center gap-2 border-l pl-3 sm:flex">
            <Avatar name={userName} photoUrl={userPhotoUrl} size={34} />
            <span className="hidden max-w-36 sm:block">
              <span className="block truncate text-xs font-semibold">{userName}</span>
              {userEmail && <span className="block truncate text-[11px] text-muted-foreground">{userEmail}</span>}
            </span>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1560px] p-4 sm:p-6 lg:px-8 lg:py-7">
            <Outlet />
          </div>
        </main>
      </div>
      <ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  )
}
