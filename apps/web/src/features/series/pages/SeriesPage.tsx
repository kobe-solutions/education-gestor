import { Fragment, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Plus, Pencil, Trash2, ArrowLeft, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSeries, useCreateSerie, useUpdateSerie, useDeleteSerie } from '../hooks/useSeries'
import type { Serie } from '../hooks/useSeries'
import { useEducationLevels, EDUCATION_LEVEL_TYPE_LABELS } from '../../educationLevels/hooks/useEducationLevels'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Skeleton } from '../../../components/ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from '../../../components/ui/tooltip'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { useClasses } from '../../classes/hooks/useClasses'
import { ClassDialog } from '../../classes/components/ClassDialog'
import { formatShiftLabel } from '../../../lib/labels'

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
  const { data: classes, isLoading: loadingClasses } = useClasses()
  const createMutation = useCreateSerie()
  const updateMutation = useUpdateSerie()
  const deleteMutation = useDeleteSerie()

  const createApiMutation = useApiMutation({
    mutationFn: (data: { educationLevelId: string; name: string; order?: number }) => createMutation.mutateAsync(data),
    successMessage: 'Série criada com sucesso',
    onSuccess: () => handleClose(),
  })

  const updateApiMutation = useApiMutation({
    mutationFn: (vars: { id: string; data: { name: string; order?: number } }) => updateMutation.mutateAsync(vars),
    successMessage: 'Série atualizada',
    onSuccess: () => handleClose(),
  })

  const deleteApiMutation = useApiMutation({
    mutationFn: (id: string) => deleteMutation.mutateAsync(id),
    successMessage: 'Série removida',
    onSuccess: () => setDeleteTarget(null),
    onError: () => setDeleteTarget(null),
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Serie | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [expandedSerieId, setExpandedSerieId] = useState<string | null>(null)
  const [classDialogOpen, setClassDialogOpen] = useState(false)
  const [classSerieId, setClassSerieId] = useState<string | undefined>()

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
      updateApiMutation.mutate({ id: editing.id, data: { name: data.name, order: data.order } })
    } else {
      createApiMutation.mutate({ educationLevelId: data.educationLevelId, name: data.name, order: data.order })
    }
  }

  const isPending = createApiMutation.isPending || updateApiMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => navigate('/education-levels')}>
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
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {series?.map((serie) => {
                  const serieClasses = (classes ?? []).filter((schoolClass) => schoolClass.serieId === serie.id)
                  const isExpanded = expandedSerieId === serie.id

                  return (
                    <Fragment key={serie.id}>
                      <TableRow>
                        <TableCell className="text-muted-foreground w-16">{serie.order}</TableCell>
                        <TableCell className="font-medium">{serie.name}</TableCell>
                        {!levelId && (
                          <TableCell className="text-muted-foreground text-sm">
                            {serie.educationLevel?.name ?? '—'}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" aria-label={isExpanded ? `Ocultar turmas de ${serie.name}` : `Mostrar turmas de ${serie.name}`} aria-expanded={isExpanded} onClick={() => setExpandedSerieId(isExpanded ? null : serie.id)}>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => handleEdit(serie)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setDeleteTarget(serie.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${serie.id}-classes`}>
                          <TableCell colSpan={levelId ? 3 : 4} className="bg-muted/20 p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium">Turmas de {serie.name}</p>
                                <Button size="sm" onClick={() => { setClassSerieId(serie.id); setClassDialogOpen(true) }}>
                                  <Plus className="h-4 w-4" /> Nova turma
                                </Button>
                              </div>
                              {loadingClasses ? (
                                <Skeleton className="h-9 w-full" />
                              ) : serieClasses.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhuma turma cadastrada nesta série.</p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {serieClasses.map((schoolClass) => (
                                    <div key={schoolClass.id} className="rounded-md border bg-background px-3 py-2 text-sm">
                                      <span className="font-medium">{schoolClass.name}</span>
                                      <span className="ml-2 text-muted-foreground">{formatShiftLabel(schoolClass.shift)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
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
                <Label htmlFor="series-level">Nível de ensino *</Label>
                <Select value={levelIdValue} onValueChange={(v) => { if (v !== null) setValue('educationLevelId', v) }}
                  items={levels?.map((l) => ({ value: l.id, label: l.name }))}>
                  <SelectTrigger id="series-level">
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
              <Label htmlFor="series-name">Nome *</Label>
              <Input id="series-name" placeholder="Ex: 1º ano" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Label htmlFor="series-order">Posição na sequência</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-default" />
                  </TooltipTrigger>
                  <TooltipContent>Define a ordem de exibição das séries dentro do nível. Ex: 1º ano = 1, 2º ano = 2, 3º ano = 3.</TooltipContent>
                </Tooltip>
              </div>
              <Input id="series-order" type="number" min={0} placeholder="Ex: 1" {...register('order')} />
              {errors.order && <p className="text-xs text-destructive">{errors.order.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Salvando...' : 'Salvar'}</Button>
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
      />

      <ClassDialog open={classDialogOpen} onClose={() => { setClassDialogOpen(false); setClassSerieId(undefined) }} initialSerieId={classSerieId} />
    </div>
  )
}
