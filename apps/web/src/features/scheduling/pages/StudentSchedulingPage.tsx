import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { GripVertical, X, Search, Users, AlertTriangle } from 'lucide-react'
import type { AxiosError } from 'axios'
import { useStudents } from '../../students/hooks/useStudents'
import { useClasses, useClass } from '../../classes/hooks/useClasses'
import { api } from '../../../lib/api'
import { toast } from '../../../lib/toast'
import { Input } from '../../../components/ui/input'
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

const SHIFT_LABELS: Record<string, { label: string; badge: string }> = {
  manha:    { label: 'Manhã',    badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  tarde:    { label: 'Tarde',    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  noite:    { label: 'Noite',    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  integral: { label: 'Integral', badge: 'bg-green-500/10 text-green-400 border-green-500/30' },
}

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

// ─── Componente: Pílula de aluno matriculado ──────────────────────────────────

function EnrolledPill({
  student,
  colorIndex,
  onRemove,
}: {
  student: { id: string; name: string; enrollmentCode: string }
  colorIndex: number
  onRemove: () => void
}) {
  const color = STUDENT_COLORS[colorIndex]
  return (
    <div className={`group flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium ${color.light}`}>
      <div className={`h-5 w-5 rounded-full ${color.bg} flex items-center justify-center shrink-0`}>
        <span className="text-[9px] font-bold text-white">{initials(student.name)}</span>
      </div>
      <span className="flex-1 truncate" style={{ maxWidth: 100 }}>{student.name}</span>
      <button
        onClick={onRemove}
        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-red-600"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

// ─── Componente: Coluna de turma ──────────────────────────────────────────────

function ClassColumn({
  schoolClass,
  selectedStudent,
  studentColorMap,
  onDrop,
  onRemoveStudent,
}: {
  schoolClass: {
    id: string
    name: string
    shift: string
    maxStudents: number
    studentCount?: number
    serie: { name: string } | null
  }
  selectedStudent: { id: string; name: string } | null
  studentColorMap: Record<string, number>
  onDrop: (classId: string, studentId: string, studentName: string) => void
  onRemoveStudent: (classId: string, studentId: string) => void
}) {
  const [dragOver, setDragOver] = useState(false)
  const dragCounter = useRef(0)

  const { data: classDetail } = useClass(schoolClass.id)
  const enrolled = classDetail?.students ?? []
  const count = enrolled.length
  const max = schoolClass.maxStudents
  const isFull = count >= max
  const fillPct = Math.min(100, Math.round((count / max) * 100))

  const shiftInfo = SHIFT_LABELS[schoolClass.shift?.toLowerCase()] ?? {
    label: schoolClass.shift,
    badge: 'bg-muted text-muted-foreground border-border',
  }

  return (
    <div
      className={[
        'flex flex-col rounded-2xl border-2 transition-all duration-150 shrink-0 w-64 h-full',
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
        if (studentId) onDrop(schoolClass.id, studentId, studentName)
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
              <span className={`text-[10px] border rounded px-1.5 py-0.5 font-medium ${shiftInfo.badge}`}>
                {shiftInfo.label}
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

      {/* Drop zone hints */}
      {dragOver && !isFull && (
        <div className="mx-3 mb-2 rounded-xl border-2 border-dashed border-primary/50 bg-primary/10 py-3 text-center">
          <p className="text-xs font-medium text-primary">Soltar para matricular</p>
        </div>
      )}
      {dragOver && isFull && (
        <div className="mx-3 mb-2 rounded-xl border-2 border-dashed border-destructive/50 bg-destructive/10 py-3 text-center">
          <p className="text-xs font-medium text-destructive flex items-center justify-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Turma lotada
          </p>
        </div>
      )}

      {/* Alunos matriculados */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1 min-h-0">
        {enrolled.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center py-4">Nenhum aluno matriculado</p>
        ) : (
          enrolled.map((s) => (
            <EnrolledPill
              key={s.id}
              student={s}
              colorIndex={studentColorMap[s.id] ?? getColorIdx(s.name)}
              onRemove={() => onRemoveStudent(schoolClass.id, s.id)}
            />
          ))
        )}
      </div>

      {/* Botão rápido quando aluno selecionado */}
      {selectedStudent && !isFull && (
        <div className="p-3 pt-1 border-t">
          <button
            onClick={() => onDrop(schoolClass.id, selectedStudent.id, selectedStudent.name)}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium border-2 border-dashed border-primary text-primary hover:bg-primary/10 transition-all"
          >
            Matricular {selectedStudent.name.split(' ')[0]}
          </button>
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

  const [studentSearch, setStudentSearch] = useState('')
  const [classSearch, setClassSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null)
  const [enrolling, setEnrolling] = useState(false)

  const studentColorMap: Record<string, number> = Object.fromEntries(
    students.map((s) => [s.id, getColorIdx(s.name)])
  )

  const filteredStudents = students.filter((s) =>
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

  async function handleRemoveStudent(classId: string, studentId: string) {
    try {
      await api.delete(`/school-classes/${classId}/students/${studentId}`)
      toast.success('Aluno removido da turma')
      queryClient.invalidateQueries({ queryKey: ['classes', classId] })
    } catch {
      toast.error('Erro ao remover aluno')
    }
  }

  async function confirmEnroll() {
    if (!confirmTarget) return
    setEnrolling(true)
    try {
      await api.post(`/school-classes/${confirmTarget.classId}/students`, { id: confirmTarget.studentId })
      toast.success(`${confirmTarget.studentName} matriculado em ${confirmTarget.className}`)
      queryClient.invalidateQueries({ queryKey: ['classes', confirmTarget.classId] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setSelectedStudent(null)
    } catch (err) {
      const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message
      if (msg === 'Class is full') toast.error('Turma lotada — limite máximo atingido')
      else if (msg === 'Student already in class') toast.error('Aluno já está nesta turma')
      else toast.error(msg ?? 'Erro ao matricular')
    } finally {
      setEnrolling(false)
      setConfirmTarget(null)
    }
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-4 overflow-hidden min-w-0">

      {/* ── Sidebar: Alunos ──────────────────────────────────────────────── */}
      <aside className="flex flex-col gap-3 w-72 shrink-0">
        <div>
          <h2 className="text-base font-semibold">Alunos</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Arraste ou clique para selecionar</p>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {selectedStudent && (
          <div className="flex items-center justify-between rounded-md bg-primary/10 border border-primary/30 px-3 py-1.5">
            <span className="text-xs font-medium text-primary">
              {selectedStudent.name.split(' ')[0]} selecionado
            </span>
            <button onClick={() => setSelectedStudent(null)} className="text-primary hover:opacity-70">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredStudents.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhum aluno encontrado</p>
          )}
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              colorIdx={studentColorMap[student.id] ?? 0}
              isSelected={selectedStudent?.id === student.id}
              onSelect={() =>
                setSelectedStudent((prev) =>
                  prev?.id === student.id ? null : { id: student.id, name: student.name }
                )
              }
            />
          ))}
        </div>

        <div className="pt-2 border-t">
          <p className="text-[10px] text-muted-foreground">
            <span className="font-medium">{students.length}</span> alunos cadastrados
          </p>
        </div>
      </aside>

      {/* ── Main: Kanban ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 gap-3 overflow-hidden">
        <div className="flex items-center gap-3 shrink-0">
          <div>
            <h2 className="text-base font-semibold">Turmas</h2>
            <p className="text-[11px] text-muted-foreground">
              Arraste um aluno até a turma para matricular
            </p>
          </div>
          <div className="ml-auto relative w-52">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filtrar turmas..."
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {filteredClasses.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhuma turma cadastrada</p>
          </div>
        ) : (
          <div className="flex-1 flex gap-4 overflow-auto pb-4 items-stretch">
            {filteredClasses.map((schoolClass) => (
              <ClassColumn
                key={schoolClass.id}
                schoolClass={schoolClass as any}
                selectedStudent={selectedStudent}
                studentColorMap={studentColorMap}
                onDrop={handleDrop}
                onRemoveStudent={handleRemoveStudent}
              />
            ))}
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
    </div>
  )
}
