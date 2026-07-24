import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Link } from 'react-router'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useStudent, useStudentGuardians, useAddGuardian, useDeleteGuardian } from '../hooks/useStudents'
import { useStudentTuitions } from '../../financial/hooks/useFinancial'
import { TuitionStatusBadge } from '../../financial/components/TuitionStatusBadge'
import { fmtBRL, formatDateBR } from '../../../lib/format'
import { toast } from '../../../lib/toast'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'

const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  transferred: 'Transferido',
  cancelled: 'Cancelado',
}

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
  const deleteGuardian = useDeleteGuardian(id!)
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
      {
        onSuccess: () => {
          toast.success('Responsável adicionado')
          setGuardianDialogOpen(false)
          reset()
        },
      },
    )
  }

  function onDeleteGuardian(guardianId: string) {
    deleteGuardian.mutate(guardianId, {
      onSuccess: () => toast.success('Responsável removido'),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Carregando...</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm" style={{ color: 'hsl(var(--destructive))' }}>Aluno não encontrado</p>
        <Button size="sm" variant="outline" onClick={() => navigate('/students')}>
          Voltar para lista
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center justify-center rounded-md w-8 h-8 transition-colors shrink-0"
          title="Voltar"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--primary) / 0.1)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
        >
          <ArrowLeft size={16} style={{ color: 'hsl(var(--foreground))' }} />
        </button>

        <div className="flex-1 min-w-0">
          <h1
            className="font-bold truncate"
            style={{ fontSize: 20, color: 'hsl(var(--primary))', letterSpacing: '-0.01em' }}
          >
            {student.name}
          </h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="mono text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Matrícula: {student.enrollmentCode}
            </span>
            <Badge
              variant={student.enrollmentStatus === 'active' ? 'success' : student.enrollmentStatus === 'transferred' ? 'warning' : 'outline'}
              className="text-[10px] h-4 px-1.5"
            >
              {ENROLLMENT_STATUS_LABELS[student.enrollmentStatus]}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to={`/students/${id}/report`}>
            <Button size="sm" variant="outline">Ver boletim</Button>
          </Link>
          <Link to={`/students/${id}`}>
            <Button size="sm">Editar aluno</Button>
          </Link>
        </div>
      </div>

      {/* Dados pessoais */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}
      >
        <h2 className="font-semibold text-sm mb-4" style={{ color: 'hsl(var(--primary))' }}>
          Dados pessoais
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { label: 'Email', value: student.email ?? '—' },
            { label: 'Nascimento', value: student.birthDate ?? '—' },
            { label: 'Telefone', value: student.phone ?? '—' },
            { label: 'CPF', value: student.cpf ?? '—' },
            { label: 'RG', value: student.rg ?? '—' },
            { label: 'Sexo', value: student.sex === 'M' ? 'Masculino' : student.sex === 'F' ? 'Feminino' : student.sex ?? '—' },
            { label: 'Tipo sanguíneo', value: student.bloodType ?? '—' },
            { label: 'Naturalidade', value: student.naturalidade ?? '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'hsl(var(--primary))' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Responsáveis */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center justify-between p-5 pb-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'hsl(var(--primary))' }}>
            Responsáveis
          </h2>
          <Button size="sm" variant="outline" onClick={() => setGuardianDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar
          </Button>
        </div>

        <div className="p-5">
          {!guardians || guardians.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Nenhum responsável cadastrado
            </p>
          ) : (
            <div className="space-y-2">
              {guardians.map((g) => (
                <div
                  key={g.id}
                  className="flex items-start justify-between rounded-md px-3 py-2.5"
                  style={{ border: '1px solid hsl(var(--border))' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'hsl(var(--primary))' }}>{g.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {g.relationship}
                      {g.phone ? ` · ${g.phone}` : ''}
                      {g.email ? ` · ${g.email}` : ''}
                    </p>
                    <div className="flex gap-1 mt-1.5">
                      {g.isResponsible && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">Responsável</Badge>
                      )}
                      {g.isAuthorizedPickup && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">Autorizado a buscar</Badge>
                      )}
                    </div>
                  </div>
                  <button
                    className="flex items-center justify-center rounded-sm w-7 h-7 transition-colors shrink-0"
                    title="Remover"
                    onClick={() => onDeleteGuardian(g.id)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(0 86% 97%)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                  >
                    <Trash2 size={13} style={{ color: 'hsl(var(--destructive))' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mensalidades */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="p-5 pb-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'hsl(var(--primary))' }}>
            Mensalidades
          </h2>
        </div>

        <div className="p-5">
          {!tuitions || tuitions.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Nenhuma mensalidade registrada
            </p>
          ) : (
            <div className="table-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tuitions.map((t) => (
                    <tr key={t.id}>
                      <td>{formatDateBR(t.dueDate)}</td>
                      <td className="tabular-nums">{fmtBRL(t.amount)}</td>
                      <td><TuitionStatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dialog: adicionar responsável */}
      <Dialog open={guardianDialogOpen} onOpenChange={(v) => !v && setGuardianDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar responsável</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onAddGuardian)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input {...register('name')} placeholder="Nome completo" />
              {errors.name && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Parentesco *</Label>
              <Input placeholder="Ex: Mãe, Pai, Avó..." {...register('relationship')} />
              {errors.relationship && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.relationship.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" {...register('email')} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input {...register('phone')} placeholder="(00) 00000-0000" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setGuardianDialogOpen(false); reset() }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={addGuardian.isPending}>
                {addGuardian.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
