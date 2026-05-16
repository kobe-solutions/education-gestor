import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Plus, Pencil, Trash2, ArrowLeft, HelpCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AxiosError } from 'axios'
import { useSeries, useCreateSerie, useUpdateSerie, useDeleteSerie } from '../hooks/useSeries'
import type { Serie } from '../hooks/useSeries'
import { useEducationLevels, EDUCATION_LEVEL_TYPE_LABELS } from '../../educationLevels/hooks/useEducationLevels'
import { toast } from '../../../lib/toast'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Skeleton } from '../../../components/ui/skeleton'
import { Tooltip, TooltipProvider } from '../../../components/ui/tooltip'
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

const schema = z.object({
  educationLevelId: z.string().uuid('Nível obrigatório'),
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  order: z.coerce.number().int().min(0).optional(),
})

type FormData = z.infer<typeof schema>

export function SeriesPage() {
  const { levelId } = useParams<{ levelId?: string }>()
  const navigate = useNavigate()
  const { data: series, isLoading } = useSeries(levelId)
  const { data: levels } = useEducationLevels()
  const createMutation = useCreateSerie()
  const updateMutation = useUpdateSerie()
  const deleteMutation = useDeleteSerie()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Serie | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const currentLevel = levelId ? levels?.find((l) => l.id === levelId) : undefined

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { educationLevelId: levelId ?? '', name: '', order: 0 },
  })

  const levelIdValue = watch('educationLevelId')

  function handleCreate() {
    setEditing(undefined)
    reset({ educationLevelId: levelId ?? '', name: '', order: 0 })
    setDialogOpen(true)
  }

  function handleEdit(serie: Serie) {
    setEditing(serie)
    reset({ educationLevelId: serie.educationLevelId, name: serie.name, order: serie.order })
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
    setEditing(undefined)
    reset({ educationLevelId: levelId ?? '', name: '', order: 0 })
  }

  function onSubmit(data: FormData) {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: { name: data.name, order: data.order } },
        {
          onSuccess: () => {
            toast.success('Série atualizada')
            handleClose()
          },
          onError: (err) => {
            const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message
            toast.error(msg ?? 'Erro inesperado')
          },
        },
      )
    } else {
      createMutation.mutate(
        { educationLevelId: data.educationLevelId, name: data.name, order: data.order },
        {
          onSuccess: () => {
            toast.success('Série criada com sucesso')
            handleClose()
          },
          onError: (err) => {
            const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message
            toast.error(msg ?? 'Erro inesperado')
          },
        },
      )
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/education-levels')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">
            {currentLevel ? `Séries — ${currentLevel.name}` : 'Séries'}
          </h1>
          {currentLevel && (
            <p className="text-sm text-muted-foreground">
              {EDUCATION_LEVEL_TYPE_LABELS[currentLevel.type] ?? currentLevel.type}
            </p>
          )}
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Nova série
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {series?.length ?? 0} séries cadastradas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sequência</TableHead>
                  <TableHead>Nome</TableHead>
                  {!levelId && <TableHead>Nível de Ensino</TableHead>}
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {series?.map((serie) => (
                  <TableRow key={serie.id}>
                    <TableCell className="text-muted-foreground w-16">{serie.order}</TableCell>
                    <TableCell className="font-medium">{serie.name}</TableCell>
                    {!levelId && (
                      <TableCell className="text-muted-foreground text-sm">
                        {serie.educationLevel?.name ?? '—'}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(serie)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(serie.id)}>
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
            <DialogTitle>{editing ? 'Editar série' : 'Nova série'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!editing && (
              <div className="space-y-1">
                <Label>Nível de ensino *</Label>
                <Select value={levelIdValue} onValueChange={(v) => setValue('educationLevelId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels?.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.educationLevelId && (
                  <p className="text-xs text-destructive">{errors.educationLevelId.message}</p>
                )}
              </div>
            )}
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input placeholder="Ex: 1º ano" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Label>Posição na sequência</Label>
                <TooltipProvider>
                  <Tooltip content="Define a ordem de exibição das séries dentro do nível. Ex: 1º ano = 1, 2º ano = 2, 3º ano = 3.">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-default" />
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input type="number" min={0} placeholder="Ex: 1" {...register('order')} />
              {errors.order && <p className="text-xs text-destructive">{errors.order.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Salvando...' : 'Salvar'}</Button>
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
                    toast.success('Série removida')
                    setDeleteTarget(null)
                  },
                  onError: (err) => {
                    const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message
                    toast.error(msg ?? 'Erro inesperado')
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
