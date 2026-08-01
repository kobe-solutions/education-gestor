import type { TimetableSlot } from '../../timetable/hooks/useTimetable'

export interface ClassPeriodLike {
  id: string
  startTime: string
  endTime: string
}

export function overlapsTime(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd
}

/** Encontra slots em conflito para o mesmo professor no mesmo dia/horário. */
export function findSlotConflicts(
  slots: TimetableSlot[],
  classPeriods: ClassPeriodLike[],
  opts: { teacherId: string; weekDay: string; classPeriodId: string; excludeSlotId?: string },
): TimetableSlot[] {
  const target = classPeriods.find((cp) => cp.id === opts.classPeriodId)
  if (!target) return []

  return slots.filter((s) => {
    if (s.teacherId !== opts.teacherId) return false
    if (s.weekDay !== opts.weekDay) return false
    if (opts.excludeSlotId && s.id === opts.excludeSlotId) return false

    const other = classPeriods.find((cp) => cp.id === s.classPeriodId)
    if (!other) return false
    return overlapsTime(target.startTime, target.endTime, other.startTime, other.endTime)
  })
}

/** Conjunto de ids de slots que conflitam entre si (mesmo professor, mesmo dia, horário sobreposto). */
export function computeConflictingSlotIds(slots: TimetableSlot[], classPeriods: ClassPeriodLike[]) {
  const conflictIds = new Set<string>()

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i]
      const b = slots[j]
      if (a.teacherId !== b.teacherId || a.weekDay !== b.weekDay) continue

      const pa = classPeriods.find((cp) => cp.id === a.classPeriodId)
      const pb = classPeriods.find((cp) => cp.id === b.classPeriodId)
      if (!pa || !pb) continue
      if (overlapsTime(pa.startTime, pa.endTime, pb.startTime, pb.endTime)) {
        conflictIds.add(a.id)
        conflictIds.add(b.id)
      }
    }
  }

  return conflictIds
}
