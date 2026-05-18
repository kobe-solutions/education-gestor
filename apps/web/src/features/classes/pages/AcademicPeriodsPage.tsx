import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { AxiosError } from 'axios'
import {
  useAcademicPeriods,
  useCreateAcademicPeriod,
  useUpdateAcademicPeriod,
  useDeleteAcademicPeriod,
} from '../hooks/useClasses'
import { toast } from '../../../lib/toast'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Skeleton } from '../../../components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog'
import type { AcademicPeriod } from '@education-gestor/types'

interface PeriodFormData {
  name: string
  startDate: string
  endDate: string
}

const emptyForm: PeriodFormData = { name: '', startDate: '', endDate: '' }

export function AcademicPeriodsPage() {
  const { data: periods, isLoading } = useAcademicPeriods()
  const createMutation = useCreateAcademicPeriod()
  const updateMutation = useUpdateAcademicPeriod()
  const deleteMutation = useDeleteAcademicPeriod()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AcademicPeriod | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState<PeriodFormData>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof PeriodFormData, string>>>({})

  function handleCreate() {
    setEditing(undefined)
    setForm(emptyForm)
    setErrors({})
    createMutation.reset()
    setDialogOpen(true)
  }

  function handleEdit(period: AcademicPeriod) {
    setEditing(period)
    setForm({
      name: period.name,
      // Formata para yyyy-MM-dd para o input type="date"
      startDate: period.startDate.slice(0, 10),
      endDate: period.endDate.slice(0, 10),
    })
    setErrors({})
    updateMutation.reset()
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    setDeleteTarget(id)
  }

  function handleClose() {
    setDialogOpen(false)
    setEditing(undefined)
    setForm(emptyForm)
    setErrors({})
    createMutation.reset()
    updateMutation.reset()
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof PeriodFormData, string>> = {}
    if (!form.name) errs.name = 'Nome é obrigatório'
    if (!form.startDate) errs.startDate = 'Data de início é obrigatória'
    if (!form.endDate) errs.endDate = 'Data de fim é obrigatória'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    if (editing) {
      updateMutation.mutate(
        {
          id: editing.id,
          data: {
            name: form.name,
            startDate: form.startDate,
            endDate: form.endDate,
          },
        },
        {
          onSuccess: () => {
            toast.success('Período letivo atualizado')
            handleClose()
          },
          onError: (err) => {
            toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Erro inesperado')
          },
        },
      )
    } else {
      createMutation.mutate(
        { name: form.name, startDate: form.startDate, endDate: form.endDate },
        {
          onSuccess: () => {
            toast.success('Período letivo criado com sucesso')
            handleClose()
          },
          onError: (err) => {
            toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Erro inesperado')
          },
        },
      )
    }
  }

  const activeMutation = editing ? updateMutation : createMutation
  const isPending = activeMutation.isPending
  const apiError = (activeMutation.error as AxiosError<{ message: string }>)?.response?.data?.message

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Períodos Letivos</h1>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Novo período
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {periods?.length ?? 0} períodos cadastrados
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
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(p.startDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(p.endDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell />
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
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

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar período' : 'Novo período'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: 1º Semestre 2025"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <Label>Data início *</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
            </div>
            <div className="space-y-1">
              <Label>Data fim *</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
            </div>
            {apiError && <p className="text-xs text-destructive">{apiError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteMutation.mutate(deleteTarget!, {
                  onSuccess: () => {
                    toast.success('Período letivo removido')
                    setDeleteTarget(null)
                  },
                  onError: (err) => {
                    toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Erro inesperado')
                    setDeleteTarget(null)
                  },
                })
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
