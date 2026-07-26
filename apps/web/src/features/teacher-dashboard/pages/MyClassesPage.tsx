import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Users,
  GraduationCap,
  TrendingUp,
  Search,
  School,
} from 'lucide-react'
import { useTeacherDashboard } from '../hooks/useTeacherDashboard'
import { useAuth } from '../../../contexts/AuthContext'
import { Skeleton } from '../../../components/ui/skeleton'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Card, CardContent } from '../../../components/ui/card'
import { TONE_CONFIG, SHIFT_CONFIG } from '../../../lib/colors'
import { cn } from '../../../lib/utils'
import { EmptyState } from '../../../components/EmptyState'

function gradeTone(value: number): 'emerald' | 'amber' | 'red' {
  if (value >= 7) return 'emerald'
  if (value >= 5) return 'amber'
  return 'red'
}

function GradeBar({ value }: { value: number }) {
  const tone = gradeTone(value)
  const pct = Math.min(Math.max(value * 10, 3), 100)
  const barColor = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }[tone]

  return (
    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', barColor)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function MetricCard({
  icon: Icon,
  value,
  label,
  sub,
  tone,
}: {
  icon: React.ElementType
  value: string | number
  label: string
  sub?: string
  tone: keyof typeof TONE_CONFIG
}) {
  const t = TONE_CONFIG[tone]
  return (
    <Card size="sm" className="flex-1 min-w-0">
      <CardContent className="pt-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {label}
            </p>
            <p
              className="mt-1 text-2xl font-extrabold tabular-nums leading-none tracking-tight"
              style={{ color: t.valueColor }}
            >
              {value}
            </p>
            {sub && (
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {sub}
              </p>
            )}
          </div>
          <div
            className="shrink-0 p-2.5 rounded-xl flex items-center justify-center"
            style={{ background: t.iconBg, color: t.iconColor }}
          >
            <Icon size={20} strokeWidth={2.2} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ShiftBadge({ shift }: { shift: string }) {
  const cfg = SHIFT_CONFIG[shift]
  if (cfg) {
    const colors: Record<string, string> = {
      'bg-amber-500/10': 'rgba(180, 83, 9, 0.10)',
      'text-amber-400': '#F59E0B',
      'border-amber-500/30': 'rgba(180, 83, 9, 0.30)',
      'bg-orange-500/10': 'rgba(234, 88, 12, 0.10)',
      'text-orange-400': '#F97316',
      'border-orange-500/30': 'rgba(234, 88, 12, 0.30)',
      'bg-indigo-500/10': 'rgba(79, 70, 229, 0.10)',
      'text-indigo-400': '#818CF8',
      'border-indigo-500/30': 'rgba(79, 70, 229, 0.30)',
      'bg-green-500/10': 'rgba(21, 128, 61, 0.10)',
      'text-green-400': '#22C55E',
      'border-green-500/30': 'rgba(21, 128, 61, 0.30)',
    }
    const bgKey = cfg.className.split(' ').find((c) => c.startsWith('bg-')) ?? ''
    const fgKey = cfg.className.split(' ').find((c) => c.startsWith('text-')) ?? ''

    return (
      <span
        className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize border"
        style={{
          background: colors[bgKey] ?? 'hsl(var(--border))',
          color: colors[fgKey] ?? 'hsl(var(--muted-foreground))',
          borderColor: 'transparent',
        }}
      >
        {cfg.label}
      </span>
    )
  }

  const fallbackColors: Record<string, { bg: string; fg: string }> = {
    matutino: { bg: 'rgba(79, 70, 229, 0.10)', fg: '#818CF8' },
    vespertino: { bg: 'rgba(180, 83, 9, 0.10)', fg: '#F59E0B' },
    noturno: { bg: 'rgba(49, 46, 129, 0.10)', fg: '#A5B4FC' },
    integral: { bg: 'rgba(21, 128, 61, 0.10)', fg: '#22C55E' },
  }
  const c = fallbackColors[shift] ?? { bg: 'hsl(var(--border))', fg: 'hsl(var(--muted-foreground))' }
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize"
      style={{ background: c.bg, color: c.fg }}
    >
      {shift}
    </span>
  )
}

function MyClassesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-md" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-7 w-56 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4 space-y-3"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-7 w-14 rounded-sm" />
            <Skeleton className="h-3 w-20 rounded-sm" />
          </div>
        ))}
      </div>
      <Skeleton className="h-9 w-64 rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 space-y-3"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32 rounded-sm" />
                <Skeleton className="h-3 w-20 rounded-sm" />
              </div>
              <Skeleton className="h-5 w-14 rounded-md" />
            </div>
            <Skeleton className="h-4 w-24 rounded-sm" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MyClassesPage() {
  const { payload } = useAuth()
  const { data, isLoading } = useTeacherDashboard()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') ?? ''

  // Compute per-class average from performance data
  const classAvgMap = useMemo(() => {
    if (!data) return new Map<string, number>()
    const map = new Map<string, number>()
    for (const p of data.classPerformance) {
      if (p.subjects.length > 0) {
        const avg = p.subjects.reduce((sum, s) => sum + s.averageGrade, 0) / p.subjects.length
        map.set(p.classId, avg)
      }
    }
    return map
  }, [data])

  // Shift breakdown for any DB value
  const shiftBreakdown = useMemo(() => {
    if (!data) return ''
    const counts = new Map<string, number>()
    for (const c of data.classes) {
      counts.set(c.shift, (counts.get(c.shift) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([shift, count]) => `${count} ${SHIFT_CONFIG[shift]?.label ?? shift}`)
      .join(' · ')
  }, [data])

  // Filter classes by search
  const filteredClasses = useMemo(() => {
    if (!data) return []
    if (!searchQuery.trim()) return data.classes
    const q = searchQuery.trim().toLowerCase()
    return data.classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subjects.some((s) => s.name.toLowerCase().includes(q)),
    )
  }, [data, searchQuery])

  if (isLoading) return <MyClassesSkeleton />
  if (!data) return null

  const totalStudents = data.classes.reduce((sum, c) => sum + c.studentCount, 0)
  const avgPerClass =
    data.classes.length > 0 ? Math.round(totalStudents / data.classes.length) : 0
  const hasSearch = searchQuery.trim().length > 0

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Link
          to="/professor"
          className="flex items-center justify-center rounded-md w-8 h-8 transition-colors shrink-0 hover:bg-primary/10"
          title="Voltar"
        >
          <ArrowLeft size={16} style={{ color: 'hsl(var(--foreground))' }} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1
            className="font-bold leading-tight"
            style={{
              fontSize: 22,
              color: 'hsl(var(--foreground))',
              letterSpacing: '-0.01em',
            }}
          >
            Minhas Turmas
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {data.classes.length}{' '}
            {data.classes.length === 1 ? 'turma atribuída' : 'turmas atribuídas'} —{' '}
            {payload?.name}
          </p>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          icon={GraduationCap}
          value={data.classes.length}
          label="Turmas"
          sub={
            data.classes.length > 0
              ? shiftBreakdown
              : undefined
          }
          tone="indigo"
        />
        <MetricCard
          icon={Users}
          value={totalStudents}
          label="Total de Alunos"
          sub={data.classes.length > 0 ? `Média de ${avgPerClass} por turma` : undefined}
          tone="violet"
        />
        <MetricCard
          icon={TrendingUp}
          value={
            classAvgMap.size > 0
              ? (
                  Array.from(classAvgMap.values()).reduce((a, b) => a + b, 0) /
                  classAvgMap.size
                ).toFixed(1)
              : '—'
          }
          label="Média Geral das Turmas"
          sub={
            classAvgMap.size > 0
              ? `Baseada em ${classAvgMap.size} ${classAvgMap.size === 1 ? 'turma com notas' : 'turmas com notas'}`
              : 'Nenhuma nota registrada'
          }
          tone={classAvgMap.size > 0 ? gradeTone(Array.from(classAvgMap.values()).reduce((a, b) => a + b, 0) / classAvgMap.size) : 'slate'}
        />
      </div>

      {/* ── Search ──────────────────────────────────────── */}
      <div className="relative w-full sm:max-w-xs">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          size={16}
          style={{ color: 'hsl(var(--muted-foreground))' }}
        />
        <Input
          placeholder="Buscar por nome da turma ou disciplina..."
          value={searchQuery}
          onChange={(e) =>
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              const val = e.target.value
              if (!val) next.delete('q')
              else next.set('q', val)
              return next
            })
          }
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* ── Class Grid ──────────────────────────────────── */}
      {filteredClasses.length === 0 ? (
        hasSearch ? (
          <EmptyState
            icon={Search}
            title="Nenhuma turma encontrada"
            description={`Nenhum resultado para "${searchQuery}". Tente outro termo.`}
          />
        ) : (
          <EmptyState icon={School} title="Nenhuma turma atribuída" description="Você ainda não foi vinculado a nenhuma turma." />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredClasses.map((c) => {
            const avgGrade = classAvgMap.get(c.id)
            const avgTone = avgGrade ? gradeTone(avgGrade) : null

            return (
              <Link
                key={c.id}
                to={`/classes/${c.id}`}
                className="group block rounded-xl p-5 transition-all duration-200
                  hover:shadow-md hover:-translate-y-0.5"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Top: icon + name + shift */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="flex items-center justify-center rounded-lg shrink-0"
                    style={{
                      width: 40,
                      height: 40,
                      background: avgGrade
                        ? TONE_CONFIG[gradeTone(avgGrade)].iconBg
                        : 'rgba(79, 70, 229, 0.12)',
                      color: avgGrade
                        ? TONE_CONFIG[gradeTone(avgGrade)].iconColor
                        : '#818CF8',
                    }}
                  >
                    <BookOpen size={18} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="font-bold text-sm truncate group-hover:underline"
                      style={{ color: 'hsl(var(--foreground))' }}
                    >
                      {c.name}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {c.subjects.length}{' '}
                      {c.subjects.length === 1 ? 'disciplina' : 'disciplinas'}
                    </p>
                  </div>
                  <ShiftBadge shift={c.shift} />
                </div>

                {/* Student count */}
                <div className="flex items-center gap-2 mb-3">
                  <Users
                    size={14}
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    {c.studentCount}
                  </span>
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {c.studentCount === 1 ? 'aluno' : 'alunos'}
                  </span>
                </div>

                {/* Subject badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {c.subjects.map((s) => (
                    <Badge key={s.id} variant="secondary" className="text-[10px] font-medium">
                      {s.name}
                    </Badge>
                  ))}
                </div>

                {/* Performance indicator */}
                {avgGrade !== undefined && (
                  <div
                    className="flex items-center gap-3 pt-3"
                    style={{ borderTop: '1px solid hsl(var(--border))' }}
                  >
                    <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Média
                    </span>
                    <span
                      className="text-sm font-extrabold tabular-nums"
                      style={{ color: avgTone ? TONE_CONFIG[avgTone].valueColor : 'hsl(var(--foreground))' }}
                    >
                      {avgGrade.toFixed(1)}
                    </span>
                    <div className="flex-1 max-w-24">
                      <GradeBar value={avgGrade} />
                    </div>
                    <ArrowRight
                      size={13}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                  </div>
                )}

                {/* No grades yet */}
                {avgGrade === undefined && (
                  <div
                    className="flex items-center gap-2 pt-3"
                    style={{ borderTop: '1px solid hsl(var(--border))' }}
                  >
                    <span
                      className="text-[11px] italic"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      Sem notas registradas
                    </span>
                    <ArrowRight
                      size={13}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
