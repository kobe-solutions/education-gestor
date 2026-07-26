import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ArrowLeft,
  Check,
  X,
  Calendar,
  Users,
  TrendingUp,
  ArrowDown,
  ArrowUp,
  Download,
  Search,
  CheckCheck,
  XCircle,
  Keyboard,
  Info,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { useTeacherDashboard, type TeacherClass, type AttendanceSummaryEntry } from '../hooks/useTeacherDashboard'
import { useClass } from '../../classes/hooks/useClasses'
import { useClassAttendance, useRegisterBulkAttendance } from '../../academic/hooks/useAcademic'
import { useAuth } from '../../../contexts/AuthContext'
import { Skeleton } from '../../../components/ui/skeleton'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs'
import { Switch } from '../../../components/ui/switch'
import { Input } from '../../../components/ui/input'
import { toast } from '../../../lib/toast'
import { parseLocalDate, formatDateBR } from '../../../lib/format'
import { cn } from '../../../lib/utils'

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getAvatarColor(name: string) {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981',
    '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
    '#EC4899', '#D946EF',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function formatWeekday(dateStr: string) {
  const date = parseLocalDate(dateStr)
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

// ── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <h2 className="font-semibold text-base" style={{ color: 'hsl(var(--foreground))' }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="mt-2 sm:mt-0">{action}</div>}
    </div>
  )
}

// ── Stats Card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  trend = 'neutral',
  tone = 'primary',
}: {
  label: string
  value: string | number
  change?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'neutral'
  tone?: 'primary' | 'success' | 'destructive' | 'amber'
}) {
  const toneStyles = {
    primary: { bg: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' },
    success: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' },
    destructive: { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' },
    amber: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' },
  }

  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-rose-600 dark:text-rose-400',
    neutral: 'text-muted-foreground',
  }
  const trendIcons = {
    up: ArrowUp,
    down: ArrowDown,
    neutral: null,
  }

  return (
    <Card size="sm" className="flex-1 min-w-35">
      <CardContent className="pt-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {label}
            </p>
            <p className="mt-1 font-bold text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {value}
            </p>
            {change && (
              <div className="flex items-center gap-1 mt-1" style={{ color: trendColors[trend] }}>
                {(() => {
                  const TrendIcon = trendIcons[trend]
                  return TrendIcon ? <TrendIcon className="size-3" /> : null
                })()}
                <span className="text-xs font-medium">{change}</span>
              </div>
            )}
          </div>
          <div
            className="shrink-0 p-2.5 rounded-xl flex items-center justify-center"
            style={{ background: toneStyles[tone].bg, color: toneStyles[tone].color }}
          >
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Keyboard Shortcuts Legend Bar ──────────────────────────────────────────

function KeyboardShortcutBar() {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="rounded-xl border p-3 bg-card text-card-foreground text-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Keyboard className="size-4 text-primary" />
          <span>Atalhos de Teclado Disponíveis</span>
        </div>
        <Button variant="ghost" size="xs" onClick={() => setShowHelp(!showHelp)}>
          <Info className="size-3.5 mr-1" />
          {showHelp ? 'Ocultar' : 'Ver Atalhos'}
        </Button>
      </div>

      {showHelp && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t text-[11px]">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-muted rounded border font-mono">↑ / ↓</kbd>
            <span className="text-muted-foreground">Navegar alunos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-muted rounded border font-mono">P</kbd>
            <span className="text-muted-foreground">Marcar Presente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-muted rounded border font-mono">A / F</kbd>
            <span className="text-muted-foreground">Marcar Ausente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-muted rounded border font-mono">Espaço</kbd>
            <span className="text-muted-foreground">Alternar status</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-muted rounded border font-mono">Ctrl+S</kbd>
            <span className="text-muted-foreground">Salvar frequência</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Attendance Form (Registro) ─────────────────────────────────────────────

interface AttendanceFormProps {
  classes: TeacherClass[]
}

function AttendanceForm({ classes }: AttendanceFormProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedClassId = searchParams.get('class') ?? classes[0]?.id ?? ''
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const selectedDate = searchParams.get('date') ?? today
  const [attendanceMap, setAttendanceMap] = useState<Map<string, boolean>>(new Map())
  const searchQuery = searchParams.get('student') ?? ''
  const filterMode = (searchParams.get('filter') as 'all' | 'present' | 'absent') ?? 'all'
  const [focusedIndex, setFocusedIndex] = useState<number>(0)

  const { data: schoolClass, isLoading: isClassLoading } = useClass(selectedClassId)
  const { data: existingAttendance } = useClassAttendance(selectedClassId, selectedDate)
  const registerBulk = useRegisterBulkAttendance()

  const classMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of classes) map[c.id] = c.name
    return map
  }, [classes])

  const dateOptions = useMemo(() => {
    const base = new Date()
    const dates: string[] = []
    let daysBack = 0
    while (dates.length < 8) {
      const d = new Date(base.getTime() - daysBack * 24 * 60 * 60 * 1000)
      if (d.getDay() !== 0) dates.push(d.toISOString().slice(0, 10))
      daysBack++
    }
    return dates
  }, [])

  const dateLabels = useMemo(() => {
    const map: Record<string, string> = {}
    for (const d of dateOptions) map[d] = formatWeekday(d)
    return map
  }, [dateOptions])

  useEffect(() => {
    if (schoolClass && selectedClassId && selectedDate) {
      const map = new Map<string, boolean>()
      for (const student of schoolClass.students) {
        const record = existingAttendance?.find((a) => a.studentId === student.id)
        map.set(student.id, record ? record.present : true)
      }
      setAttendanceMap(map)
      setFocusedIndex(0)
    }
  }, [existingAttendance, schoolClass, selectedClassId, selectedDate])

  const toggleAttendance = useCallback((studentId: string) => {
    setAttendanceMap((prev) => {
      const next = new Map(prev)
      next.set(studentId, !prev.get(studentId))
      return next
    })
  }, [])

  const setStudentStatus = useCallback((studentId: string, present: boolean) => {
    setAttendanceMap((prev) => {
      const next = new Map(prev)
      next.set(studentId, present)
      return next
    })
  }, [])

  const handleSave = useCallback(() => {
    if (!selectedClassId || !selectedDate) return
    const attendances = Array.from(attendanceMap.entries()).map(([studentId, present]) => ({
      studentId,
      present,
    }))
    registerBulk.mutate(
      { classId: selectedClassId, date: selectedDate, attendances },
      { onSuccess: () => toast.success('Frequência registrada com sucesso!') },
    )
  }, [selectedClassId, selectedDate, attendanceMap, registerBulk])

  const markAllPresent = useCallback(() => {
    if (!schoolClass) return
    const next = new Map<string, boolean>()
    schoolClass.students.forEach((s) => next.set(s.id, true))
    setAttendanceMap(next)
  }, [schoolClass])

  const markAllAbsent = useCallback(() => {
    if (!schoolClass) return
    const next = new Map<string, boolean>()
    schoolClass.students.forEach((s) => next.set(s.id, false))
    setAttendanceMap(next)
  }, [schoolClass])

  const invertSelection = useCallback(() => {
    if (!schoolClass) return
    setAttendanceMap((prev) => {
      const next = new Map<string, boolean>()
      schoolClass.students.forEach((s) => {
        next.set(s.id, !prev.get(s.id))
      })
      return next
    })
  }, [schoolClass])

  const students = schoolClass?.students ?? []
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase())
      const isPresent = attendanceMap.get(s.id) ?? true
      if (filterMode === 'present') return matchesSearch && isPresent
      if (filterMode === 'absent') return matchesSearch && !isPresent
      return matchesSearch
    })
  }, [students, searchQuery, filterMode, attendanceMap])

  const absentCount = Array.from(attendanceMap.values()).filter((v) => !v).length
  const presentCount = students.length - absentCount
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0

  // ── Keyboard Shortcuts ───────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isInput = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLSelectElement || activeElement instanceof HTMLTextAreaElement

      // Save shortcut: Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
        return
      }

      if (isInput || filteredStudents.length === 0) return

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        setFocusedIndex((prev) => Math.min(prev + 1, filteredStudents.length - 1))
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        setFocusedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        const student = filteredStudents[focusedIndex]
        if (student) setStudentStatus(student.id, true)
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        const student = filteredStudents[focusedIndex]
        if (student) setStudentStatus(student.id, false)
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        const student = filteredStudents[focusedIndex]
        if (student) toggleAttendance(student.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredStudents, focusedIndex, setStudentStatus, toggleAttendance, handleSave])

  if (classes.length === 0) {
    return (
      <Card className="py-12 text-center">
        <CardContent>
          <Users className="mx-auto size-12 text-muted-foreground" />
          <p className="mt-4 text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Nenhuma turma atribuída ao seu perfil.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Keyboard shortcut bar */}
      <KeyboardShortcutBar />

      {/* Class & Date Selection */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader
            title="Selecionar Turma e Data"
            subtitle="Escolha a turma e a data de aula para efetuar o lançamento de frequência"
          />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Turma
              </label>
              <Select value={selectedClassId} onValueChange={(v) =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev)
                  if (!v) next.delete('class')
                  else next.set('class', v)
                  return next
                })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma turma">
                    {selectedClassId ? classMap[selectedClassId] : ''}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.studentCount} alunos)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Data de Aula
              </label>
              <Select value={selectedDate} onValueChange={(v) =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev)
                  if (!v || v === today) next.delete('date')
                  else next.set('date', v)
                  return next
                })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma data">
                    {selectedDate ? dateLabels[selectedDate] : ''}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {dateOptions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {formatWeekday(d)} {d === today ? '(Hoje)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {students.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Presentes"
            value={presentCount}
            icon={CheckCheck}
            trend="up"
            tone="success"
            change={`${presentCount} de ${students.length} alunos`}
          />
          <StatCard
            label="Ausentes"
            value={absentCount}
            icon={XCircle}
            trend="down"
            tone={absentCount > 0 ? 'destructive' : 'primary'}
            change={absentCount > 0 ? `${absentCount} ausência(s)` : 'Nenhuma ausência'}
          />
          <StatCard
            label="Taxa de Frequência"
            value={`${attendanceRate}%`}
            icon={TrendingUp}
            trend={attendanceRate >= 75 ? 'up' : 'down'}
            tone={attendanceRate >= 75 ? 'success' : 'amber'}
            change={attendanceRate >= 75 ? 'Mínimo atingido (75%)' : 'Abaixo do mínimo'}
          />
        </div>
      )}

      {/* Student List Card */}
      {isClassLoading ? (
        <Card className="p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      ) : students.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              title="Lista de Alunos"
              subtitle={`Mostrando ${filteredStudents.length} de ${students.length} alunos`}
              action={
                <div className="flex gap-1.5 flex-wrap">
                  <Button variant="outline" size="xs" onClick={markAllPresent}>
                    <Check className="size-3.5 mr-1" />
                    Todos Presentes
                  </Button>
                  <Button variant="outline" size="xs" onClick={markAllAbsent}>
                    <X className="size-3.5 mr-1" />
                    Todos Ausentes
                  </Button>
                  <Button variant="ghost" size="xs" onClick={invertSelection} title="Inverter seleção">
                    <RotateCcw className="size-3.5 mr-1" />
                    Inverter
                  </Button>
                </div>
              }
            />
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome do aluno..."
                  value={searchQuery}
                  onChange={(e) => setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!e.target.value) next.delete('student'); else next.set('student', e.target.value); return next })}
                  className="pl-8 h-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-1 w-full sm:w-auto">
                <Button
                  variant={filterMode === 'all' ? 'secondary' : 'ghost'}
                  size="xs"
                  onClick={() => setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete('filter'); return next })}
                >
                  Todos ({students.length})
                </Button>
                <Button
                  variant={filterMode === 'present' ? 'secondary' : 'ghost'}
                  size="xs"
                  onClick={() => setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('filter', 'present'); return next })}
                  className="text-emerald-600 dark:text-emerald-400"
                >
                  Presentes ({presentCount})
                </Button>
                <Button
                  variant={filterMode === 'absent' ? 'secondary' : 'ghost'}
                  size="xs"
                  onClick={() => setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('filter', 'absent'); return next })}
                  className="text-rose-600 dark:text-rose-400"
                >
                  Ausentes ({absentCount})
                </Button>
              </div>
            </div>

            {/* Students Table */}
            {filteredStudents.length === 0 ? (
              <div className="py-10 text-center border rounded-xl bg-muted/20">
                <Search className="mx-auto size-10 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {searchQuery ? 'Nenhum aluno encontrado para essa busca.' : 'Nenhum aluno nesta categoria.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-xl">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nome do Aluno</TableHead>
                      <TableHead className="text-center w-36">Frequência</TableHead>
                      <TableHead className="text-right w-28">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student, index) => {
                      const isPresent = attendanceMap.get(student.id) ?? true
                      const isFocused = focusedIndex === index

                      return (
                        <TableRow
                          key={student.id}
                          onClick={() => setFocusedIndex(index)}
                          className={cn(
                            'cursor-pointer transition-colors duration-150',
                            isFocused && 'ring-2 ring-primary/40 bg-primary/5',
                            !isPresent && 'bg-rose-500/5 dark:bg-rose-950/10',
                          )}
                        >
                          <TableCell className="text-muted-foreground font-mono text-xs">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm"
                              style={{ background: getAvatarColor(student.name) }}
                            >
                              {getInitials(student.name)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                            <div className="flex items-center gap-2">
                              <span>{student.name}</span>
                              {isFocused && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                                  Foco
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={isPresent ? 'success' : 'danger'}
                              className="cursor-pointer font-medium"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleAttendance(student.id)
                              }}
                            >
                              {isPresent ? 'Presente' : 'Ausente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Switch
                              checked={isPresent}
                              onCheckedChange={() => toggleAttendance(student.id)}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={isPresent ? 'Marcar como ausente' : 'Marcar como presente'}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              Total: {presentCount} presente(s) · {absentCount} ausente(s)
            </span>
            <Button onClick={handleSave} disabled={registerBulk.isPending} size="sm">
              <Check className="size-4 mr-1.5" />
              {registerBulk.isPending ? 'Salvando...' : 'Salvar Frequência (Ctrl+S)'}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="py-12 text-center">
          <CardContent>
            <Users className="mx-auto size-12 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Esta turma não possui alunos cadastrados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Attendance Summary (Resumo) ────────────────────────────────────────────

interface AttendanceSummaryProps {
  classes: TeacherClass[]
  attendanceSummary: AttendanceSummaryEntry[]
}

function AttendanceSummary({ classes, attendanceSummary }: AttendanceSummaryProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedClassId = searchParams.get('class') ?? classes[0]?.id ?? ''

  const classMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of classes) map[c.id] = c.name
    return map
  }, [classes])

  const summary = attendanceSummary.find((s) => s.classId === selectedClassId)

  if (classes.length === 0) {
    return (
      <Card className="py-12 text-center">
        <CardContent>
          <Users className="mx-auto size-12 text-muted-foreground" />
          <p className="mt-4 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Nenhuma turma atribuída a você
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalRecords = summary?.totalRecords ?? 0
  const absentCount = summary?.absentCount ?? 0
  const presentCount = totalRecords - absentCount
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Class Selector */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader title="Selecionar Turma" subtitle="Escolha a turma para visualizar o histórico consolidado" />
        </CardHeader>
        <CardContent className="pt-0">
          <Select value={selectedClassId} onValueChange={(v) =>
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              if (!v) next.delete('class')
              else next.set('class', v)
              return next
            })
          }>
            <SelectTrigger className="w-full sm:w-75">
              <SelectValue placeholder="Selecione uma turma">
                {selectedClassId ? classMap[selectedClassId] : ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.studentCount} alunos)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {summary ? (
        <>
          {/* Summary Stats Grid */}
          <div className="grid gap-3 sm:grid-cols-4">
            <StatCard
              label="Total de Registros"
              value={totalRecords}
              icon={Calendar}
              tone="primary"
            />
            <StatCard
              label="Presenças"
              value={presentCount}
              icon={CheckCheck}
              trend="up"
              tone="success"
            />
            <StatCard
              label="Ausências"
              value={absentCount}
              icon={XCircle}
              trend="down"
              tone={absentCount > 0 ? 'destructive' : 'primary'}
            />
            <StatCard
              label="Taxa de Frequência"
              value={`${attendanceRate}%`}
              icon={TrendingUp}
              trend={attendanceRate >= 75 ? 'up' : 'down'}
              tone={attendanceRate >= 75 ? 'success' : 'amber'}
              change={attendanceRate >= 75 ? 'Dentro da meta' : 'Requer atenção'}
            />
          </div>

          {/* Visual Progress Bar Card */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Indicador de Frequência da Turma</span>
                <span>{attendanceRate}% de presença geral</span>
              </div>
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${attendanceRate}%` }}
                />
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${100 - attendanceRate}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2 rounded-full bg-emerald-500" />
                  Presenças: {presentCount}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2 rounded-full bg-rose-500" />
                  Ausências: {absentCount}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Dates Table */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader
                title="Histórico de Aulas Registradas"
                subtitle="Datas de aula registradas recentemente"
                action={
                  <Button variant="outline" size="xs">
                    <Download className="size-3.5 mr-1.5" />
                    Exportar Relatório
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="pt-0">
              {summary.recentDates.length === 0 ? (
                <div className="py-8 text-center border rounded-xl bg-muted/20">
                  <Calendar className="mx-auto size-10 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Nenhum registro de frequência encontrado para esta turma.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-xl">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data da Aula</TableHead>
                        <TableHead className="text-right">Total Alunos</TableHead>
                        <TableHead className="text-right">Presentes</TableHead>
                        <TableHead className="text-right">Ausentes</TableHead>
                        <TableHead className="text-right">Taxa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.recentDates
                        .slice()
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((entry) => {
                          const rate = entry.totalStudents > 0
                            ? Math.round(((entry.totalStudents - entry.absentCount) / entry.totalStudents) * 100)
                            : 0
                          return (
                            <TableRow key={entry.date}>
                              <TableCell className="font-medium">
                                {formatDateBR(entry.date)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {entry.totalStudents}
                              </TableCell>
                              <TableCell className="text-right text-emerald-600 font-semibold dark:text-emerald-400">
                                {entry.totalStudents - entry.absentCount}
                              </TableCell>
                              <TableCell className="text-right text-rose-600 font-semibold dark:text-rose-400">
                                {entry.absentCount}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant={rate >= 75 ? 'success' : rate >= 50 ? 'warning' : 'danger'}
                                >
                                  {rate}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="py-12 text-center">
          <CardContent>
            <Calendar className="mx-auto size-12 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Selecione uma turma para visualizar o histórico de frequência.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function AttendancePage() {
  const { payload } = useAuth()
  const { data, isLoading, isError, error } = useTeacherDashboard()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'registro'

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Link
            to="/professor"
            className="flex items-center justify-center rounded-md w-8 h-8 transition-colors shrink-0 hover:bg-primary/10"
            title="Voltar"
          >
            <ArrowLeft size={16} style={{ color: 'hsl(var(--foreground))' }} />
          </Link>
          <div className="flex-1 min-w-0">
            <Skeleton className="h-7 w-48 rounded-md" />
            <Skeleton className="mt-2 h-4 w-64 rounded-md" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Link
            to="/professor"
            className="flex items-center justify-center rounded-md w-8 h-8 transition-colors shrink-0 hover:bg-primary/10"
            title="Voltar"
          >
            <ArrowLeft size={16} style={{ color: 'hsl(var(--foreground))' }} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold leading-tight" style={{ fontSize: 22, color: 'hsl(var(--foreground))' }}>
              Frequência
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Registro e resumo de frequência — {payload?.name}
            </p>
          </div>
        </div>
        <Card className="border-destructive/50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto size-12 text-destructive" />
            <p className="mt-4 text-sm font-medium text-destructive">
              Erro ao carregar dados: {error?.message ?? 'Erro desconhecido'}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
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
          className="flex items-center justify-center rounded-md w-8 h-8 transition-colors shrink-0 hover:bg-primary/10"
          title="Voltar"
        >
          <ArrowLeft size={16} style={{ color: 'hsl(var(--foreground))' }} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold leading-tight" style={{ fontSize: 22, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}>
            Frequência Escolar
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Lançamento rápido e resumo consolidado — {payload?.name}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={tab}
        onValueChange={(v) =>
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.set('tab', v)
            return next
          })
        }
        className="w-full"
      >
        <TabsList className="w-full bg-background border border-border p-1" aria-label="Abas de frequência">
          <TabsTrigger value="registro">
            <Calendar className="size-4 mr-1" />
            Registro de Frequência
          </TabsTrigger>
          <TabsTrigger value="resumo">
            <TrendingUp className="size-4 mr-1" />
            Resumo & Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registro" className="mt-4 animate-in fade-in-0 zoom-in-95 duration-200">
          <AttendanceForm classes={data.classes} />
        </TabsContent>

        <TabsContent value="resumo" className="mt-4 animate-in fade-in-0 zoom-in-95 duration-200">
          <AttendanceSummary classes={data.classes} attendanceSummary={data.attendanceSummary} />
        </TabsContent>
      </Tabs>
    </div>
  )
}