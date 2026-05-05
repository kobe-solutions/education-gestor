import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useStudents, useDeleteStudent } from '../hooks/useStudents'
import { StudentDialog } from '../components/StudentDialog'
import { Button } from '../../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import type { Student } from '@education-gestor/types'

export function StudentsPage() {
  const navigate = useNavigate()
  const { data: students, isLoading } = useStudents()
  const deleteMutation = useDeleteStudent()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Student | undefined>()

  function handleEdit(student: Student) {
    setEditing(student)
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    if (confirm('Remover aluno?')) deleteMutation.mutate(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Alunos</h1>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Novo aluno
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {students?.length ?? 0} alunos cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/students/${s.id}`)}
                  >
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{s.enrollmentCode}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <StudentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} student={editing} />
    </div>
  )
}
