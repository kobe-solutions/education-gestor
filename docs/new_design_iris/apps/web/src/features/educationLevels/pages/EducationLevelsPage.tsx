import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AxiosError } from 'axios'
import {
  useEducationLevels,
  useCreateEducationLevel,
  useUpdateEducationLevel,
  useDeleteEducationLevel,
  EDUCATION_LEVEL_TYPE_LABELS,
  EDUCATION_MODALITY_LABELS,
} from '../hooks/useEducationLevels'
import type { EducationLevel } from '../hooks/useEducationLevels'
import { toast } from '../../../lib/toast'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
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

const LEVEL_TYPES = Object.entries(EDUCATION_LEVEL_TYPE_LABELS)
const MODALITIES = Object.entries(EDUCATION_MODALITY_LABELS)

const schema = z.object({
  type: z.string().min(1, 'Tipo obrigatório'),
  modality: z.string().optional(),
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
})

type FormData = z.infer<typeof schema>

export function EducationLevelsPage() {
  const navigate = useNavigate()
  const { data: levels, isLoading } = useEducationLevels()
  const createMutation = useCreateEducationLevel()
  const updateMutation = useUpdateEducationLevel()
  const deleteMutation = useDeleteEducationLevel()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EducationLevel | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: '', modality: '', name: '' },
  })

  const typeValue = watch('type')
  const modalityValue = watch('modality')

  function handleCreate() {
    setEditing(undefined)
    reset({ type: '', modality: '', name: '' })
    setDialogOpen(true)
  }

  function handleEdit(level: EducationLevel) {
    setEditing(level)
    reset({ type: level.type, modality: level.modality ?? '', name: level.name })
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
    setEditing(undefined)
    reset({ type: '', modality: '', name: '' })
  }

  function onSubmit(data: FormData) {
    const payload = {
      type: data.type,
      modality: data.modality || undefined,
      name: data.name,
    }

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Nível atualizado')
            handleClose()
          },
          onError: (err) => {
            const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message
            toast.error(msg ?? 'Erro inesperado')
          },
        },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Nível criado com sucesso')
          handleClose()
        },
        onError: (err) => {
          const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message
          toast.error(msg ?? 'Erro inesperado')
        },
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Níveis de Ensino</h1>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Novo nível
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {levels?.length ?? 0} níveis cadastrados
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels?.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell className="font-medium">{level.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {EDUCATION_LEVEL_TYPE_LABELS[level.type] ?? level.type}
                    </TableCell>
                    <TableCell>
                      {level.modality
                        ? <Badge variant="outline">{EDUCATION_MODALITY_LABELS[level.modality] ?? level.modality}</Badge>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={level.active ? 'default' : 'secondary'}>
                        {level.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver séries"
                          onClick={() => navigate(`/education-levels/${level.id}/series`)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(level)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(level.id)}>
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
            <DialogTitle>{editing ? 'Editar nível' : 'Novo nível de ensino'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Tipo *</Label>
              <Select value={typeValue} onValueChange={(v) => setValue('type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_TYPES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Modalidade (opcional)</Label>
              <Select value={modalityValue ?? ''} onValueChange={(v) => setValue('modality', v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma modalidade específica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {MODALITIES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input placeholder="Ex: Ensino Fundamental 1" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
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
            <AlertDialogDescription>
              Todas as séries vinculadas a este nível também serão removidas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteMutation.mutate(deleteTarget!, {
                  onSuccess: () => {
                    toast.success('Nível removido')
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
