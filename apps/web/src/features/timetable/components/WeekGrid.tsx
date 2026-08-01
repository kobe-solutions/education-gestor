import { Skeleton } from '../../../components/ui/skeleton'
import { cn } from '../../../lib/utils'
import { WEEK_DAY_LABELS, WEEK_DAYS_ORDER } from '../hooks/useTimetable'
import type { TimetableSlot } from '../hooks/useTimetable'

interface WeekGridClassPeriod {
  id: string
  startTime: string
  endTime: string
  order: number
}

interface WeekGridProps {
  slots: TimetableSlot[]
  classPeriods: WeekGridClassPeriod[]
  loading?: boolean
  emptyMessage?: string
  onSlotClick?: (slot: TimetableSlot) => void
}

export function WeekGrid({
  slots,
  classPeriods,
  loading = false,
  emptyMessage = 'Nenhum horário cadastrado na grade.',
  onSlotClick,
}: WeekGridProps) {
  const sortedPeriods = [...classPeriods].sort((a, b) => a.order - b.order)

  const slotMap = new Map<string, TimetableSlot>()
  for (const s of slots) {
    slotMap.set(`${s.weekDay}-${s.classPeriodId}`, s)
  }

  const jsDay = new Date().getDay()
  const todayWeekDay = jsDay >= 1 && jsDay <= 6 ? WEEK_DAYS_ORDER[jsDay - 1] : null

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {emptyMessage}
      </div>
    )
  }

  return (
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
            {WEEK_DAYS_ORDER.map((day) => (
              <th
                key={day}
                className={cn(
                  'px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider border-b',
                  day === todayWeekDay ? 'text-primary bg-primary/5' : 'text-muted-foreground',
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
              {WEEK_DAYS_ORDER.map((day) => {
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
                      <button
                        type="button"
                        disabled={!onSlotClick}
                        onClick={onSlotClick ? () => onSlotClick(slot) : undefined}
                        className={cn(
                          'w-full text-left',
                          onSlotClick && 'hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        )}
                      >
                        <p className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                          {slot.subject.name}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {slot.teacher.name}
                        </p>
                      </button>
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
  )
}
