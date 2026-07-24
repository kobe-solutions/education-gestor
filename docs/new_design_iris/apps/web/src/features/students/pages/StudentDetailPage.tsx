import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Link } from 'react-router'
import { ArrowLeft, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useStudent, useStudentGuardians, useAddGuardian } from '../hooks/useStudents'
import { useStudentTuitions } from '../../financial/hooks/useFinancial'
import { TuitionStatusBadge } from '../../financial/components/TuitionStatusBadge'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'

const guardianSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  relationship: z.string().min(1, 'Parentesco obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
})

type GuardianForm = z.infer<typeof guardianSchema>

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: student, isLoading } = useStudent(id!)
  const { data: guardians } = useStudentGuardians(id!)
  const { data: tuitions } = useStudentTuitions(id!)
  const addGuardian = useAddGuardian(id!)
  const [guardianDialogOpen, setGuardianDialogOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuardianForm>({ resolver: zodResolver(guardianSchema) })

  function onAddGuardian(data: GuardianForm) {
    addGuardian.mutate(
      { ...data, email: data.email || null, phone: data.phone ?? null, cpf: null, profession: null, isResponsible: false, isAuthorizedPickup: false },
      { onSuccess: () => { setGuardianDialogOpen(false); reset() } },
    )
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>
  if (!student) return <p className="text-sm text-destructive">Aluno não encontrado</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/students')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">{student.name}</h1>
        <div className="ml-auto">
          <Link to={`/students/${id}/report`}>
            <Button size="sm" variant="outline">Ver boletim</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Dados do aluno</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Email:</span> {student.email ?? '—'}</div>
            <div><span className="text-muted-foreground">Nascimento:</span> {student.birthDate ?? '—'}</div>
            <div><span className="text-muted-foreground">Matrícula:</span> <span className="font-mono">{student.enrollmentCode}</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Responsáveis</h2>
          <Button size="sm" variant="outline" onClick={() => setGuardianDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Parentesco</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guardians?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum responsável</TableCell>
                  </TableRow>
                )}
                {guardians?.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell>{g.name}</TableCell>
                    <TableCell>{g.relationship}</TableCell>
                    <TableCell>{g.email ?? '—'}</TableCell>
                    <TableCell>{g.phone ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Mensalidades</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!tuitions?.length && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">Nenhuma mensalidade</TableCell>
                  </TableRow>
                )}
                {tuitions?.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{new Date(t.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>R$ {parseFloat(t.amount).toFixed(2)}</TableCell>
                    <TableCell><TuitionStatusBadge status={t.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={guardianDialogOpen} onOpenChange={(v) => !v && setGuardianDialogOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar responsável</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onAddGuardian)} className="space-y-4">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Parentesco</Label>
              <Input placeholder="Ex: Mãe, Pai, Avó..." {...register('relationship')} />
              {errors.relationship && <p className="text-xs text-destructive">{errors.relationship.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input {...register('phone')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGuardianDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={addGuardian.isPending}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
