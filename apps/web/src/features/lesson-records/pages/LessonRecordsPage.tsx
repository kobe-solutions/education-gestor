import { useMemo, useState } from 'react'
import { BookOpen, CalendarDays, Paperclip, Pencil, Plus, Trash2, Users } from 'lucide-react'
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
import { ConfirmDialog } from '../../../components/ConfirmDialog'

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
          <SelectTrigger id="filter-teacher" className="w-full"><SelectValue placeholder="Todos os professores" /></SelectTrigger>
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
          <SelectTrigger id="filter-class" className="w-full"><SelectValue placeholder="Todas as turmas" /></SelectTrigger>
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
  const [formError, setFormError] = useState('')
  const { data: records = [], isLoading, isError, refetch } = useLessonRecords(month, {
    ...(teacherFilter ? { teacherId: teacherFilter } : {}),
    ...(classFilter ? { classId: classFilter } : {}),
  })
  const { data: teacherData } = useTeacherDashboard(isTeacher)
  const createRecord = useCreateLessonRecord()
  const updateRecord = useUpdateLessonRecord()
  const deleteRecord = useDeleteLessonRecord()
  const fileNames = useMemo(() => files.map((file) => file.name), [files])
  const scheduledLessons = useMemo(() => {
    if (!teacherData || !month) return []
    const [year, monthNumber] = month.split('-').map(Number)
    const weekdayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
    const today = todayLocalIsoDate()
    const options: ScheduledLessonOption[] = []
    for (let day = 1; day <= lastDay; day += 1) {
      const date = `${month}-${String(day).padStart(2, '0')}`
      if (!editingRecord && date < today) continue
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
    if (files.length + (editingRecord?.attachments.length ?? 0) > 5 || files.some((file) => file.size > 10 * 1024 * 1024)) {
      setFormError('O registro aceita até 5 anexos, cada um com no máximo 10 MB.')
      return
    }
    const formElement = event.currentTarget
    const form = new FormData(formElement)
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
      setLessonDate(todayBrazilianDate())
      setEditingRecord(null)
      setFormOpen(false)
    } catch {
      setFormError('Não foi possível salvar. Confira os dados e os anexos e tente novamente.')
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
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="records-month">Mês dos registros</label>
          <Input id="records-month" type="month" value={month} onChange={(event) => {
            setMonth(event.target.value)
            if (isTeacher) {
              setSelectedOccurrence('')
              setSelectedTimetableSlotId('')
              setClassId('')
              setSubjectId('')
            }
          }} className="w-auto" />
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
                <SelectTrigger id="lesson-occurrence" className="w-full"><SelectValue placeholder="Selecione data, turma, disciplina e horário da grade" /></SelectTrigger>
                <SelectContent>
                  {occurrenceOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  {occurrenceOptions.length === 0 && <div className="px-3 py-4 text-center text-sm text-muted-foreground">{editingRecord ? 'Nenhuma aula na grade neste mês' : 'Nenhuma aula a partir de hoje neste mês'}</div>}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">A data, a turma e a disciplina serão preenchidas pela aula selecionada.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lesson-title">Título</Label>
              <Input id="lesson-title" name="title" required minLength={3} maxLength={120} defaultValue={editingRecord?.title ?? ''} placeholder="Ex.: Frações e situações do cotidiano" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lesson-topic">Conteúdo trabalhado</Label>
              <Input id="lesson-topic" name="topic" required minLength={2} maxLength={160} defaultValue={editingRecord?.topic ?? ''} placeholder="Tema, capítulo ou habilidade" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lesson-description">Descrição da aula</Label>
              <Textarea id="lesson-description" name="description" rows={4} maxLength={4000} defaultValue={editingRecord?.description ?? ''} placeholder="Atividades realizadas, objetivos e observações" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lesson-files">Materiais de apoio</Label>
              <Input id="lesson-files" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.ppt,.pptx,.xls,.xlsx,.doc,.docx" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} className="h-auto py-2 file:mr-3" />
              <p className="text-xs text-muted-foreground">PDF, fotos, slides, planilhas e documentos. Até 5 arquivos de 10 MB cada.</p>
              {fileNames.length > 0 && <p className="text-xs text-foreground">{fileNames.join(' · ')}</p>}
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

      <section aria-label="Registros de aula" className="overflow-hidden rounded-xl border bg-card">
        {isLoading ? <div className="space-y-3 p-5"><div className="h-5 w-48 animate-pulse rounded bg-muted" /><div className="h-20 animate-pulse rounded bg-muted" /><div className="h-20 animate-pulse rounded bg-muted" /></div>
          : isError ? (
            <div role="alert" className="flex min-h-48 flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm text-muted-foreground">Não foi possível carregar os registros de aula.</p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>Tentar novamente</Button>
            </div>
          )
          : records.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <BookOpen className="mb-3 size-8 text-muted-foreground" />
              <h2 className="font-semibold">Nenhum registro neste mês</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">Os registros de aula e seus materiais aparecerão aqui para consulta.</p>
            </div>
          ) : (
            <div className="divide-y">
              {records.map((record) => (
                <article key={record.id} className="p-4 sm:p-5">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
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
                      {isTeacher && <div className="flex shrink-0 gap-2">
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
                      </div>}
                  </div>
                </article>
              ))}
            </div>
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
