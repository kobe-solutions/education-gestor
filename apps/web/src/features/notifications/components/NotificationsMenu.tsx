import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, AlertTriangle, CalendarClock, UserX, FileWarning } from 'lucide-react'
import { Link } from 'react-router'
import { useDashboard, isAdminDashboard } from '../../dashboard/hooks/useDashboard'
import { useAuth } from '../../../contexts/AuthContext'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import { fmtBRL } from '../../../lib/format'

const DUE_WINDOW_DAYS = 3

export function NotificationsMenu() {
  const { payload } = useAuth()
  const { data: dashboard } = useDashboard()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const role = payload?.role
  const isSchoolRole = role === 'gestor' || role === 'secretaria'
  const isAdmin = role === 'admin'

  const items = useMemo(() => {
    if (!dashboard || isAdminDashboard(dashboard)) return { groups: [], total: 0 }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const limit = new Date(today.getTime() + DUE_WINDOW_DAYS * 24 * 60 * 60 * 1000)

    const soon = dashboard.upcomingTuitions
      .filter((t) => {
        const due = new Date(t.dueDate + 'T12:00:00')
        return due <= limit
      })
      .map((t) => ({
        id: t.id,
        title: t.studentName,
        detail: `Mensalidade de ${fmtBRL(t.amount)} vence em ${dueLabel(t.dueDate)}`,
        to: '/financial',
        tone: t.status === 'overdue' ? 'danger' : 'warning',
      }))

    const lowAttendance = dashboard.alerts.lowAttendanceStudents.map((s) => ({
      id: s.studentId,
      title: s.studentName,
      detail: `${s.absenceCount} faltas — frequência crítica`,
      to: `/students/${s.studentId}`,
      tone: 'danger' as const,
    }))

    const withoutGuardian = dashboard.alerts.studentsWithoutGuardians.map((s) => ({
      id: s.studentId,
      title: s.studentName,
      detail: 'Aluno sem responsável cadastrado',
      to: `/students/${s.studentId}`,
      tone: 'neutral' as const,
    }))

    const withoutDoc = dashboard.alerts.studentsWithoutIdDocument.map((s) => ({
      id: s.studentId,
      title: s.studentName,
      detail: 'Aluno sem documento de identidade',
      to: `/students/${s.studentId}`,
      tone: 'neutral' as const,
    }))

    const groups = [
      { key: 'tuitions', label: 'Mensalidades', icon: CalendarClock, items: soon },
      { key: 'attendance', label: 'Frequência', icon: AlertTriangle, items: lowAttendance },
      { key: 'guardians', label: 'Responsáveis', icon: UserX, items: withoutGuardian },
      { key: 'documents', label: 'Documentos', icon: FileWarning, items: withoutDoc },
    ].filter((g) => g.items.length > 0)

    const total = groups.reduce((acc, g) => acc + g.items.length, 0)
    return { groups, total }
  }, [dashboard])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (!isSchoolRole || isAdmin) return null

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        aria-label="Notificações"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} />
        {items.total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {items.total > 9 ? '9+' : items.total}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 max-h-[70vh] overflow-y-auto rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/5">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Notificações
          </p>
          {items.groups.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhuma pendência no momento
            </p>
          ) : (
            items.groups.map((group) => (
              <div key={group.key} className="mb-1">
                <p className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <group.icon className="h-3.5 w-3.5" />
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <Link
                    key={group.key + item.id}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="flex flex-col gap-0.5 rounded-lg px-3 py-2 hover:bg-accent"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span
                        className={cn(
                          'h-2 w-2 shrink-0 rounded-full',
                          item.tone === 'danger'
                            ? 'bg-red-500'
                            : item.tone === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-muted-foreground/40',
                        )}
                      />
                      <span className="truncate">{item.title}</span>
                    </span>
                    <span className="pl-4 text-xs text-muted-foreground">{item.detail}</span>
                  </Link>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function dueLabel(dueDate: string) {
  const due = new Date(dueDate + 'T12:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  if (diff < 0) return 'está atrasada'
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'amanhã'
  return `em ${diff} dias`
}
