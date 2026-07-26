import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  BarChart3,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Users,
  GraduationCap,
  Award,
  AlertTriangle,
} from 'lucide-react'
import { useTeacherDashboard } from '../hooks/useTeacherDashboard'
import { useAuth } from '../../../contexts/AuthContext'
import { Skeleton } from '../../../components/ui/skeleton'
import { Button } from '../../../components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import {
  Card,
  CardContent,
} from '../../../components/ui/card'
import { TONE_CONFIG } from '../../../lib/colors'
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
    <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
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
              <p className="text-xs mt-1 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
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

function ClassPerformanceSkeleton() {
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
      <div className="space-y-3 sm:space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 space-y-3"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-5 w-40 rounded-sm" />
                <Skeleton className="h-3 w-24 rounded-sm" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ClassPerformancePage() {
  const { payload } = useAuth()
  const { data, isLoading } = useTeacherDashboard()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedClassId = searchParams.get('class') ?? 'all'

  // Must call hooks unconditionally — before any early return
  const filtered = useMemo(
    () =>
      data
        ? selectedClassId === 'all'
          ? data.classPerformance
          : data.classPerformance.filter((p) => p.classId === selectedClassId)
        : [],
    [data, selectedClassId],
  )

  const bestClass = useMemo(() => {
    if (filtered.length === 0) return null
    return filtered.reduce((best, curr) => {
      const currAvg =
        curr.subjects.length > 0
          ? curr.subjects.reduce((s, sub) => s + sub.averageGrade, 0) /
            curr.subjects.length
          : 0
      const bestAvg =
        best.subjects.length > 0
          ? best.subjects.reduce((s, sub) => s + sub.averageGrade, 0) /
            best.subjects.length
          : 0
      return currAvg > bestAvg ? curr : best
    })
  }, [filtered])

  if (isLoading) return <ClassPerformanceSkeleton />
  if (!data) return null

  const allGrades = filtered.flatMap((p) => p.subjects.map((s) => s.averageGrade))
  const overallAvg =
    allGrades.length > 0
      ? (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(1)
      : null

  const totalSubjects = filtered.reduce((acc, p) => acc + p.subjects.length, 0)

  const bestClassAvg =
    bestClass && bestClass.subjects.length > 0
      ? (
          bestClass.subjects.reduce((s, sub) => s + sub.averageGrade, 0) /
          bestClass.subjects.length
        ).toFixed(1)
      : null

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
            Desempenho das Turmas
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Médias por disciplina — {payload?.name}
          </p>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          icon={GraduationCap}
          value={filtered.length}
          label="Turmas"
          sub={totalSubjects > 0 ? `${totalSubjects} ${totalSubjects === 1 ? 'disciplina' : 'disciplinas'}` : undefined}
          tone="indigo"
        />
        <MetricCard
          icon={TrendingUp}
          value={overallAvg ?? '—'}
          label="Média Geral"
          sub={
            overallAvg
              ? `${filtered.reduce((acc, p) => acc + p.subjects.filter((s) => s.averageGrade >= 7).length, 0)} acima de 7,0 · ${filtered.reduce((acc, p) => acc + p.subjects.filter((s) => s.averageGrade < 5).length, 0)} abaixo de 5,0`
              : undefined
          }
          tone={overallAvg ? gradeTone(Number(overallAvg)) : 'slate'}
        />
        <MetricCard
          icon={Award}
          value={bestClass ? bestClass.className : '—'}
          label="Melhor Desempenho"
          sub={bestClassAvg ? `Média ${bestClassAvg}` : undefined}
          tone="emerald"
        />
      </div>

      {/* ── Filter ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-full sm:w-64">
          <Select
            value={selectedClassId}
            onValueChange={(v) =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev)
                if (!v || v === 'all') next.delete('class')
                else next.set('class', v)
                return next
              })
            }
            items={[
              { value: 'all', label: 'Todas as turmas' },
              ...data.classes.map((c) => ({ value: c.id, label: c.name })),
            ]}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as turmas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as turmas</SelectItem>
              {data.classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Performance Cards ────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Nenhuma nota registrada"
          description="Ainda não há notas lançadas para as turmas deste período."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => {
            const classAvg =
              p.subjects.length > 0
                ? (
                    p.subjects.reduce((sum, s) => sum + s.averageGrade, 0) /
                    p.subjects.length
                  ).toFixed(1)
                : null
            const classTone = classAvg ? gradeTone(Number(classAvg)) : 'slate'
            const t = TONE_CONFIG[classTone]
            const above70 = p.subjects.filter((s) => s.averageGrade >= 7).length
            const below50 = p.subjects.filter((s) => s.averageGrade < 5).length

            return (
              <Card
                key={p.classId}
                size={selectedClassId !== 'all' && filtered.length === 1 ? 'default' : 'sm'}
              >
                {/* ── Class header ─────────────────────────── */}
                <div
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  style={{ borderBottom: '1px solid hsl(var(--border))' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex items-center justify-center rounded-lg shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        background: t.iconBg,
                        color: t.iconColor,
                      }}
                    >
                      <BookOpen size={18} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/classes/${p.classId}`}
                        className="font-bold text-sm hover:underline truncate block"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        {p.className}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {p.subjects.length}{' '}
                        {p.subjects.length === 1 ? 'disciplina' : 'disciplinas'}
                        {below50 > 0 && (
                          <span className="inline-flex items-center gap-1 ml-3 text-red-500">
                            <AlertTriangle size={11} />
                            {below50} abaixo de 5,0
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {classAvg && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Média
                        </span>
                        <span
                          className="text-lg font-extrabold tabular-nums"
                          style={{ color: t.valueColor }}
                        >
                          {classAvg}
                        </span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link to={`/classes/${p.classId}`} />}
                      className="gap-1"
                    >
                      Detalhes
                      <ArrowRight size={12} />
                    </Button>
                  </div>
                </div>

                {/* ── Subjects list ────────────────────────── */}
                <div>
                  {/* Table header (desktop) */}
                  <div
                    className="hidden sm:flex items-center gap-4 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'hsl(var(--muted-foreground))', borderBottom: '1px solid hsl(var(--border))' }}
                  >
                    <span className="flex-1">Disciplina</span>
                    <span className="w-32 text-center">Progresso</span>
                    <span className="w-14 text-right">Nota</span>
                    <span className="w-20 text-right">Alunos</span>
                  </div>

                  {p.subjects.map((s, idx) => {
                    const tone = gradeTone(s.averageGrade)
                    const t2 = TONE_CONFIG[tone]
                    return (
                      <div
                        key={s.subjectId}
                        className="px-5 py-3 flex items-center gap-4 transition-colors duration-150 hover:bg-accent/50"
                        style={{ borderBottom: idx < p.subjects.length - 1 ? '1px solid hsl(var(--border))' : undefined }}
                      >
                        {/* Subject name */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: 'hsl(var(--foreground))' }}
                          >
                            {s.subjectName}
                          </p>
                        </div>

                        {/* Progress bar (desktop) */}
                        <div className="hidden sm:block w-32">
                          <GradeBar value={s.averageGrade} />
                        </div>

                        {/* Grade */}
                        <span
                          className="inline-flex items-center justify-end rounded-md px-2 py-0.5 text-xs font-bold tabular-nums shrink-0 w-14 text-right"
                          style={{ color: t2.valueColor }}
                        >
                          {s.averageGrade.toFixed(1)}
                        </span>

                        {/* Student count */}
                        <span
                          className="text-xs tabular-nums shrink-0 w-20 text-right hidden sm:block"
                          style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                          {s.studentCount} {s.studentCount === 1 ? 'aluno' : 'alunos'}
                        </span>

                        {/* Mobile grade note + student count */}
                        <div className="flex sm:hidden items-center gap-2 shrink-0">
                          <span
                            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums"
                            style={{ background: t2.iconBg, color: t2.valueColor }}
                          >
                            {s.averageGrade.toFixed(1)}
                          </span>
                          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            <Users size={12} className="inline mr-0.5" />
                            {s.studentCount}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* ── Card footer summary ──────────────────── */}
                {p.subjects.length > 0 && (
                  <div
                    className="px-5 py-2.5 flex items-center gap-4 text-[11px]"
                    style={{
                      borderTop: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--muted-foreground))',
                    }}
                  >
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: TONE_CONFIG.emerald.valueColor }}
                      />
                      {above70} acima da meta
                    </span>
                    {below50 > 0 && (
                      <span className="flex items-center gap-1">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ background: TONE_CONFIG.red.valueColor }}
                        />
                        {below50} abaixo do mínimo
                      </span>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
