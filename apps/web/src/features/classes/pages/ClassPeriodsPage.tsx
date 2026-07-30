import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useClassPeriods,
  useCreateClassPeriod,
  useUpdateClassPeriod,
  useDeleteClassPeriod,
  type ClassPeriod,
} from '../hooks/useClasses'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { PageHead } from '../../../components/PageHead'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Skeleton } from '../../../components/ui/skeleton'
import { ConfirmDialog } from '../../../components/ConfirmDialog'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  order: z.coerce.number().int().min(1, 'Ordem obrigatória'),
})

type FormData = z.infer<typeof schema>

export function ClassPeriodsPage() {
  const navigate = useNavigate()
  const { data: periods, isLoading } = useClassPeriods()
  const createMutation = useCreateClassPeriod()
  const updateMutation = useUpdateClassPeriod()
  const deleteMutation = useDeleteClassPeriod()

  const createApiMutation = useApiMutation({
    mutationFn: (data: FormData) => createMutation.mutateAsync(data),
    successMessage: 'Período de aula criado',
    onSuccess: () => handleClose(),
  })

  const updateApiMutation = useApiMutation({
    mutationFn: (vars: { id: string; data: Partial<FormData> }) => updateMutation.mutateAsync(vars),
    successMessage: 'Período de aula atualizado',
    onSuccess: () => handleClose(),
  })

  const deleteApiMutation = useApiMutation({
    mutationFn: (id: string) => deleteMutation.mutateAsync(id),
    successMessage: 'Período removido',
    onSuccess: () => setDeleteTarget(null),
    onError: () => setDeleteTarget(null),
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ClassPeriod | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', startTime: '', endTime: '', order: 1 },
  })

  function handleCreate() {
    setEditing(undefined)
    reset({ name: '', startTime: '', endTime: '', order: (periods?.length ?? 0) + 1 })
    setDialogOpen(true)
  }

  function handleEdit(period: ClassPeriod) {
    setEditing(period)
    reset({
      name: period.name,
      startTime: period.startTime,
      endTime: period.endTime,
      order: period.order,
    })
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
    setEditing(undefined)
    reset({ name: '', startTime: '', endTime: '', order: 1 })
  }

  function onSubmit(data: FormData) {
    if (editing) {
      updateApiMutation.mutate({ id: editing.id, data })
    } else {
      createApiMutation.mutate(data)
    }
  }

  const isPending = createApiMutation.isPending || updateApiMutation.isPending
  const sorted = [...(periods ?? [])].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-5">
      <PageHead
        title="Períodos de Aula"
        subtitle="Defina os blocos de horário usados na grade horária (ex: 1º tempo, 2º tempo)"
        backTo={() => navigate(-1)}
        actions={
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Novo período
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {sorted.length} períodos cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Nenhum período cadastrado ainda.
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-1"
                onClick={handleCreate}
              >
                Cadastrar agora
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ordem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell className="text-muted-foreground">{period.order}</TableCell>
                    <TableCell className="font-medium">{period.name}</TableCell>
                    <TableCell className="font-mono text-sm">{period.startTime}</TableCell>
                    <TableCell className="font-mono text-sm">{period.endTime}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => handleEdit(period)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setDeleteTarget(period.id)}>
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
            <DialogTitle>{editing ? 'Editar período de aula' : 'Novo período de aula'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input placeholder="Ex: 1º Tempo" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Início *</Label>
                <Input type="time" {...register('startTime')} />
                {errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Fim *</Label>
                <Input type="time" {...register('endTime')} />
                {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Ordem *</Label>
                <Input type="number" min={1} {...register('order')} />
                {errors.order && <p className="text-xs text-destructive">{errors.order.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Salvando…' : 'Salvar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => {
          deleteApiMutation.mutate(deleteTarget!)
        }}
        onCancel={() => setDeleteTarget(null)}
        description="Este período será removido. Todos os horários da grade que usam este período também serão excluídos automaticamente."
      />
    </div>
  )
}