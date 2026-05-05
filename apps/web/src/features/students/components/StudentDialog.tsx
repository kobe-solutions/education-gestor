import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { useCreateStudent, useUpdateStudent } from '../hooks/useStudents'
import type { Student } from '@education-gestor/types'

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  birthDate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface StudentDialogProps {
  open: boolean
  onClose: () => void
  student?: Student
}

export function StudentDialog({ open, onClose, student }: StudentDialogProps) {
  const isEdit = !!student
  const createMutation = useCreateStudent()
  const updateMutation = useUpdateStudent(student?.id ?? '')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', birthDate: '' },
  })

  useEffect(() => {
    if (student) {
      reset({ name: student.name, email: student.email ?? '', birthDate: student.birthDate ?? '' })
    } else {
      reset({ name: '', email: '', birthDate: '' })
    }
  }, [student, reset])

  function onSubmit(data: FormData) {
    const payload = { ...data, email: data.email || undefined, birthDate: data.birthDate || undefined }
    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(payload as any, { onSuccess: onClose })
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar aluno' : 'Novo aluno'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input placeholder="Nome completo" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" placeholder="email@exemplo.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Data de nascimento</Label>
            <Input type="date" {...register('birthDate')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
