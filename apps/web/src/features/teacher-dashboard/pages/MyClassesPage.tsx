import { Link } from 'react-router'
import { Users } from 'lucide-react'
import { useTeacherDashboard } from '../hooks/useTeacherDashboard'
import { useAuth } from '../../../contexts/AuthContext'
import { Skeleton } from '../../../components/ui/skeleton'
import { Badge } from '../../../components/ui/badge'

// ── Inline components ──────────────────────────────────────────────────────

function TableEmpty({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 48, height: 48, background: 'hsl(var(--accent))', color: 'hsl(var(--muted-foreground))' }}
      >
        <Icon size={22} />
      </div>
      <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
        {message}
      </p>
    </div>
  )
}

const SHIFT_COLORS: Record<string, { bg: string; fg: string }> = {
  matutino: { bg: 'rgba(79, 70, 229, 0.10)', fg: '#818CF8' },
  vespertino: { bg: 'rgba(180, 83, 9, 0.10)', fg: '#F59E0B' },
  noturno: { bg: 'rgba(49, 46, 129, 0.10)', fg: '#A5B4FC' },
  integral: { bg: 'rgba(21, 128, 61, 0.10)', fg: '#22C55E' },
}

function ShiftBadge({ shift }: { shift: string }) {
  const c = SHIFT_COLORS[shift] ?? { bg: 'hsl(var(--border))', fg: 'hsl(var(--muted-foreground))' }
  return (
    <span
      className="inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold capitalize"
      style={{ background: c.bg, color: c.fg }}
    >
      {shift}
    </span>
  )
}

// ── Turmas Grid ────────────────────────────────────────────────────────────

function TurmasGrid({ classes }: { classes: import('../hooks/useTeacherDashboard').TeacherClass[] }) {
  if (classes.length === 0) {
    return <TableEmpty icon={Users} message="Nenhuma turma atribuída" />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {classes.map((c) => (
        <Link
          key={c.id}
          to={`/classes/${c.id}`}
          className="block rounded-xl p-4 transition-all duration-200
            hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-bold text-sm truncate" style={{ color: 'hsl(var(--foreground))' }}>
              {c.name}
            </h3>
            <ShiftBadge shift={c.shift} />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
            <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              {c.studentCount}
            </span>
            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              alunos
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {c.subjects.map((s) => (
              <Badge key={s.id} variant="secondary" className="text-[10px] font-medium">
                {s.name}
              </Badge>
            ))}
          </div>
        </Link>
      ))}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export function MyClassesPage() {
  const { payload } = useAuth()
  const { data, isLoading } = useTeacherDashboard()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-48 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="font-bold leading-tight"
          style={{ fontSize: 22, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}
        >
          Minhas Turmas
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {data.classes.length} turma{data.classes.length !== 1 ? 's' : ''} atribuída{data.classes.length !== 1 ? 's' : ''} — {payload?.name}
        </p>
      </div>

      {/* Turmas Grid */}
      <TurmasGrid classes={data.classes} />
    </div>
  )
}
