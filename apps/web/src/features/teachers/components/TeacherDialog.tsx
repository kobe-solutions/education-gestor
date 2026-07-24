import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AxiosError } from 'axios'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { useCreateTeacher, useUpdateTeacher } from '../hooks/useTeachers'
import { toast } from '../../../lib/toast'
import type { Teacher } from '@education-gestor/types'

const createSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

const editSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  password: z.string().optional(),
})

interface TeacherDialogProps {
  open: boolean
  onClose: () => void
  teacher?: Teacher
}

export function TeacherDialog({ open, onClose, teacher }: TeacherDialogProps) {
  const isEdit = !!teacher
  const schema = isEdit ? editSchema : createSchema
  type FormData = z.infer<typeof createSchema>

  const createMutation = useCreateTeacher()
  const updateMutation = useUpdateTeacher(teacher?.id ?? '')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema as any),
    defaultValues: { name: '', email: '', password: '' },
  })

  useEffect(() => {
    if (teacher) {
      reset({ name: teacher.name, email: teacher.email, password: '' })
    } else {
      reset({ name: '', email: '', password: '' })
    }
  }, [teacher, reset])

  function onSubmit(data: FormData) {
    const payload = isEdit
      ? { name: data.name, email: data.email, ...(data.password ? { password: data.password } : {}) }
      : data
    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(payload as any, {
      onSuccess: () => {
        toast.success(isEdit ? 'Professor atualizado' : 'Professor criado com sucesso')
        onClose()
      },
      onError: (err) => {
        const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message
        toast.error(msg ?? 'Erro inesperado')
      },
    })
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar professor' : 'Novo professor'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input placeholder="Nome completo" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>{isEdit ? 'Nova senha (opcional)' : 'Senha'}</Label>
            <Input type="password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
