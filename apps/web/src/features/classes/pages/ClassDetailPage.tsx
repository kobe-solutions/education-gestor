import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useClass, useAddStudentToClass, useRemoveStudentFromClass, useAddTeacherToClass } from '../hooks/useClasses'
import { useStudents } from '../../students/hooks/useStudents'
import { useTeachers } from '../../teachers/hooks/useTeachers'
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
  const { data: allTeachers } = useTeachers()
  const addStudent = useAddStudentToClass(id!)
  const removeStudent = useRemoveStudentFromClass(id!)
  const addTeacher = useAddTeacherToClass(id!)

  const [studentDialogOpen, setStudentDialogOpen] = useState(false)
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false)

  const studentForm = useForm<MemberForm>({ resolver: zodResolver(memberSchema) })
  const teacherForm = useForm<MemberForm>({ resolver: zodResolver(memberSchema) })

  function onAddStudent(data: MemberForm) {
    addStudent.mutate(data.id, { onSuccess: () => { setStudentDialogOpen(false); studentForm.reset() } })
  }

  function onAddTeacher(data: MemberForm) {
    addTeacher.mutate(data.id, { onSuccess: () => { setTeacherDialogOpen(false); teacherForm.reset() } })
  }

  const enrolledStudentIds = new Set(schoolClass?.students.map((s: any) => s.studentId))
  const enrolledTeacherIds = new Set(schoolClass?.teachers.map((t: any) => t.teacherId))
  const availableStudents = allStudents?.filter((s) => !enrolledStudentIds.has(s.id))
  const availableTeachers = allTeachers?.filter((t) => !enrolledTeacherIds.has(t.id))

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>
  if (!schoolClass) return <p className="text-sm text-destructive">Turma não encontrada</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/classes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{schoolClass.name}</h1>
          <p className="text-sm text-muted-foreground">{schoolClass.grade}º ano · {schoolClass.shift} · {schoolClass.termTime}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Professores</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setTeacherDialogOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {schoolClass.teachers.length === 0 && (
                  <TableRow><TableCell className="text-muted-foreground text-center">Nenhum professor</TableCell></TableRow>
                )}
                {schoolClass.teachers.map((t: any) => {
                  const teacher = allTeachers?.find((at) => at.id === t.teacherId)
                  return (
                    <TableRow key={t.id}>
                      <TableCell>{teacher?.name ?? t.teacherId}</TableCell>
                    </TableRow>
                  )
                })}
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
                  <TableRow><TableCell colSpan={2} className="text-muted-foreground text-center">Nenhum aluno</TableCell></TableRow>
                )}
                {schoolClass.students.map((s: any) => {
                  const student = allStudents?.find((as) => as.id === s.studentId)
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{student?.name ?? s.studentId}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeStudent.mutate(s.studentId)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
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

      <Dialog open={teacherDialogOpen} onOpenChange={(v) => !v && setTeacherDialogOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar professor</DialogTitle></DialogHeader>
          <form onSubmit={teacherForm.handleSubmit(onAddTeacher)} className="space-y-4">
            <div className="space-y-1">
              <Label>Professor</Label>
              <Select onValueChange={(v) => teacherForm.setValue('id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione um professor" /></SelectTrigger>
                <SelectContent>
                  {availableTeachers?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTeacherDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={addTeacher.isPending}>Adicionar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
