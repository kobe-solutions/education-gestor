import { useEffect, useMemo, useState } from 'react'
import { Check, Save } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import { toast } from '../../../lib/toast'
import { useRegisterBulkGrades } from '../hooks/useAcademic'
import type { AcademicPeriod, Grade } from '@education-gestor/types'

interface GradeGridProps {
  classId: string
  subjectId: string
  teacherId: string
  students: { id: string; name: string }[]
  periods: AcademicPeriod[]
  grades: Grade[]
  className?: string
}

function cellKey(studentId: string, periodId: string) {
  return `${studentId}:${periodId}`
}

function isValidValue(value: string) {
  if (value.trim() === '') return true
  const num = Number(value.replace(',', '.'))
  return !Number.isNaN(num) && num >= 0 && num <= 10
}

function isDirtyValue(current: string, original: string | undefined) {
  return current.trim() !== (original ?? '')
}

export function GradeGrid({
  classId,
  subjectId,
  teacherId,
  students,
  periods,
  grades,
  className,
}: GradeGridProps) {
  const sortedPeriods = useMemo(() => [...periods].sort((a, b) => a.order - b.order), [periods])
  const saveGrades = useRegisterBulkGrades()

  const originalGrades = useMemo(() => {
    const map = new Map<string, string>()
    for (const g of grades) {
      if (g.subjectId === subjectId) map.set(cellKey(g.studentId, g.academicPeriodId), g.value)
    }
    return map
  }, [grades, subjectId])

  const [values, setValues] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState<Set<string>>(new Set())

  useEffect(() => {
    const map: Record<string, string> = {}
    for (const student of students) {
      for (const period of periods) {
        const key = cellKey(student.id, period.id)
        const existing = originalGrades.get(key)
        if (existing !== undefined) map[key] = existing
      }
    }
    setValues(map)
    setDirty(new Set())
  }, [classId, subjectId, students, periods, originalGrades])

  const changedCount = dirty.size
  const invalidKeys = useMemo(() => {
    const result = new Set<string>()
    for (const key of dirty) {
      const value = values[key] ?? ''
      if (!isValidValue(value)) result.add(key)
    }
    return result
  }, [dirty, values])

  function handleChange(studentId: string, periodId: string, raw: string) {
    const key = cellKey(studentId, periodId)
    const value = raw.replace(',', '.')

    setValues((prev) => ({ ...prev, [key]: value }))
    setDirty((prev) => {
      const next = new Set(prev)
      if (isDirtyValue(value, originalGrades.get(key))) next.add(key)
      else next.delete(key)
      return next
    })
  }

  function handleSave() {
    const payload = {
      classId,
      subjectId,
      teacherId,
      grades: [...dirty]
        .filter((key) => !invalidKeys.has(key))
        .map((key) => {
          const [studentId, academicPeriodId] = key.split(':')
          return { studentId, academicPeriodId, value: Number(values[key]) }
        })
        .filter((g) => !Number.isNaN(g.value)),
    }

    saveGrades.mutate(payload, {
      onSuccess: () => {
        toast.success('Notas salvas')
        setDirty(new Set())
      },
    })
  }

  const canSave = changedCount > 0 && invalidKeys.size === 0 && !saveGrades.isPending

  return (
    <div className={className}>
      <div className="flex items-center justify-between px-2 pb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {changedCount > 0 ? (
            <>
              <span className="inline-block size-2 rounded-full bg-primary" />
              {changedCount} alteração{changedCount !== 1 ? 'ões' : ''} não salva
              {changedCount !== 1 ? 's' : ''}
            </>
          ) : (
            <>
              <Check className="size-4 text-green-600" />
              Todas as notas salvas
            </>
          )}
        </div>
        <Button size="sm" onClick={handleSave} disabled={!canSave}>
          <Save className="size-4" />
          Salvar tudo
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 min-w-56 bg-card">Aluno</TableHead>
              {sortedPeriods.map((period) => (
                <TableHead key={period.id} className="w-20 text-center">
                  {period.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="sticky left-0 z-10 min-w-56 bg-card font-medium">
                  {student.name}
                </TableCell>
                {sortedPeriods.map((period) => {
                  const key = cellKey(student.id, period.id)
                  const value = values[key] ?? ''
                  const isCellDirty = dirty.has(key)
                  const isInvalid = invalidKeys.has(key)

                  return (
                    <TableCell key={period.id} className="p-1.5 text-center">
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        max={10}
                        inputMode="decimal"
                        placeholder="—"
                        aria-label={`Nota de ${student.name} em ${period.name}`}
                        value={value}
                        onChange={(e) => handleChange(student.id, period.id, e.target.value)}
                        className={cn(
                          'h-8 w-full min-w-14 text-center tabular-nums',
                          isCellDirty && 'border-primary/60 bg-primary/5 ring-2 ring-primary/15',
                          isInvalid && 'border-destructive bg-destructive/5 ring-2 ring-destructive/20',
                        )}
                      />
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
