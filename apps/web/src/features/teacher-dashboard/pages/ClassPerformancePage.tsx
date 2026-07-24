import { useState } from 'react'
import { Link } from 'react-router'
import { BarChart3, ArrowRight, ArrowLeft } from 'lucide-react'
import { useTeacherDashboard } from '../hooks/useTeacherDashboard'
import { useAuth } from '../../../contexts/AuthContext'
import { Skeleton } from '../../../components/ui/skeleton'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'

// ── Tone config (same as dashboard) ────────────────────────────────────────

const TONE_CONFIG = {
  emerald: {
    iconBg: 'rgba(21, 128, 61, 0.10)',
    iconColor: '#22C55E',
    valueColor: '#22C55E',
    borderColor: 'rgba(21, 128, 61, 0.15)',
  },
  amber: {
    iconBg: 'rgba(180, 83, 9, 0.10)',
    iconColor: '#F59E0B',
    valueColor: '#F59E0B',
    borderColor: 'rgba(180, 83, 9, 0.15)',
  },
  red: {
    iconBg: 'rgba(185, 28, 28, 0.10)',
    iconColor: '#EF4444',
    valueColor: '#EF4444',
    borderColor: 'rgba(185, 28, 28, 0.15)',
  },
} as const

function gradeTone(value: number): 'emerald' | 'amber' | 'red' {
  if (value >= 7) return 'emerald'
  if (value >= 5) return 'amber'
  return 'red'
}

// ── Inline components ─────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────

export function ClassPerformancePage() {
  const { payload } = useAuth()
  const { data, isLoading } = useTeacherDashboard()
  const [selectedClassId, setSelectedClassId] = useState<string>('all')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-48 rounded-md" />
        <Skeleton className="h-10 w-64 rounded-md" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (!data) return null

  const filtered = selectedClassId === 'all'
    ? data.classPerformance
    : data.classPerformance.filter((p) => p.classId === selectedClassId)

  const overallAvg =
    filtered.length > 0
      ? (
          filtered
            .flatMap((p) => p.subjects.map((s) => s.averageGrade))
            .reduce((a, b) => a + b, 0) /
          filtered.flatMap((p) => p.subjects).length
        ).toFixed(1)
      : '—'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Link
          to="/professor"
          className="flex items-center justify-center rounded-md w-8 h-8 transition-colors shrink-0"
          title="Voltar"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--primary) / 0.1)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
        >
          <ArrowLeft size={16} style={{ color: 'hsl(var(--foreground))' }} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1
            className="font-bold leading-tight"
            style={{ fontSize: 22, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}
          >
            Desempenho das Turmas
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Médias por disciplina — {payload?.name}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-64">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as turmas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as turmas</SelectItem>
              {data.classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {overallAvg !== '—' && (
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-xl"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <BarChart3 size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
            <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Média geral:</span>
            <span
              className="text-lg font-extrabold tabular-nums"
              style={{ color: TONE_CONFIG[gradeTone(Number(overallAvg) || 0)].valueColor }}
            >
              {overallAvg}
            </span>
          </div>
        )}
      </div>

      {/* Performance cards */}
      {filtered.length === 0 ? (
        <TableEmpty icon={BarChart3} message="Nenhuma nota registrada para esta turma" />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filtered.map((p) => {
            const classAvg =
              p.subjects.length > 0
                ? (p.subjects.reduce((sum, s) => sum + s.averageGrade, 0) / p.subjects.length).toFixed(1)
                : '—'

            return (
              <div
                key={p.classId}
                className="rounded-xl overflow-hidden"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <div className="flex items-center gap-3">
                    <Link to={`/classes/${p.classId}`} className="font-bold text-sm hover:underline" style={{ color: 'hsl(var(--foreground))' }}>
                      {p.className}
                    </Link>
                    {classAvg !== '—' && (
                      <span
                        className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-sm"
                        style={{
                          background: TONE_CONFIG[gradeTone(Number(classAvg) || 0)].iconBg,
                          color: TONE_CONFIG[gradeTone(Number(classAvg) || 0)].valueColor,
                        }}
                      >
                        Média: {classAvg}
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/classes/${p.classId}`} className="gap-1">
                      Detalhes <ArrowRight size={12} />
                    </Link>
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        {['Disciplina', 'Média', 'Alunos'].map((h) => (
                          <th
                            key={h}
                            className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {p.subjects.map((s) => {
                        const tone = gradeTone(s.averageGrade)
                        const t = TONE_CONFIG[tone]
                        return (
                          <tr
                            key={s.subjectId}
                            className="transition-colors duration-150 hover:bg-accent"
                            style={{ borderBottom: '1px solid hsl(var(--border))' }}
                          >
                            <td className="px-5 py-2.5 font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                              {s.subjectName}
                            </td>
                            <td className="px-5 py-2.5">
                              <span
                                className="inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-bold tabular-nums"
                                style={{ background: t.iconBg, color: t.valueColor }}
                              >
                                {s.averageGrade.toFixed(1)}
                              </span>
                            </td>
                            <td className="px-5 py-2.5 tabular-nums" style={{ color: 'hsl(var(--foreground))' }}>
                              {s.studentCount}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
