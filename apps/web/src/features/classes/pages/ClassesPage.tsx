import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useClasses, useDeleteClass } from '../hooks/useClasses'
import { ClassDialog } from '../components/ClassDialog'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { Button } from '../../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import type { SchoolClass } from '@education-gestor/types'

export function ClassesPage() {
  const navigate = useNavigate()
  const { data: classes, isLoading } = useClasses()
  const deleteMutation = useDeleteClass()

  const deleteApiMutation = useApiMutation({
    mutationFn: (id: string) => deleteMutation.mutateAsync(id),
    successMessage: 'Turma removida',
    onSuccess: () => setDeleteTarget(null),
    onError: () => setDeleteTarget(null),
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SchoolClass | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  function handleEdit(sc: SchoolClass) {
    setEditing(sc)
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditing(undefined)
    setDialogOpen(true)
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
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Período Letivo</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes?.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/classes/${c.id}`)}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.serie?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="capitalize">{c.shift}</TableCell>
                    <TableCell>{c.academicPeriod?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{c.students.length}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c.id)}>
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

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => {
          deleteApiMutation.mutate(deleteTarget!)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
