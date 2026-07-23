import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Plus, Trash2, CalendarClock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useClass, useAddStudentToClass, useRemoveStudentFromClass } from '../hooks/useClasses'
import { useStudents } from '../../students/hooks/useStudents'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Label } from '../../../components/ui/label'

const memberSchema = z.object({ id: z.string().min(1, 'Selecione um item') })
type MemberForm = z.infer<typeof memberSchema>

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: schoolClass, isLoading } = useClass(id!)
  const { data: allStudents } = useStudents()
  const addStudent = useAddStudentToClass(id!)
  const removeStudent = useRemoveStudentFromClass(id!)

  const [studentDialogOpen, setStudentDialogOpen] = useState(false)
  const studentForm = useForm<MemberForm>({ resolver: zodResolver(memberSchema) })

  function onAddStudent(data: MemberForm) {
    addStudent.mutate(data.id, { onSuccess: () => { setStudentDialogOpen(false); studentForm.reset() } })
  }

  const enrolledStudentIds = new Set(schoolClass?.students.map((s) => s.id))
  const availableStudents = allStudents?.filter((s) => !enrolledStudentIds.has(s.id))

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>
  if (!schoolClass) return <p className="text-sm text-destructive">Turma não encontrada</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-md w-8 h-8 transition-colors shrink-0"
          title="Voltar"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--iris-blue-50)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
        >
          <ArrowLeft size={16} style={{ color: 'var(--iris-slate-700)' }} />
        </button>

        <div className="flex-1 min-w-0">
          <h1
            className="font-bold truncate"
            style={{ fontSize: 20, color: 'var(--iris-blue-900)', letterSpacing: '-0.01em' }}
          >
            {schoolClass.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--iris-slate-500)' }}>
            {schoolClass.serie?.name ?? '—'} · {schoolClass.shift}
            {schoolClass.academicPeriod ? ` · ${schoolClass.academicPeriod.name}` : ''}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate(`/classes/${id}/timetable`)}>
          <CalendarClock className="h-4 w-4 mr-1" />
          Grade Horária
        </Button>
      </div>

      {/* Grid de informações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Professores ({schoolClass.teachers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {schoolClass.teachers.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground text-center text-sm py-4">
                      Nenhum professor alocado na grade
                    </TableCell>
                  </TableRow>
                ) : (
                  schoolClass.teachers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.email}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Alunos ({schoolClass.students.length})</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setStudentDialogOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {schoolClass.students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground text-center text-sm py-4">
                      Nenhum aluno matriculado
                    </TableCell>
                  </TableRow>
                )}
                {schoolClass.students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeStudent.mutate(s.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={studentDialogOpen} onOpenChange={(v) => !v && setStudentDialogOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar aluno</DialogTitle></DialogHeader>
          <form onSubmit={studentForm.handleSubmit(onAddStudent)} className="space-y-4">
            <div className="space-y-1">
              <Label>Aluno</Label>
              <Select onValueChange={(v) => studentForm.setValue('id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione um aluno" /></SelectTrigger>
                <SelectContent>
                  {availableStudents?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStudentDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={addStudent.isPending}>Adicionar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
