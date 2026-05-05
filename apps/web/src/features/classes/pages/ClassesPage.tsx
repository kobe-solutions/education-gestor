import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useClasses, useDeleteClass } from '../hooks/useClasses'
import { ClassDialog } from '../components/ClassDialog'
import { Button } from '../../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import type { SchoolClass } from '@education-gestor/types'

export function ClassesPage() {
  const navigate = useNavigate()
  const { data: classes, isLoading } = useClasses()
  const deleteMutation = useDeleteClass()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SchoolClass | undefined>()

  function handleEdit(sc: SchoolClass) {
    setEditing(sc)
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    if (confirm('Remover turma?')) deleteMutation.mutate(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Turmas</h1>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Nova turma
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {classes?.length ?? 0} turmas
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
                  <TableHead>Série</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes?.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/classes/${c.id}`)}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.grade}</TableCell>
                    <TableCell className="capitalize">{c.shift}</TableCell>
                    <TableCell>{c.termTime}</TableCell>
                    <TableCell>{c.students.length}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
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

      <ClassDialog open={dialogOpen} onClose={() => setDialogOpen(false)} schoolClass={editing} />
    </div>
  )
}
