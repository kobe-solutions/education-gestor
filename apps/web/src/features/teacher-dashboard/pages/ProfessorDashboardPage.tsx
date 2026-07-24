import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import {
  Users,
  Clock,
  CalendarDays,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useTeacherDashboard } from '../hooks/useTeacherDashboard'
import { useAuth } from '../../../contexts/AuthContext'
import { Button } from '../../../components/ui/button'
import { Skeleton } from '../../../components/ui/skeleton'
import { Badge } from '../../../components/ui/badge'
import { WEEK_DAY_LABELS, WEEK_DAYS_ORDER } from '../../timetable/hooks/useTimetable'

// ── Inline components (same pattern as DashboardPage.tsx) ─────────────────

function DashboardSkeleton({ cardCount }: { cardCount: number }) {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-48 mb-2 rounded-md" />
        <Skeleton className="h-4 w-64 rounded-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {Array.from({ length: cardCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          >
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-7 w-14 rounded-sm" />
            <Skeleton className="h-3 w-16 rounded-sm" />
          </div>
        ))}
      </div>
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <Skeleton className="h-5 w-64 rounded-sm" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}

interface DashMetricProps {
  icon: React.ElementType
  value: number | string
  label: string
  sub?: string
  tone: 'indigo' | 'violet' | 'slate' | 'amber' | 'emerald' | 'red'
}

const TONE_CONFIG = {
  indigo: {
    iconBg: 'rgba(79, 70, 229, 0.12)',
    iconColor: '#818CF8',
    valueColor: 'hsl(var(--foreground))',
    borderColor: 'rgba(79, 70, 229, 0.15)',
  },
  violet: {
    iconBg: 'rgba(129, 140, 248, 0.12)',
    iconColor: '#A5B4FC',
    valueColor: 'hsl(var(--foreground))',
    borderColor: 'rgba(129, 140, 248, 0.15)',
  },
  slate: {
    iconBg: 'rgba(49, 46, 129, 0.10)',
    iconColor: '#818CF8',
    valueColor: 'hsl(var(--foreground))',
    borderColor: 'rgba(49, 46, 129, 0.12)',
  },
  amber: {
    iconBg: 'rgba(180, 83, 9, 0.10)',
    iconColor: '#F59E0B',
    valueColor: '#F59E0B',
    borderColor: 'rgba(180, 83, 9, 0.15)',
  },
  emerald: {
    iconBg: 'rgba(21, 128, 61, 0.10)',
    iconColor: '#22C55E',
    valueColor: '#22C55E',
    borderColor: 'rgba(21, 128, 61, 0.15)',
  },
  red: {
    iconBg: 'rgba(185, 28, 28, 0.10)',
    iconColor: '#EF4444',
    valueColor: '#EF4444',
    borderColor: 'rgba(185, 28, 28, 0.15)',
  },
} as const

function DashMetric({ icon: Icon, value, label, sub, tone }: DashMetricProps) {
  const t = TONE_CONFIG[tone]
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5"
      style={{
        background: 'hsl(var(--card))',
        border: `1px solid ${t.borderColor}`,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-md shrink-0"
        style={{ width: 36, height: 36, background: t.iconBg, color: t.iconColor }}
      >
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <div>
        <div
          className="text-2xl font-extrabold tabular-nums leading-none tracking-tight"
          style={{ color: t.valueColor }}
        >
          {value}
        </div>
        <div
          className="text-[11px] font-semibold uppercase tracking-wider mt-1.5"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          {label}
        </div>
        {sub && (
          <div className="text-xs font-medium mt-1 tabular-nums" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <h2 className="font-bold text-base" style={{ color: 'hsl(var(--foreground))' }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

import { EmptyState } from '../../../components/EmptyState'

// ── Grade color helper ────────────────────────────────────────────────────

function gradeTone(value: number): 'emerald' | 'amber' | 'red' {
  if (value >= 7) return 'emerald'
  if (value >= 5) return 'amber'
  return 'red'
}

// ── Grade Horária de Hoje ──────────────────────────────────────────────────

function TodayScheduleTable({ slots }: { slots: import('../hooks/useTeacherDashboard').TimetableSlotInfo[] }) {
  if (slots.length === 0) {
    return <EmptyState icon={Clock} title="Nenhuma aula programada para hoje" />
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              {['Horário', 'Turma', 'Disciplina'].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((s) => (
              <tr
                key={s.slotId}
                className="transition-colors duration-150 hover:bg-accent"
                style={{ borderBottom: '1px solid hsl(var(--border))' }}
              >
                <td className="px-5 py-3 tabular-nums font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                  {s.classPeriod.startTime} — {s.classPeriod.endTime}
                </td>
                <td className="px-5 py-3">
                  <Link to={`/classes/${s.class.id}`} className="font-semibold hover:underline" style={{ color: 'hsl(var(--foreground))' }}>
                    {s.class.name}
                  </Link>
                </td>
                <td className="px-5 py-3" style={{ color: 'hsl(var(--foreground))' }}>
                  {s.subject.name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Section 3: Grade Horária Semanal ──────────────────────────────────────

function WeeklyTimetable({ slots }: { slots: import('../hooks/useTeacherDashboard').TimetableSlotInfo[] }) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const today = new Date()
  const jsDay = today.getDay()
  const todayWeekDay = jsDay >= 1 && jsDay <= 6 ? WEEK_DAYS_ORDER[jsDay - 1] : null

  useEffect(() => {
    if (todayWeekDay) setExpandedDay(todayWeekDay)
  }, [todayWeekDay])

  const slotsByDay = new Map<string, typeof slots>()
  for (const s of slots) {
    const arr = slotsByDay.get(s.weekDay) ?? []
    arr.push(s)
    slotsByDay.set(s.weekDay, arr)
  }

  const daysWithSlots = WEEK_DAYS_ORDER.filter((d) => slotsByDay.has(d))

  if (daysWithSlots.length === 0) {
    return <EmptyState icon={CalendarDays} title="Nenhuma aula na grade horária" />
  }

  return (
    <div className="space-y-2">
      {daysWithSlots.map((day) => {
        const daySlots = slotsByDay.get(day) ?? []
        const isExpanded = expandedDay === day
        const isToday = day === todayWeekDay

        return (
          <div
            key={day}
            className="rounded-xl overflow-hidden"
            style={{
              background: 'hsl(var(--card))',
              border: `1px solid ${isToday ? 'rgba(79, 70, 229, 0.3)' : 'hsl(var(--border))'}`,
              boxShadow: isToday ? '0 0 0 1px rgba(79, 70, 229, 0.1)' : 'var(--shadow-sm)',
            }}
          >
            <Button
              variant="ghost"
              className="w-full justify-between px-4 py-3 h-auto text-left font-normal"
              onClick={() => setExpandedDay(isExpanded ? null : day)}
            >
              <div className="flex items-center gap-2">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                  {WEEK_DAY_LABELS[day]}
                </span>
                {isToday && (
                  <span
                    className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm"
                    style={{ background: 'rgba(79, 70, 229, 0.10)', color: '#818CF8' }}
                  >
                    Hoje
                  </span>
                )}
              </div>
              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {daySlots.length} aula{daySlots.length !== 1 ? 's' : ''}
              </span>
            </Button>
            {isExpanded && (
              <div className="overflow-x-auto" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      {['Horário', 'Turma', 'Disciplina'].map((h) => (
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
                    {daySlots.map((s) => (
                      <tr
                        key={s.slotId}
                        className="transition-colors duration-150 hover:bg-accent"
                        style={{ borderBottom: '1px solid hsl(var(--border))' }}
                      >
                        <td className="px-5 py-2.5 tabular-nums font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                          {s.classPeriod.startTime} — {s.classPeriod.endTime}
                        </td>
                        <td className="px-5 py-2.5">
                          <Link to={`/classes/${s.class.id}`} className="font-semibold hover:underline" style={{ color: 'hsl(var(--foreground))' }}>
                            {s.class.name}
                          </Link>
                        </td>
                        <td className="px-5 py-2.5" style={{ color: 'hsl(var(--foreground))' }}>
                          {s.subject.name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export function ProfessorDashboardPage() {
  const { payload } = useAuth()
  const { data, isLoading } = useTeacherDashboard()

  if (isLoading) return <DashboardSkeleton cardCount={4} />
  if (!data) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="font-bold leading-tight"
          style={{ fontSize: 22, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}
        >
          Painel do Professor
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Bem-vindo, {payload?.name} — {new Date().getFullYear()}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2">
        <DashMetric icon={Users} value={data.classes.length} label="Turmas" tone="indigo" />
        <DashMetric icon={Clock} value={data.todaySchedule.length} label="Aulas Hoje" tone="violet" />
      </div>

      {/* Section 1: Grade Horária de Hoje */}
      <section className="space-y-4">
        <SectionHeader title="Grade Horária de Hoje" subtitle={WEEK_DAY_LABELS[data.todaySchedule[0]?.weekDay] ?? 'Hoje'} />
        <TodayScheduleTable slots={data.todaySchedule} />
      </section>

      {/* Section 3: Grade Horária Semanal */}
      <section className="space-y-4">
        <SectionHeader title="Grade Horária Semanal" subtitle="Clique no dia para expandir" />
        <WeeklyTimetable slots={data.weeklyTimetable} />
      </section>
    </div>
  )
}
