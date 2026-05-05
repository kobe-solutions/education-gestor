import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useTeachers, useDeleteTeacher } from '../hooks/useTeachers'
import { TeacherDialog } from '../components/TeacherDialog'
import { Button } from '../../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import type { Teacher } from '@education-gestor/types'

export function TeachersPage() {
  const { data: teachers, isLoading } = useTeachers()
  const deleteMutation = useDeleteTeacher()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Teacher | undefined>()

  function handleEdit(teacher: Teacher) {
    setEditing(teacher)
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    if (confirm('Remover professor?')) deleteMutation.mutate(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Professores</h1>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Novo professor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {teachers?.length ?? 0} professores cadastrados
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
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers?.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
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

      <TeacherDialog open={dialogOpen} onClose={() => setDialogOpen(false)} teacher={editing} />
    </div>
  )
}
