import { useMemo, useRef, useState } from 'react'
import { BookOpen, CalendarDays, FileText, GraduationCap, Paperclip, Pencil, Plus, Trash2, Upload, Users, X } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { useTeacherDashboard } from '../../teacher-dashboard/hooks/useTeacherDashboard'
import { useCreateLessonRecord, useDeleteLessonRecord, useLessonRecords, useUpdateLessonRecord, type LessonRecord } from '../hooks/useLessonRecords'
import { useAllTeachers } from '../../teachers/hooks/useTeachers'
import { useClasses } from '../../classes/hooks/useClasses'
import { toast } from '../../../lib/toast'
import { extractErrorMessage } from '../../../lib/errors'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { cn } from '../../../lib/utils'

const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,.webp,.ppt,.pptx,.xls,.xlsx,.doc,.docx'
const MAX_ATTACHMENTS = 5
const MAX_FILE_BYTES = 10 * 1024 * 1024

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function monthNow() {
  return new Date().toISOString().slice(0, 7)
}

function todayBrazilianDate() {
  const today = new Date()
  return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`
}

function todayLocalIsoDate() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function normalizeBrazilianDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return null
  const [, dayText, monthText, yearText] = match
  const day = Number(dayText)
  const month = Number(monthText)
  const year = Number(yearText)
  const parsed = new Date(year, month - 1, day)
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null
  return `${yearText}-${monthText}-${dayText}`
}

function dateToBrazilian(value: string) {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

type ScheduledLessonOption = {
  value: string
  timetableSlotId: string | null
  date: string
  classId: string
  className: string
  subjectId: string
  subjectName: string
  time: string
  label: string
}

function readableDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR')
}

function ManagerFilters({
  teacherId,
  classId,
  onTeacherChange,
  onClassChange,
}: {
  teacherId: string
  classId: string
  onTeacherChange: (value: string) => void
  onClassChange: (value: string) => void
}) {
  const { data: teachers = [] } = useAllTeachers()
  const { data: classes = [] } = useClasses()
  return (
    <section id="record-filters" className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="filter-teacher">Professor</Label>
        <Select value={teacherId || null} onValueChange={(value) => onTeacherChange(value ?? '')} items={[
          { value: 'all-teachers', label: 'Todos os professores' },
          ...teachers.map((teacher) => ({ value: teacher.id, label: teacher.name })),
        ]}>
          <SelectTrigger id="filter-teacher" className="w-full">
            <GraduationCap className="size-4 text-muted-foreground" aria-hidden />
            <SelectValue placeholder="Todos os professores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-teachers">Todos os professores</SelectItem>
            {teachers.map((teacher) => <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="filter-class">Turma</Label>
        <Select value={classId || null} onValueChange={(value) => onClassChange(value ?? '')} items={[
          { value: 'all-classes', label: 'Todas as turmas' },
          ...classes.map((schoolClass) => ({ value: schoolClass.id, label: schoolClass.name })),
        ]}>
          <SelectTrigger id="filter-class" className="w-full">
            <Users className="size-4 text-muted-foreground" aria-hidden />
            <SelectValue placeholder="Todas as turmas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-classes">Todas as turmas</SelectItem>
            {classes.map((schoolClass) => <SelectItem key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </section>
  )
}

export function LessonRecordsPage() {
  const { payload } = useAuth()
  const isTeacher = payload?.role === 'professor'
  const [month, setMonth] = useState(monthNow())
  const [teacherFilter, setTeacherFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<LessonRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LessonRecord | null>(null)
  const [selectedOccurrence, setSelectedOccurrence] = useState('')
  const [selectedTimetableSlotId, setSelectedTimetableSlotId] = useState('')
  const [lessonDate, setLessonDate] = useState(todayBrazilianDate)
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [formError, setFormError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: records = [], isLoading, isError, refetch } = useLessonRecords(month, {
    ...(teacherFilter ? { teacherId: teacherFilter } : {}),
    ...(classFilter ? { classId: classFilter } : {}),
  })
  const { data: teacherData } = useTeacherDashboard(isTeacher)
  const createRecord = useCreateLessonRecord()
  const updateRecord = useUpdateLessonRecord()
  const deleteRecord = useDeleteLessonRecord()
  const remainingSlots = MAX_ATTACHMENTS - (editingRecord?.attachments.length ?? 0) - files.length

  function addFiles(incoming: FileList | File[]) {
    const next = Array.from(incoming)
    if (next.length === 0) return
    setFiles((current) => {
      const available = MAX_ATTACHMENTS - (editingRecord?.attachments.length ?? 0) - current.length
      if (available <= 0) {
        setFormError(`O registro aceita até ${MAX_ATTACHMENTS} anexos no total.`)
        return current
      }
      const oversized = next.find((file) => file.size > MAX_FILE_BYTES)
      if (oversized) {
        setFormError(`“${oversized.name}” ultrapassa 10 MB. Escolha um arquivo menor.`)
        return current
      }
      setFormError('')
      return [...current, ...next.slice(0, available)]
    })
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, i) => i !== index))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const scheduledLessons = useMemo(() => {
    if (!teacherData || !month) return []
    const [year, monthNumber] = month.split('-').map(Number)
    const weekdayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
    const today = todayLocalIsoDate()
    const options: ScheduledLessonOption[] = []
    for (let day = 1; day <= lastDay; day += 1) {
      const date = `${month}-${String(day).padStart(2, '0')}`
      if (!editingRecord && date > today) continue
      const weekday = weekdayNames[new Date(Date.UTC(year, monthNumber - 1, day)).getUTCDay()]
      for (const slot of teacherData.weeklyTimetable) {
        if (slot.weekDay !== weekday) continue
        const time = `${slot.classPeriod.startTime}–${slot.classPeriod.endTime}`
        options.push({
          value: `${slot.slotId}|${date}`,
          timetableSlotId: slot.slotId,
          date,
          classId: slot.class.id,
          className: slot.class.name,
          subjectId: slot.subject.id,
          subjectName: slot.subject.name,
          time,
          label: `${dateToBrazilian(date)} · ${slot.class.name} · ${slot.subject.name} · ${time}`,
        })
      }
    }
    return options.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  }, [teacherData, month, editingRecord])
  const matchingEditingOccurrence = editingRecord && scheduledLessons.find((item) =>
    item.date === editingRecord.date && (
      editingRecord.timetableSlotId
        ? item.timetableSlotId === editingRecord.timetableSlotId
        : item.classId === editingRecord.classId && item.subjectId === editingRecord.subjectId
    ),
  )
  const fallbackEditingOccurrence: ScheduledLessonOption | null = editingRecord && !matchingEditingOccurrence
    ? {
        value: `saved:${editingRecord.id}`,
        timetableSlotId: editingRecord.timetableSlotId,
        date: editingRecord.date,
        classId: editingRecord.classId,
        className: editingRecord.className,
        subjectId: editingRecord.subjectId,
        subjectName: editingRecord.subjectName,
        time: 'Horário não disponível',
        label: `${dateToBrazilian(editingRecord.date)} · ${editingRecord.className} · ${editingRecord.subjectName} · Registro atual`,
      }
    : null
  const occurrenceOptions = fallbackEditingOccurrence
    ? [fallbackEditingOccurrence, ...scheduledLessons]
    : scheduledLessons

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    if (!selectedOccurrence || !classId || !subjectId) {
      setFormError('Selecione uma aula da sua grade.')
      return
    }
    const normalizedDate = normalizeBrazilianDate(lessonDate)
    if (!normalizedDate) {
      setFormError('Informe uma data válida no formato DD/MM/AAAA.')
      return
    }
    if (files.length + (editingRecord?.attachments.length ?? 0) > MAX_ATTACHMENTS || files.some((file) => file.size > MAX_FILE_BYTES)) {
      setFormError(`O registro aceita até ${MAX_ATTACHMENTS} anexos, cada um com no máximo 10 MB.`)
      return
    }
    if (!selectedTimetableSlotId && !editingRecord) {
      setFormError('Selecione uma aula da sua grade.')
      return
    }
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const topic = String(form.get('topic') ?? '').trim()
    form.set('topic', topic)
    form.set('title', topic.slice(0, 120))
    form.set('date', normalizedDate)
    form.set('classId', classId)
    form.set('subjectId', subjectId)
    if (selectedTimetableSlotId) form.set('timetableSlotId', selectedTimetableSlotId)
    for (const file of files) form.append('attachments', file)
    try {
      if (editingRecord) {
        await updateRecord.mutateAsync({ id: editingRecord.id, form })
        toast.success('Registro de aula atualizado.')
      } else {
        await createRecord.mutateAsync(form)
        toast.success('Registro de aula criado.')
      }
      formElement.reset()
      setClassId('')
      setSubjectId('')
      setFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      setLessonDate(todayBrazilianDate())
      setEditingRecord(null)
      setFormOpen(false)
    } catch (error) {
      const message = extractErrorMessage(error, '')
      setFormError(
        message.includes('Já existe um registro')
          ? message
          : message || 'Não foi possível salvar. Confira os dados e os anexos e tente novamente.',
      )
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const { id } = deleteTarget
    setDeleteTarget(null)
    deleteRecord.mutate(id, {
      onSuccess: () => {
        if (editingRecord?.id === id) {
          setEditingRecord(null)
          setFormOpen(false)
        }
        toast.success('Registro de aula excluído.')
      },
      onError: () => toast.error('Não foi possível excluir o registro. Tente novamente.'),
    })
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registros de aula</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isTeacher ? 'Registre o conteúdo trabalhado e compartilhe materiais com a gestão.' : 'Consulte os registros enviados pelos professores.'}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="records-month" className="text-xs text-muted-foreground">Mês dos registros</Label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input id="records-month" type="month" value={month} onChange={(event) => {
                setMonth(event.target.value)
                if (isTeacher) {
                  setSelectedOccurrence('')
                  setSelectedTimetableSlotId('')
                  setClassId('')
                  setSubjectId('')
                }
              }} className="w-auto min-w-[11.5rem] pl-9" />
            </div>
          </div>
          {isTeacher && <Button onClick={() => {
            if (formOpen) {
              setFormOpen(false)
              setEditingRecord(null)
            } else {
              setEditingRecord(null)
              setSelectedOccurrence('')
              setSelectedTimetableSlotId('')
              setClassId('')
              setSubjectId('')
              setFiles([])
              setLessonDate(todayBrazilianDate())
              setFormOpen(true)
            }
          }}><Plus className="mr-1.5" />{formOpen ? 'Fechar formulário' : 'Novo registro'}</Button>}
        </div>
      </header>

      {isTeacher && formOpen && (
        <form key={editingRecord?.id ?? 'new-record'} onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold">{editingRecord ? 'Editar registro' : 'Novo registro'}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lesson-occurrence">Aula da grade</Label>
              <Select value={selectedOccurrence || null} onValueChange={(value) => {
                const option = occurrenceOptions.find((item) => item.value === value)
                setSelectedOccurrence(value ?? '')
                setSelectedTimetableSlotId(option?.timetableSlotId ?? '')
                setClassId(option?.classId ?? '')
                setSubjectId(option?.subjectId ?? '')
                if (option) setLessonDate(dateToBrazilian(option.date))
              }} items={occurrenceOptions.map((item) => ({ value: item.value, label: item.label }))}>
                <SelectTrigger id="lesson-occurrence" className="h-auto min-h-11 w-full py-2.5">
                  <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <SelectValue placeholder="Escolha data, turma, disciplina e horário" />
                </SelectTrigger>
                <SelectContent>
                  {occurrenceOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                  {occurrenceOptions.length === 0 && <div className="px-3 py-4 text-center text-sm text-muted-foreground">Nenhuma aula da grade disponível neste mês</div>}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Você pode registrar aulas realizadas em dias anteriores deste mês. A data, a turma e a disciplina serão preenchidas pela aula selecionada.</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lesson-topic">Conteúdo trabalhado</Label>
              <Input id="lesson-topic" name="topic" required minLength={3} maxLength={160} defaultValue={editingRecord?.topic ?? ''} placeholder="Ex.: Frações equivalentes — capítulo 4" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lesson-description">Descrição da aula</Label>
              <Textarea id="lesson-description" name="description" rows={4} maxLength={4000} defaultValue={editingRecord?.description ?? ''} placeholder="O que foi feito, objetivos e observações importantes" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Label htmlFor="lesson-files">Materiais de apoio</Label>
                <span className="text-xs text-muted-foreground">
                  {files.length + (editingRecord?.attachments.length ?? 0)}/{MAX_ATTACHMENTS} arquivos
                </span>
              </div>
              <label
                htmlFor="lesson-files"
                aria-describedby="lesson-files-hint"
                onDragOver={(event) => {
                  event.preventDefault()
                  if (remainingSlots > 0) setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragOver(false)
                  if (remainingSlots > 0) addFiles(event.dataTransfer.files)
                }}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-[background-color,border-color,box-shadow] has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30',
                  remainingSlots <= 0
                    ? 'cursor-not-allowed border-border bg-muted/30 opacity-70'
                    : dragOver
                      ? 'cursor-pointer border-primary bg-primary/5 shadow-sm'
                      : 'cursor-pointer border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/5',
                )}
              >
                <input
                  ref={fileInputRef}
                  id="lesson-files"
                  type="file"
                  multiple
                  accept={ACCEPTED_FILE_TYPES}
                  className="sr-only"
                  disabled={remainingSlots <= 0}
                  onChange={(event) => {
                    addFiles(event.target.files ?? [])
                    event.target.value = ''
                  }}
                />
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Upload className="size-5" aria-hidden />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {remainingSlots <= 0
                      ? 'Limite de anexos atingido'
                      : 'Arraste arquivos aqui ou clique para escolher'}
                  </p>
                  <p id="lesson-files-hint" className="text-xs text-muted-foreground">
                    PDF, fotos, slides, planilhas e documentos · até 10 MB cada
                  </p>
                </div>
                {remainingSlots > 0 && (
                  <span className="inline-flex h-8 items-center gap-1 rounded-sm border border-border bg-background px-3 text-sm font-medium">
                    <Upload className="size-3.5" aria-hidden />
                    Selecionar arquivos
                  </span>
                )}
              </label>
              {files.length > 0 && (
                <ul className="space-y-2" aria-label="Arquivos selecionados">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${file.size}-${index}`} className="flex min-w-0 items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <FileText className="size-4" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Remover ${file.name}`}
                        onClick={() => removeFile(index)}
                      >
                        <X className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {editingRecord && editingRecord.attachments.length > 0 && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Anexos atuais</Label>
                <div className="flex flex-wrap gap-2">
                  {editingRecord.attachments.map((file, index) => (
                    <a key={`${file.url}-${index}`} href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border bg-muted/35 px-2.5 py-1.5 text-xs font-medium hover:bg-accent">
                      <Paperclip className="size-3.5 text-primary" />{file.name}
                    </a>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Os anexos atuais serão mantidos. Você pode adicionar novos materiais acima.</p>
              </div>
            )}
          </div>
          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={createRecord.isPending || updateRecord.isPending || !teacherData || occurrenceOptions.length === 0}>{createRecord.isPending || updateRecord.isPending ? 'Salvando…' : editingRecord ? 'Salvar alterações' : 'Salvar registro'}</Button>
          </div>
        </form>
      )}

      {!isTeacher && <ManagerFilters
        teacherId={teacherFilter}
        classId={classFilter}
        onTeacherChange={(value) => setTeacherFilter(value === 'all-teachers' ? '' : value)}
        onClassChange={(value) => setClassFilter(value === 'all-classes' ? '' : value)}
      />}

      <section aria-label="Registros de aula" className="space-y-4">
        {isLoading ? (
          <div className="space-y-3 rounded-xl border bg-card p-5">
            <div className="h-5 w-48 animate-pulse rounded bg-muted" />
            <div className="h-20 animate-pulse rounded bg-muted" />
            <div className="h-20 animate-pulse rounded bg-muted" />
          </div>
        ) : isError ? (
          <div role="alert" className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border bg-card px-6 text-center">
            <p className="text-sm text-muted-foreground">Não foi possível carregar os registros de aula.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>Tentar novamente</Button>
          </div>
        ) : records.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border bg-card px-6 text-center">
            <BookOpen className="mb-3 size-8 text-muted-foreground" />
            <h2 className="font-semibold">Nenhum registro neste mês</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">Os registros de aula e seus materiais aparecerão aqui para consulta.</p>
          </div>
        ) : (
          records.map((record) => (
            <article key={record.id} className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" />{readableDate(record.date)}</span>
                    <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{record.className}</span>
                    <span className="inline-flex items-center gap-1"><BookOpen className="size-3.5" />{record.subjectName}</span>
                  </div>
                  <h2 className="mt-2 text-base font-semibold">{record.title}</h2>
                  <p className="mt-1 text-sm"><span className="font-medium">Conteúdo:</span> {record.topic}</p>
                  {record.description && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{record.description}</p>}
                  {record.attachments.length > 0 && (
                    <div className="mt-4 rounded-lg border bg-muted/35 p-3 sm:p-4">
                      <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold">
                        <Paperclip className="size-4 text-primary" />Materiais anexados
                        <span className="text-xs font-normal text-muted-foreground">({record.attachments.length})</span>
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {record.attachments.map((file, index) => (
                          <a key={`${file.url}-${index}`} href={file.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2.5 rounded-md border bg-card px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <Paperclip className="size-4 shrink-0 text-primary" />
                            <span className="truncate">{file.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {!isTeacher && <p className="mt-2 text-xs text-muted-foreground">Professor(a): {record.teacherName}</p>}
                </div>
                {isTeacher && (
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      const scheduled = scheduledLessons.find((item) => item.date === record.date && (
                        record.timetableSlotId
                          ? item.timetableSlotId === record.timetableSlotId
                          : item.classId === record.classId && item.subjectId === record.subjectId
                      ))
                      setEditingRecord(record)
                      setSelectedOccurrence(scheduled?.value ?? `saved:${record.id}`)
                      setSelectedTimetableSlotId(record.timetableSlotId ?? '')
                      setClassId(record.classId)
                      setSubjectId(record.subjectId)
                      setLessonDate(dateToBrazilian(record.date))
                      setFiles([])
                      setFormError('')
                      setFormOpen(true)
                    }}><Pencil className="mr-1.5 size-3.5" />Editar</Button>
                    <Button type="button" variant="outline" size="sm" className="text-destructive hover:text-destructive" aria-label={`Excluir registro: ${record.title}`} onClick={() => setDeleteTarget(record)}>
                      <Trash2 className="mr-1.5 size-3.5" />Excluir
                    </Button>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </section>
      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Excluir registro de aula?"
        description={deleteTarget ? `O registro “${deleteTarget.title}” e seus anexos serão removidos. Esta ação não pode ser desfeita.` : undefined}
      />
    </main>
  )
}
