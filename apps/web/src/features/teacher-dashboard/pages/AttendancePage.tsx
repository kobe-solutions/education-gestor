import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { useTeacherDashboard } from '../hooks/useTeacherDashboard'
import { useClass } from '../../classes/hooks/useClasses'
import { useClassAttendance, useRegisterBulkAttendance } from '../../academic/hooks/useAcademic'
import { useAuth } from '../../../contexts/AuthContext'
import { Skeleton } from '../../../components/ui/skeleton'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { toast } from '../../../lib/toast'

// ── Inline components ──────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
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
  )
}

// ── Attendance Form ────────────────────────────────────────────────────────

function AttendanceForm({ classes }: { classes: import('../hooks/useTeacherDashboard').TeacherClass[] }) {
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [attendanceMap, setAttendanceMap] = useState<Map<string, boolean>>(new Map())

  const { data: schoolClass } = useClass(selectedClassId)
  const { data: existingAttendance } = useClassAttendance(selectedClassId, selectedDate)
  const registerBulk = useRegisterBulkAttendance()

  const today = new Date()
  const dateOptions = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  })

  useEffect(() => {
    if (schoolClass && selectedClassId && selectedDate) {
      const map = new Map<string, boolean>()
      for (const student of schoolClass.students) {
        const record = existingAttendance?.find((a) => a.studentId === student.id)
        map.set(student.id, record ? record.present : true)
      }
      setAttendanceMap(map)
    }
  }, [existingAttendance, schoolClass, selectedClassId, selectedDate])

  function toggleAttendance(studentId: string) {
    setAttendanceMap((prev) => {
      const next = new Map(prev)
      next.set(studentId, !prev.get(studentId))
      return next
    })
  }

  async function handleSave() {
    if (!selectedClassId || !selectedDate) return
    const attendances = Array.from(attendanceMap.entries()).map(([studentId, present]) => ({
      studentId,
      present,
    }))
    try {
      await registerBulk.mutateAsync({ classId: selectedClassId, date: selectedDate, attendances })
      toast.success('Frequência registrada com sucesso')
    } catch (err: unknown) {
      console.error('Attendance save error:', err)
      const msg = err instanceof Error ? err.message : 'Erro ao registrar frequência'
      toast.error(msg)
    }
  }

  const students = schoolClass?.students ?? []
  const absentCount = Array.from(attendanceMap.values()).filter((v) => !v).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma turma" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma data" />
            </SelectTrigger>
            <SelectContent>
              {dateOptions.map((d) => (
                <SelectItem key={d} value={d}>
                  {new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {students.length > 0 && (
        <>
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
                    <th
                      className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      Aluno
                    </th>
                    <th
                      className="text-center px-5 py-3 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const isPresent = attendanceMap.get(s.id) ?? true
                    return (
                      <tr
                        key={s.id}
                        className="transition-colors duration-150 hover:bg-accent"
                        style={{ borderBottom: '1px solid hsl(var(--border))' }}
                      >
                        <td className="px-5 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                          {s.name}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleAttendance(s.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                            style={{
                              background: isPresent
                                ? 'rgba(21, 128, 61, 0.10)'
                                : 'rgba(185, 28, 28, 0.10)',
                              color: isPresent ? '#22C55E' : '#EF4444',
                            }}
                          >
                            {isPresent ? '✓ Presente' : '✗ Ausente'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {absentCount} ausente{absentCount !== 1 ? 's' : ''} de {students.length} alunos
            </span>
            <Button onClick={handleSave} disabled={registerBulk.isPending}>
              {registerBulk.isPending ? 'Salvando...' : 'Salvar frequência'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export function AttendancePage() {
  const { payload } = useAuth()
  const { data, isLoading } = useTeacherDashboard()

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
            Frequência
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Registro e resumo de frequência — {payload?.name}
          </p>
        </div>
      </div>

      {/* Section: Registro de Frequência */}
      <section className="space-y-4">
        <SectionHeader title="Registro de Frequência" subtitle="Selecione a turma e data para registrar" />
        <AttendanceForm classes={data.classes} />
      </section>
    </div>
  )
}
