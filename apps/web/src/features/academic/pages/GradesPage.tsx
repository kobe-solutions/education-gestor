import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useClasses } from '../../classes/hooks/useClasses'
import { useClassGrades, useRegisterGrade } from '../hooks/useAcademic'
import { useStudents } from '../../students/hooks/useStudents'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { useAuth } from '../../../contexts/AuthContext'
import type { TenantPayload } from '@education-gestor/types'

const gradeSchema = z.object({
  studentId: z.string().min(1, 'Selecione o aluno'),
  subject: z.string().min(1, 'Disciplina obrigatória'),
  value: z.coerce.number().min(0).max(10, 'Nota entre 0 e 10'),
  period: z.string().min(1, 'Período obrigatório'),
})

type GradeForm = z.infer<typeof gradeSchema>

export function GradesPage() {
  const { payload } = useAuth()
  const { data: classes } = useClasses()
  const [selectedClassId, setSelectedClassId] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: grades, isLoading } = useClassGrades(selectedClassId)
  const { data: allStudents } = useStudents()
  const registerGrade = useRegisterGrade()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<GradeForm>({
    resolver: zodResolver(gradeSchema),
  })

  const studentIdValue = watch('studentId')

  function onSubmit(data: GradeForm) {
    const teacherId = (payload as TenantPayload)?.userId ?? ''
    registerGrade.mutate(
      { ...data, classId: selectedClassId, teacherId },
      { onSuccess: () => { setDialogOpen(false); reset() } },
    )
  }

  const classStudents = classes?.find((c) => c.id === selectedClassId)?.students ?? []
  const studentIds = new Set(classStudents.map((s: any) => s.studentId))
  const enrolledStudents = allStudents?.filter((s) => studentIds.has(s.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notas</h1>
        {selectedClassId && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>Lançar nota</Button>
        )}
      </div>

      <div className="w-64">
        <Label>Turma</Label>
        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a turma" />
          </SelectTrigger>
          <SelectContent>
            {classes?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name} — {c.grade}º {c.shift}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClassId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{grades?.length ?? 0} notas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades?.map((g) => {
                    const student = allStudents?.find((s) => s.id === g.studentId)
                    return (
                      <TableRow key={g.id}>
                        <TableCell>{student?.name ?? g.studentId}</TableCell>
                        <TableCell>{g.subject}</TableCell>
                        <TableCell>{g.period}</TableCell>
                        <TableCell className="font-medium">{g.value}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Lançar nota</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Aluno</Label>
              <Select value={studentIdValue} onValueChange={(v) => setValue('studentId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent>
                  {enrolledStudents?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Disciplina</Label>
              <Input placeholder="Ex: Matemática" {...register('subject')} />
              {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nota (0–10)</Label>
                <Input type="number" step="0.1" {...register('value')} />
                {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Período</Label>
                <Input placeholder="Ex: 1B" {...register('period')} />
                {errors.period && <p className="text-xs text-destructive">{errors.period.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={registerGrade.isPending}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
