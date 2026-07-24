import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, CalendarClock } from 'lucide-react'
import { useClass } from '../hooks/useClasses'
import { useTimetableSlots, WEEK_DAY_LABELS, WEEK_DAYS_ORDER } from '../../timetable/hooks/useTimetable'
import { useClassPeriods } from '../hooks/useClasses'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn } from '../../../lib/utils'

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: schoolClass, isLoading } = useClass(id!)
  const { data: slots = [], isLoading: slotsLoading } = useTimetableSlots(id!)
  const { data: classPeriods = [] } = useClassPeriods()

  const sortedPeriods = [...classPeriods].sort((a, b) => a.order - b.order)

  const slotMap = new Map<string, (typeof slots)[number]>()
  for (const s of slots) {
    slotMap.set(`${s.weekDay}-${s.classPeriodId}`, s)
  }

  const jsDay = new Date().getDay()
  const todayWeekDay = jsDay >= 1 && jsDay <= 6 ? WEEK_DAYS_ORDER[jsDay - 1] : null

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!schoolClass) {
    return <p className="text-sm text-destructive">Turma não encontrada</p>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} title="Voltar" className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <h1
            className="font-bold truncate"
            style={{ fontSize: 20, color: 'hsl(var(--primary))', letterSpacing: '-0.01em' }}
          >
            {schoolClass.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {schoolClass.serie?.name ?? '—'} · {schoolClass.shift}
            {schoolClass.academicPeriod ? ` · ${schoolClass.academicPeriod.name}` : ''}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate(`/classes/${id}/timetable`)}>
          <CalendarClock className="h-4 w-4 mr-1" />
          Grade Horária
        </Button>
      </div>

      {/* Calendário Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Grade Horária Semanal</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {slotsLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Nenhum horário cadastrado na grade.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th
                      className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider border-b whitespace-nowrap"
                      style={{ color: 'hsl(var(--muted-foreground))', width: 100 }}
                    >
                      Horário
                    </th>
                    {WEEK_DAYS.map((day) => (
                      <th
                        key={day}
                        className={cn(
                          'px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider border-b',
                          day === todayWeekDay
                            ? 'text-primary bg-primary/5'
                            : 'text-muted-foreground',
                        )}
                      >
                        {WEEK_DAY_LABELS[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedPeriods.map((period) => (
                    <tr key={period.id}>
                      <td
                        className="px-3 py-3 text-xs font-mono border-b whitespace-nowrap"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        {period.startTime} – {period.endTime}
                      </td>
                      {WEEK_DAYS.map((day) => {
                        const slot = slotMap.get(`${day}-${period.id}`)
                        return (
                          <td
                            key={day}
                            className={cn(
                              'px-3 py-3 border-b text-center',
                              day === todayWeekDay && 'bg-primary/5',
                            )}
                          >
                            {slot ? (
                              <div>
                                <p
                                  className="text-xs font-semibold"
                                  style={{ color: 'hsl(var(--primary))' }}
                                >
                                  {slot.subject.name}
                                </p>
                                <p
                                  className="text-[11px] mt-0.5"
                                  style={{ color: 'hsl(var(--muted-foreground))' }}
                                >
                                  {slot.teacher.name}
                                </p>
                              </div>
                            ) : (
                              <span style={{ color: 'hsl(var(--muted-foreground) / 0.3)' }}>—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
