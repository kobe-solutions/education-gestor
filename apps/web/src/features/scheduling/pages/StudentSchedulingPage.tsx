import { useState, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { GripVertical, X, Users, AlertTriangle } from 'lucide-react'
import { extractErrorMessage } from '../../../lib/errors'
import { useStudents } from '../../students/hooks/useStudents'
import { useClasses, useUnenrollStudent } from '../../classes/hooks/useClasses'
import { api } from '../../../lib/api'
import { toast } from '../../../lib/toast'
import { SearchInput } from '../../../components/SearchInput'
import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog'

// ─── Utilidades ───────────────────────────────────────────────────────────────

const STUDENT_COLORS = [
  { bg: 'bg-blue-500', light: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  { bg: 'bg-violet-500', light: 'bg-violet-500/10 border-violet-500/30 text-violet-400' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  { bg: 'bg-orange-500', light: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
  { bg: 'bg-pink-500', light: 'bg-pink-500/10 border-pink-500/30 text-pink-400' },
  { bg: 'bg-teal-500', light: 'bg-teal-500/10 border-teal-500/30 text-teal-400' },
  { bg: 'bg-red-500', light: 'bg-red-500/10 border-red-500/30 text-red-400' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' },
  { bg: 'bg-amber-500', light: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' },
]

function getColorIdx(name: string) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return Math.abs(hash) % STUDENT_COLORS.length
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

import { SHIFT_LABELS, SHIFT_BADGE_CLASSES } from '../../../lib/labels'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ConfirmTarget {
  classId: string
  studentId: string
  studentName: string
  className: string
}

// ─── Componente: Card de aluno (sidebar) ──────────────────────────────────────

interface StudentCardProps {
  student: { id: string; name: string; enrollmentCode: string }
  colorIdx: number
  isSelected: boolean
  onSelect: () => void
}

function StudentCard({ student, colorIdx, isSelected, onSelect }: StudentCardProps) {
  const color = STUDENT_COLORS[colorIdx]
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.setData('studentId', student.id)
        e.dataTransfer.setData('studentName', student.name)
      }}
      onClick={onSelect}
      className={[
        'group flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-grab active:cursor-grabbing transition-all duration-150 select-none',
        isSelected
          ? 'border-2 ring-2 ring-offset-1 ring-primary bg-card shadow-md border-primary'
          : 'border-border bg-card hover:shadow-sm hover:border-muted-foreground/30',
      ].join(' ')}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
      <div className={`h-9 w-9 rounded-full ${color.bg} flex items-center justify-center shrink-0 shadow-sm`}>
        <span className="text-xs font-bold text-white">{initials(student.name)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">{student.name}</p>
        <p className="text-[11px] text-muted-foreground">{student.enrollmentCode}</p>
      </div>
    </div>
  )
}

// ─── Componente: Card de turma (Kanban) ───────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
  'bg-amber-500', 'bg-cyan-500',
]

const MAX_VISIBLE_AVATARS = 8

function ClassCard({
  schoolClass,
  enrolledStudents,
  selectedStudent,
  onDrop,
}: {
  schoolClass: {
    id: string
    name: string
    shift: string
    maxStudents: number
    studentCount?: number
    serie: { name: string } | null
  }
  enrolledStudents: { id: string; name: string }[]
  selectedStudent: { id: string; name: string } | null
  onDrop: (classId: string, studentId: string, studentName: string) => void
}) {
  const [dragOver, setDragOver] = useState(false)
  const [justReceived, setJustReceived] = useState(false)
  const dragCounter = useRef(0)

  function triggerReceiveAnimation() {
    setJustReceived(true)
    setTimeout(() => setJustReceived(false), 500)
  }

  const enrolled = enrolledStudents
  const count = enrolled.length
  const max = schoolClass.maxStudents
  const isFull = count >= max
  const fillPct = Math.min(100, Math.round((count / max) * 100))
  const overflow = count - MAX_VISIBLE_AVATARS

  const shiftKey = schoolClass.shift?.toLowerCase() ?? ''
  const shiftLabel = SHIFT_LABELS[shiftKey] ?? schoolClass.shift
  const shiftBadge = SHIFT_BADGE_CLASSES[shiftKey] ?? 'bg-muted text-muted-foreground border-border'

  return (
    <div
      className={[
        'flex flex-col rounded-2xl border-2 transition-all duration-150 w-full',
        justReceived && 'animate-card-receive',
        dragOver && !isFull
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20 scale-[1.02]'
          : isFull
          ? 'border-destructive/30 bg-destructive/5'
          : 'border-border bg-muted/20',
      ].join(' ')}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => {
        e.preventDefault()
        dragCounter.current++
        setDragOver(true)
      }}
      onDragLeave={() => {
        dragCounter.current--
        if (dragCounter.current === 0) setDragOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        dragCounter.current = 0
        setDragOver(false)
        const studentId = e.dataTransfer.getData('studentId')
        const studentName = e.dataTransfer.getData('studentName')
        if (studentId) {
          triggerReceiveAnimation()
          onDrop(schoolClass.id, studentId, studentName)
        }
      }}
    >
      {/* Header */}
      <div className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{schoolClass.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {schoolClass.serie && (
                <span className="text-[10px] text-muted-foreground">{schoolClass.serie.name}</span>
              )}
              <span className={`text-[10px] border rounded px-1.5 py-0.5 font-medium ${shiftBadge}`}>
                {shiftLabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className={`text-xs font-semibold ${isFull ? 'text-destructive' : 'text-muted-foreground'}`}>
              {count}/{max}
            </span>
          </div>
        </div>

        {/* Barra de capacidade */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              fillPct >= 100 ? 'bg-destructive' : fillPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* Drop zone hint */}
      {dragOver && !isFull && (
        <div className="mx-3 mb-2 rounded-xl border-2 border-dashed border-primary/50 bg-primary/10 py-2 text-center">
          <p className="text-xs font-medium text-primary">Soltar para matricular</p>
        </div>
      )}
      {dragOver && isFull && (
        <div className="mx-3 mb-2 rounded-xl border-2 border-dashed border-destructive/50 bg-destructive/10 py-2 text-center">
          <p className="text-xs font-medium text-destructive flex items-center justify-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Turma lotada
          </p>
        </div>
      )}

      {/* Avatares compactos dos alunos matriculados */}
      {enrolled.length > 0 && !dragOver && (
        <div className="px-3 pb-3 flex items-center">
          <div className="flex -space-x-2">
            {enrolled.slice(0, MAX_VISIBLE_AVATARS).map((s, i) => (
              <div
                key={s.id}
                className={`h-7 w-7 rounded-full ${AVATAR_COLORS[getColorIdx(s.name)]} flex items-center justify-center ring-2 ring-background`}
                title={s.name}
              >
                <span className="text-[8px] font-bold text-white">{initials(s.name)}</span>
              </div>
            ))}
          </div>
          {overflow > 0 && (
            <span className="ml-2 text-[11px] text-muted-foreground font-medium">+{overflow}</span>
          )}
        </div>
      )}

      {/* Botão rápido quando aluno selecionado */}
      {selectedStudent && !isFull && !dragOver && (
        <div className="px-3 pb-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center gap-1.5 py-1.5 text-xs font-medium border-dashed border-primary text-primary hover:bg-primary/10 transition-all"
            onClick={() => {
              triggerReceiveAnimation()
              onDrop(schoolClass.id, selectedStudent.id, selectedStudent.name)
            }}
          >
            Matricular {selectedStudent.name.split(' ')[0]}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function StudentSchedulingPage() {
  const queryClient = useQueryClient()
  const { data: studentsData } = useStudents()
  const students = studentsData?.data ?? []
  const { data: classes = [] } = useClasses()
  const unenrollMutation = useUnenrollStudent()

  const [searchParams, setSearchParams] = useSearchParams()
  const studentSearch = searchParams.get('student') ?? ''
  const classSearch = searchParams.get('class') ?? ''
  const selectedStudentId = searchParams.get('studentId')
  const selectedStudent: { id: string; name: string } | null = selectedStudentId
    ? (() => { const s = students.find((s) => s.id === selectedStudentId); return s ? { id: s.id, name: s.name } : null })()
    : null
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollmentConflict, setEnrollmentConflict] = useState<{
    studentId: string
    studentName: string
    currentClassName: string
    currentClassId: string
    targetClassId: string
    targetClassName: string
  } | null>(null)

  const enrolledStudentIds = new Set(
    classes.flatMap((c) => (c.students ?? []).map((s) => s.id))
  )

  const unenrolledStudents = students.filter((s) => enrolledStudentIds.has(s.id))

  const filteredStudents = unenrolledStudents.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.enrollmentCode.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(classSearch.toLowerCase())
  )

  function handleDrop(classId: string, studentId: string, studentName: string) {
    const schoolClass = classes.find((c) => c.id === classId)
    if (!schoolClass) return
    setConfirmTarget({ classId, studentId, studentName, className: schoolClass.name })
  }

  async function confirmEnroll() {
    if (!confirmTarget) return
    setEnrolling(true)
    try {
      await api.post(`/school-classes/${confirmTarget.classId}/students`, { id: confirmTarget.studentId })
      toast.success(`${confirmTarget.studentName} matriculado em ${confirmTarget.className}`)
      queryClient.invalidateQueries({ queryKey: ['classes', confirmTarget.classId] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete('studentId'); return next })
    } catch (err) {
      const msg = extractErrorMessage(err)
      if (msg === 'Class is full') toast.error('Turma lotada — limite máximo atingido')
      else if (msg === 'Student already in class') toast.error('Aluno já está nesta turma')
      else if (msg.startsWith('Student already enrolled in class')) {
        const classNameMatch = msg.match(/Student already enrolled in class (.+)/)
        const currentClassName = classNameMatch ? classNameMatch[1] : 'outra turma'
        const currentClass = classes.find((c) => c.name === currentClassName)
        setEnrollmentConflict({
          studentId: confirmTarget.studentId,
          studentName: confirmTarget.studentName,
          currentClassName,
          currentClassId: currentClass?.id ?? '',
          targetClassId: confirmTarget.classId,
          targetClassName: confirmTarget.className,
        })
      } else {
        toast.error(msg)
      }
    } finally {
      setEnrolling(false)
      setConfirmTarget(null)
    }
  }

  async function handleUnenrollAndReenroll() {
    if (!enrollmentConflict) return
    const { currentClassId, currentClassName, targetClassId, targetClassName, studentId, studentName } = enrollmentConflict
    try {
      await unenrollMutation.mutateAsync({ classId: currentClassId, studentId })
      toast.success(`${studentName} desmatriculado de ${currentClassName}`)
      await api.post(`/school-classes/${targetClassId}/students`, { id: studentId })
      toast.success(`${studentName} matriculado em ${targetClassName}`)
      queryClient.invalidateQueries({ queryKey: ['classes', targetClassId] })
      queryClient.invalidateQueries({ queryKey: ['classes', currentClassId] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete('studentId'); return next })
    } catch {
      toast.error('Erro ao desmatricular e matricular aluno')
    } finally {
      setEnrollmentConflict(null)
    }
  }

  return (
    <div className="grid h-[calc(100vh-5rem)] grid-cols-[288px_1fr] gap-4 overflow-hidden min-w-0">

      {/* ── Sidebar: Alunos ──────────────────────────────────────────────── */}
      <aside className="flex flex-col gap-3 min-h-0 overflow-hidden">
        <div>
          <h2 className="text-base font-semibold">Alunos</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Arraste ou clique para selecionar</p>
        </div>

        <div className="relative">
          <SearchInput
            value={studentSearch}
            onChange={(v) => setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!v) next.delete('student'); else next.set('student', v); return next })}
            placeholder="Buscar aluno..."
            className="h-8 text-sm"
          />
        </div>

        {selectedStudent && (
          <div className="flex items-center justify-between rounded-md bg-primary/10 border border-primary/30 px-3 py-1.5">
            <span className="text-xs font-medium text-primary">
              {selectedStudent.name.split(' ')[0]} selecionado
            </span>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-primary hover:opacity-70" onClick={() => setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete('studentId'); return next })}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
          {filteredStudents.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              {unenrolledStudents.length === 0
                ? 'Todos os alunos estão matriculados'
                : 'Nenhum aluno encontrado'}
            </p>
          )}
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              colorIdx={getColorIdx(student.name)}
              isSelected={selectedStudent?.id === student.id}
              onSelect={() =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev)
                  if (prev.get('studentId') === student.id) next.delete('studentId')
                  else next.set('studentId', student.id)
                  return next
                })
              }
            />
          ))}
        </div>

        <div className="pt-2 border-t">
          <p className="text-[10px] text-muted-foreground">
            <span className="font-medium">{unenrolledStudents.length}</span> alunos disponíveis
          </p>
        </div>
      </aside>

      {/* ── Main: Kanban ─────────────────────────────────────────────────── */}
      <div className="flex flex-col min-h-0 gap-3 overflow-hidden">
        <div className="flex items-center gap-3 shrink-0">
          <div>
            <h2 className="text-base font-semibold">Turmas</h2>
            <p className="text-[11px] text-muted-foreground">
              Arraste um aluno até a turma para matricular
            </p>
          </div>
          <div className="ml-auto w-52">
            <SearchInput
              value={classSearch}
              onChange={(v) => setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!v) next.delete('class'); else next.set('class', v); return next })}
              placeholder="Filtrar turmas..."
              className="h-8 text-sm"
            />
          </div>
        </div>

        {filteredClasses.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhuma turma cadastrada</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
              {filteredClasses.map((schoolClass) => (
                <ClassCard
                  key={schoolClass.id}
                  schoolClass={schoolClass as any}
                  enrolledStudents={(schoolClass as any).students ?? []}
                  selectedStudent={selectedStudent}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Dialog: Confirmar matrícula ───────────────────────────────────── */}
      <Dialog open={!!confirmTarget} onOpenChange={(v) => !v && setConfirmTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar matrícula</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Matricular{' '}
            <span className="font-medium text-foreground">{confirmTarget?.studentName}</span>
            {' '}na turma{' '}
            <span className="font-medium text-foreground">{confirmTarget?.className}</span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>Cancelar</Button>
            <Button onClick={confirmEnroll} disabled={enrolling}>
              {enrolling ? 'Matriculando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Conflito de matrícula ─────────────────────────────────── */}
      <Dialog open={!!enrollmentConflict} onOpenChange={(v) => !v && setEnrollmentConflict(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Aluno já matriculado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              O aluno{' '}
              <span className="font-medium text-foreground">{enrollmentConflict?.studentName}</span>
              {' '}já está matriculado na turma{' '}
              <span className="font-medium text-foreground">{enrollmentConflict?.currentClassName}</span>.
            </p>
            <p className="text-sm text-muted-foreground">
              Para matriculá-lo na turma{' '}
              <span className="font-medium text-foreground">{enrollmentConflict?.targetClassName}</span>,
              {' '}é necessário desvinculá-lo da turma atual primeiro.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollmentConflict(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnenrollAndReenroll}
              disabled={unenrollMutation.isPending}
            >
              {unenrollMutation.isPending ? 'Processando...' : 'Desvincular e Matricular'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
