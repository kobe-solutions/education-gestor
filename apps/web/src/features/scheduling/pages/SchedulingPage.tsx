import { useState, useRef } from 'react'
import { GripVertical, Plus, X, ChevronDown, ChevronUp, Search, Zap, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router'
import { PageHead } from '../../../components/PageHead'
import type { AxiosError } from 'axios'
import { useTeachers } from '../../teachers/hooks/useTeachers'
import { useClasses, useAcademicPeriods } from '../../classes/hooks/useClasses'
import { useSubjects } from '../../subjects/hooks/useSubjects'
import {
  useAllTimetableSlots,
  useCreateTimetableSlot,
  useDeleteTimetableSlot,
  WEEK_DAY_LABELS,
  WEEK_DAYS_ORDER,
} from '../../timetable/hooks/useTimetable'
import type { TimetableSlot } from '../../timetable/hooks/useTimetable'
import { toast } from '../../../lib/toast'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog'

// ─── Utilidades ───────────────────────────────────────────────────────────────

const TEACHER_COLORS = [
  { bg: 'bg-blue-500', light: 'bg-blue-500/10 border-blue-500/30 text-blue-400', ring: 'ring-blue-400' },
  { bg: 'bg-violet-500', light: 'bg-violet-500/10 border-violet-500/30 text-violet-400', ring: 'ring-violet-400' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', ring: 'ring-emerald-400' },
  { bg: 'bg-orange-500', light: 'bg-orange-500/10 border-orange-500/30 text-orange-400', ring: 'ring-orange-400' },
  { bg: 'bg-pink-500', light: 'bg-pink-500/10 border-pink-500/30 text-pink-400', ring: 'ring-pink-400' },
  { bg: 'bg-teal-500', light: 'bg-teal-500/10 border-teal-500/30 text-teal-400', ring: 'ring-teal-400' },
  { bg: 'bg-red-500', light: 'bg-red-500/10 border-red-500/30 text-red-400', ring: 'ring-red-400' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400', ring: 'ring-indigo-400' },
  { bg: 'bg-amber-500', light: 'bg-amber-500/10 border-amber-500/30 text-amber-400', ring: 'ring-amber-400' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400', ring: 'ring-cyan-400' },
]

function teacherColorIndex(name: string) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return Math.abs(hash) % TEACHER_COLORS.length
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

const SHIFT_LABELS: Record<string, { label: string; badge: string }> = {
  manha: { label: 'Manhã', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  tarde: { label: 'Tarde', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  noite: { label: 'Noite', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  integral: { label: 'Integral', badge: 'bg-green-500/10 text-green-400 border-green-500/30' },
}

// ─── Tipos ─────────────────────────────────────────────────────────────────

interface AssignTarget {
  classId: string
  teacherId?: string
  teacherName?: string
}

// ─── Componente: Teacher Card (sidebar) ───────────────────────────────────────

interface TeacherCardProps {
  teacher: { id: string; name: string; position: string | null }
  colorIdx: number
  assignmentCount: number
  isSelected: boolean
  onSelect: () => void
}

function TeacherCard({ teacher, colorIdx, assignmentCount, isSelected, onSelect }: TeacherCardProps) {
  const color = TEACHER_COLORS[colorIdx]

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.setData('teacherId', teacher.id)
        e.dataTransfer.setData('teacherName', teacher.name)
      }}
      onClick={onSelect}
      className={[
        'group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-grab active:cursor-grabbing transition-all duration-150 select-none',
        isSelected
          ? `border-2 ${color.ring} ring-2 ring-offset-1 bg-card shadow-md`
          : 'border-border bg-card hover:shadow-sm hover:border-muted-foreground/30',
      ].join(' ')}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
      <div className={`h-9 w-9 rounded-full ${color.bg} flex items-center justify-center shrink-0 shadow-sm`}>
        <span className="text-xs font-bold text-white">{initials(teacher.name)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">{teacher.name}</p>
        <p className="text-[11px] text-muted-foreground truncate">{teacher.position ?? 'Professor'}</p>
      </div>
      {assignmentCount > 0 && (
        <span className="shrink-0 text-[10px] font-semibold bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
          {assignmentCount}
        </span>
      )}
      {isSelected && (
        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
          <Zap className="h-2.5 w-2.5 text-white fill-white" />
        </span>
      )}
    </div>
  )
}

// ─── Componente: Slot pill ─────────────────────────────────────────────────

interface SlotPillProps {
  slot: TimetableSlot
  colorIdx: number
  onRemove: () => void
}

function SlotPill({ slot, colorIdx, onRemove }: SlotPillProps) {
  const color = TEACHER_COLORS[colorIdx]
  return (
    <div className={`group relative flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${color.light}`}>
      <div className={`h-5 w-5 rounded-full ${color.bg} flex items-center justify-center shrink-0`}>
        <span className="text-[9px] font-bold text-white">{initials(slot.teacher.name)}</span>
      </div>
      <div className="min-w-0">
        <p className="truncate leading-tight" style={{ maxWidth: 100 }}>{slot.subject.name}</p>
        <p className="text-[10px] opacity-70 font-normal">{slot.startTime}–{slot.endTime}</p>
      </div>
      <button
        onClick={onRemove}
        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-red-600"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

// ─── Componente: Class Column ──────────────────────────────────────────────

interface ClassColumnProps {
  schoolClass: { id: string; name: string; shift: string; serie: { name: string } | null; academicPeriodId: string | null }
  slots: TimetableSlot[]
  selectedTeacher: { id: string; name: string } | null
  teacherColorMap: Record<string, number>
  onDrop: (classId: string, teacherId: string, teacherName: string) => void
  onClickAdd: (classId: string, prefillTeacherId?: string, prefillTeacherName?: string) => void
  onDeleteSlot: (slotId: string, classId: string) => void
}

function ClassColumn({
  schoolClass, slots, selectedTeacher, teacherColorMap,
  onDrop, onClickAdd, onDeleteSlot,
}: ClassColumnProps) {
  const [dragOver, setDragOver] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const dragCounter = useRef(0)

  const slotsByDay = WEEK_DAYS_ORDER.reduce<Record<string, TimetableSlot[]>>((acc, day) => {
    const ds = slots.filter((s) => s.weekDay === day)
    if (ds.length > 0) acc[day] = ds
    return acc
  }, {})

  const shiftInfo = SHIFT_LABELS[schoolClass.shift.toLowerCase()] ?? { label: schoolClass.shift, badge: 'bg-muted text-muted-foreground border-border' }

  return (
    <div
      className={[
        'flex flex-col rounded-2xl border-2 transition-all duration-150 shrink-0 w-64',
        dragOver
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20 scale-[1.02]'
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
        const teacherId = e.dataTransfer.getData('teacherId')
        const teacherName = e.dataTransfer.getData('teacherName')
        if (teacherId) onDrop(schoolClass.id, teacherId, teacherName)
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-3 pb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{schoolClass.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {schoolClass.serie && (
              <span className="text-[10px] text-muted-foreground">{schoolClass.serie.name}</span>
            )}
            <span className={`text-[10px] border rounded px-1.5 py-0.5 font-medium ${shiftInfo.badge}`}>
              {shiftInfo.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <span className="text-[10px] text-muted-foreground font-medium">{slots.length} aulas</span>
          <button onClick={() => setCollapsed((v) => !v)} className="text-muted-foreground hover:text-foreground">
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Drop zone hint */}
      {dragOver && (
        <div className="mx-3 mb-2 rounded-xl border-2 border-dashed border-primary/50 bg-primary/10 py-3 text-center">
          <p className="text-xs font-medium text-primary">Soltar aqui</p>
        </div>
      )}

      {/* Slots by day */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-3 max-h-[480px]">
          {Object.keys(slotsByDay).length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-4">Nenhuma aula alocada</p>
          ) : (
            Object.entries(slotsByDay).map(([day, daySlots]) => (
              <div key={day}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {WEEK_DAY_LABELS[day]}
                </p>
                <div className="space-y-1">
                  {daySlots.map((slot) => (
                    <SlotPill
                      key={slot.id}
                      slot={slot}
                      colorIdx={teacherColorMap[slot.teacherId] ?? 0}
                      onRemove={() => onDeleteSlot(slot.id, slot.classId)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer: Add button */}
      <div className="p-3 pt-1">
        <button
          onClick={() =>
            selectedTeacher
              ? onClickAdd(schoolClass.id, selectedTeacher.id, selectedTeacher.name)
              : onClickAdd(schoolClass.id)
          }
          className={[
            'w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium border-2 border-dashed transition-all',
            selectedTeacher
              ? 'border-primary text-primary hover:bg-primary/10'
              : 'border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground',
          ].join(' ')}
        >
          <Plus className="h-3.5 w-3.5" />
          {selectedTeacher ? `Alocar ${selectedTeacher.name.split(' ')[0]}` : 'Adicionar aula'}
        </button>
      </div>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function SchedulingPage() {
  const { data: teachers = [] } = useTeachers()
  const { data: classes = [] } = useClasses()
  const { data: allSlots = [] } = useAllTimetableSlots()
  const { data: periods = [] } = useAcademicPeriods()
  const { data: subjects = [] } = useSubjects()

  const createSlot = useCreateTimetableSlot()
  const deleteSlotMutation = useDeleteTimetableSlot('')

  const [teacherSearch, setTeacherSearch] = useState('')
  const [classSearch, setClassSearch] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState<{ id: string; name: string } | null>(null)
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null)

  // Form state
  const [formDay, setFormDay] = useState('monday')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')
  const [formSubject, setFormSubject] = useState('')
  const [formPeriod, setFormPeriod] = useState('')
  const [formTeacher, setFormTeacher] = useState('')

  // Build color map (teacher id → color index)
  const teacherColorMap = Object.fromEntries(
    teachers.map((t, i) => [t.id, teacherColorIndex(t.name)])
  )

  // Count assignments per teacher
  const teacherAssignmentCount = Object.fromEntries(
    teachers.map((t) => [t.id, allSlots.filter((s) => s.teacherId === t.id).length])
  )

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(teacherSearch.toLowerCase())
  )

  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(classSearch.toLowerCase())
  )

  function openAssignForm(classId: string, teacherId?: string, teacherName?: string) {
    const schoolClass = classes.find((c) => c.id === classId)
    setAssignTarget({ classId, teacherId, teacherName })
    setFormTeacher(teacherId ?? selectedTeacher?.id ?? '')
    setFormPeriod(schoolClass?.academicPeriodId ?? periods[0]?.id ?? '')
    setFormDay('monday')
    setFormStart('')
    setFormEnd('')
    setFormSubject('')
  }

  function handleDrop(classId: string, teacherId: string, teacherName: string) {
    openAssignForm(classId, teacherId, teacherName)
  }

  async function handleAssign() {
    if (!assignTarget || !formTeacher || !formSubject || !formPeriod || !formDay || !formStart || !formEnd) {
      toast.error('Preencha todos os campos')
      return
    }

    createSlot.mutate(
      {
        classId: assignTarget.classId,
        teacherId: formTeacher,
        subjectId: formSubject,
        academicPeriodId: formPeriod,
        weekDay: formDay,
        startTime: formStart,
        endTime: formEnd,
      },
      {
        onSuccess: () => {
          toast.success('Aula alocada!')
          setAssignTarget(null)
        },
        onError: (err) => {
          const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message
          toast.error(msg ?? 'Erro ao alocar')
        },
      },
    )
  }

  function handleDeleteSlot(slotId: string, classId: string) {
    deleteSlotMutation.mutate(slotId, {
      onSuccess: () => toast.success('Aula removida'),
      onError: () => toast.error('Erro ao remover'),
    })
  }

  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - var(--header-h) - 2rem)' }}>
      <PageHead
        title="Locação de Aulas"
        subtitle="Monte a grade horária — arraste o professor para o slot da turma"
      />

      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">

      {/* ── Sidebar: Professores ──────────────────────────────────────────── */}
      <aside className="flex flex-col gap-3 w-72 shrink-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--iris-slate-500)', letterSpacing: '0.06em' }}>Professores</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--iris-slate-400)' }}>
            Arraste ou clique para selecionar
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar professor..."
            value={teacherSearch}
            onChange={(e) => setTeacherSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {selectedTeacher && (
          <div className="flex items-center justify-between rounded-md bg-primary/10 border border-primary/30 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                {selectedTeacher.name.split(' ')[0]} selecionado
              </span>
            </div>
            <button onClick={() => setSelectedTeacher(null)} className="text-primary hover:opacity-70">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredTeachers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhum professor encontrado</p>
          )}
          {filteredTeachers.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              colorIdx={teacherColorMap[teacher.id] ?? 0}
              assignmentCount={teacherAssignmentCount[teacher.id] ?? 0}
              isSelected={selectedTeacher?.id === teacher.id}
              onSelect={() =>
                setSelectedTeacher((prev) =>
                  prev?.id === teacher.id ? null : { id: teacher.id, name: teacher.name }
                )
              }
            />
          ))}
        </div>

        <div className="pt-2 border-t">
          <p className="text-[10px] text-muted-foreground">
            <span className="font-medium">{teachers.length}</span> professores ·{' '}
            <span className="font-medium">{allSlots.length}</span> aulas alocadas
          </p>
        </div>
      </aside>

      {/* ── Main: Kanban das turmas ───────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 gap-3 overflow-hidden">
        <div className="flex items-center gap-3 shrink-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--iris-slate-500)', letterSpacing: '0.06em' }}>Turmas</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--iris-slate-400)' }}>
              Arraste um professor até a turma para alocar
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
          <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
            {filteredClasses.map((schoolClass) => {
              const classSlots = allSlots.filter((s) => s.classId === schoolClass.id)
              return (
                <ClassColumn
                  key={schoolClass.id}
                  schoolClass={schoolClass}
                  slots={classSlots}
                  selectedTeacher={selectedTeacher}
                  teacherColorMap={teacherColorMap}
                  onDrop={handleDrop}
                  onClickAdd={openAssignForm}
                  onDeleteSlot={handleDeleteSlot}
                />
              )
            })}
          </div>
        )}
      </div>

      </div>{/* fim do flex wrapper */}

      {/* ── Dialog: Alocar aula ───────────────────────────────────────────── */}
      <Dialog open={!!assignTarget} onOpenChange={(v) => !v && setAssignTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Alocar aula
              {assignTarget && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  → {classes.find((c) => c.id === assignTarget.classId)?.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Professor *</Label>
              <Select value={formTeacher} onValueChange={setFormTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar professor" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-5 w-5 rounded-full items-center justify-center text-[9px] font-bold text-white ${TEACHER_COLORS[teacherColorMap[t.id] ?? 0].bg}`}
                        >
                          {initials(t.name)}
                        </span>
                        {t.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Disciplina *</Label>
              <Select value={formSubject} onValueChange={setFormSubject}>
                <SelectTrigger><SelectValue placeholder="Selecionar disciplina" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Dia *</Label>
                <Select value={formDay} onValueChange={setFormDay}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WEEK_DAYS_ORDER.map((d) => (
                      <SelectItem key={d} value={d}>{WEEK_DAY_LABELS[d]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Período letivo *</Label>
                <Select value={formPeriod} onValueChange={setFormPeriod}>
                  <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
                  <SelectContent>
                    {periods.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Início *</Label>
                <Input type="time" value={formStart} onChange={(e) => setFormStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Fim *</Label>
                <Input type="time" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTarget(null)}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={createSlot.isPending}>
              {createSlot.isPending ? 'Alocando...' : 'Alocar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
