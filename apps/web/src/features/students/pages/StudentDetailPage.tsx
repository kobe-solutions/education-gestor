import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  FileText,
  User,
  Users,
  CreditCard,
  MapPin,
  HeartPulse,
  BookOpen,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useStudent,
  useStudentGuardians,
  useAddGuardian,
  useDeleteGuardian,
  useStudentMedical,
} from '../hooks/useStudents'
import { useStudentTuitions } from '../../financial/hooks/useFinancial'
import { useStudentClasses } from '../../classes/hooks/useClasses'
import { TuitionStatusBadge } from '../../financial/components/TuitionStatusBadge'
import { fmtBRL, formatDateBR } from '../../../lib/format'
import { toast } from '../../../lib/toast'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Badge } from '../../../components/ui/badge'
import { StatusBadge } from '../../../components/StatusBadge'
import { Breadcrumbs } from '../../../components/Breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'

const guardianSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  relationship: z.string().min(1, 'Parentesco obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  profession: z.string().optional(),
  isResponsible: z.boolean().optional(),
  isAuthorizedPickup: z.boolean().optional(),
})

type GuardianForm = z.infer<typeof guardianSchema>

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: student, isLoading } = useStudent(id!)
  const { data: guardians } = useStudentGuardians(id!)
  const { data: tuitions } = useStudentTuitions(id!)
  const { data: medical } = useStudentMedical(id!)
  const { data: studentClasses = [] } = useStudentClasses(id!)

  const addGuardian = useAddGuardian(id!)
  const deleteGuardian = useDeleteGuardian(id!)
  const [guardianDialogOpen, setGuardianDialogOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuardianForm>({
    resolver: zodResolver(guardianSchema),
    defaultValues: { isResponsible: false, isAuthorizedPickup: false },
  })

  function onAddGuardian(data: GuardianForm) {
    addGuardian.mutate(
      {
        ...data,
        email: data.email || null,
        phone: data.phone ?? null,
        cpf: data.cpf ?? null,
        profession: data.profession ?? null,
        isResponsible: !!data.isResponsible,
        isAuthorizedPickup: !!data.isAuthorizedPickup,
      },
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
        <p className="text-sm text-muted-foreground">Carregando aluno...</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm text-destructive font-medium">Aluno não encontrado</p>
        <Button size="sm" variant="outline" onClick={() => navigate('/students')}>
          Voltar para lista
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Pessoas', to: '/people' },
          { label: 'Alunos', to: '/students' },
          { label: student.name },
        ]}
      />

      {/* Header Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/students')}
                className="shrink-0"
                title="Voltar para lista de alunos"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="h-16 w-16 rounded-full border-2 border-primary/20 bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0 overflow-hidden">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(student.name)
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground truncate">
                  {student.name}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="mono text-xs text-muted-foreground">
                    Matrícula: {student.enrollmentCode}
                  </span>
                  {student.internalCode && (
                    <span className="text-xs text-muted-foreground">
                      · Cód. {student.internalCode}
                    </span>
                  )}
                  <StatusBadge status={student.enrollmentStatus} kind="enrollment" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <Link to={`/students/${id}/report`}>
                <Button size="sm" variant="outline">
                  <FileText className="h-4 w-4 mr-1.5" />
                  Boletim
                </Button>
              </Link>
              <Link to={`/students/${id}/edit`}>
                <Button size="sm">
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Editar aluno
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Informações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna Principal (2 terços no desktop) */}
        <div className="md:col-span-2 space-y-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Dados pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium mt-0.5 truncate">{student.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm font-medium mt-0.5">{student.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nascimento</p>
                  <p className="text-sm font-medium mt-0.5">
                    {student.birthDate ? formatDateBR(student.birthDate) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sexo</p>
                  <p className="text-sm font-medium mt-0.5">
                    {student.sex === 'M' ? 'Masculino' : student.sex === 'F' ? 'Feminino' : student.sex || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CPF</p>
                  <p className="text-sm font-medium mt-0.5">{student.cpf || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">RG</p>
                  <p className="text-sm font-medium mt-0.5">{student.rg || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo sanguíneo</p>
                  <p className="text-sm font-medium mt-0.5">{student.bloodType || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Naturalidade</p>
                  <p className="text-sm font-medium mt-0.5">{student.naturalidade || '—'}</p>
                </div>
              </div>

              {(student.comorbidities || student.observations) && (
                <div className="pt-4 border-t space-y-3">
                  {student.comorbidities && (
                    <div>
                      <p className="text-xs text-muted-foreground">Comorbidades</p>
                      <p className="text-sm mt-0.5">{student.comorbidities}</p>
                    </div>
                  )}
                  {student.observations && (
                    <div>
                      <p className="text-xs text-muted-foreground">Observações</p>
                      <p className="text-sm mt-0.5 whitespace-pre-wrap">{student.observations}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Família & Endereço */}
          {(student.motherName || student.fatherName || student.addressStreet || student.addressCity) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Família & Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(student.motherName || student.fatherName || student.motherPhone) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {student.motherName && (
                      <div>
                        <p className="text-xs text-muted-foreground">Nome da mãe</p>
                        <p className="text-sm font-medium mt-0.5">{student.motherName}</p>
                      </div>
                    )}
                    {student.motherPhone && (
                      <div>
                        <p className="text-xs text-muted-foreground">Telefone da mãe</p>
                        <p className="text-sm font-medium mt-0.5">{student.motherPhone}</p>
                      </div>
                    )}
                    {student.fatherName && (
                      <div>
                        <p className="text-xs text-muted-foreground">Nome do pai</p>
                        <p className="text-sm font-medium mt-0.5">{student.fatherName}</p>
                      </div>
                    )}
                  </div>
                )}

                {(student.addressStreet || student.addressCity) && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">Endereço residencial</p>
                    <p className="text-sm font-medium mt-0.5">
                      {[
                        student.addressStreet,
                        student.addressNumber,
                        student.addressComplement,
                        student.addressNeighborhood,
                        student.addressCity && student.addressState
                          ? `${student.addressCity}/${student.addressState}`
                          : student.addressCity,
                        student.addressCep ? `CEP: ${student.addressCep}` : undefined,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Responsáveis */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Responsáveis
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setGuardianDialogOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!guardians || guardians.length === 0 ? (
                <p className="text-xs text-center py-6 text-muted-foreground">
                  Nenhum responsável cadastrado
                </p>
              ) : (
                <div className="space-y-3">
                  {guardians.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-start justify-between rounded-lg p-3 border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-foreground">{g.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {g.relationship}
                          {g.phone ? ` · ${g.phone}` : ''}
                          {g.email ? ` · ${g.email}` : ''}
                          {g.cpf ? ` · CPF: ${g.cpf}` : ''}
                        </p>
                        <div className="flex gap-1.5 pt-1">
                          {g.isResponsible && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                              Responsável legal
                            </Badge>
                          )}
                          {g.isAuthorizedPickup && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                              Autorizado a buscar
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Remover responsável"
                        aria-label="Remover responsável"
                        onClick={() => onDeleteGuardian(g.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral (1 terço no desktop) */}
        <div className="space-y-6">
          {/* Turmas Matriculadas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Turmas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentClasses.length === 0 ? (
                <p className="text-xs text-center py-4 text-muted-foreground">
                  Sem turmas vinculadas
                </p>
              ) : (
                <div className="space-y-2">
                  {studentClasses.map((c) => (
                    <div key={c.id} className="flex items-center justify-between border rounded-md p-2.5">
                      <span className="text-sm font-medium">{c.name}</span>
                      <Link to={`/classes/${c.id}`}>
                        <Button size="sm" variant="ghost" className="text-xs h-7 px-2">
                          Ver turma
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ficha Médica */}
          {medical &&
            (medical.allergies ||
              medical.medications ||
              medical.foodRestrictions ||
              medical.diseases ||
              medical.medicalContact) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-primary" />
                    Ficha Médica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {medical.allergies && (
                    <div>
                      <p className="text-xs text-muted-foreground">Alergias</p>
                      <p className="font-medium mt-0.5">{medical.allergies}</p>
                    </div>
                  )}
                  {medical.medications && (
                    <div>
                      <p className="text-xs text-muted-foreground">Medicamentos em uso</p>
                      <p className="font-medium mt-0.5">{medical.medications}</p>
                    </div>
                  )}
                  {medical.foodRestrictions && (
                    <div>
                      <p className="text-xs text-muted-foreground">Restrições alimentares</p>
                      <p className="font-medium mt-0.5">{medical.foodRestrictions}</p>
                    </div>
                  )}
                  {medical.diseases && (
                    <div>
                      <p className="text-xs text-muted-foreground">Doenças crônicas</p>
                      <p className="font-medium mt-0.5">{medical.diseases}</p>
                    </div>
                  )}
                  {medical.medicalContact && (
                    <div>
                      <p className="text-xs text-muted-foreground">Contato médico</p>
                      <p className="font-medium mt-0.5">{medical.medicalContact}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Mensalidades */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Mensalidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!tuitions || tuitions.length === 0 ? (
                <p className="text-xs text-center py-6 text-muted-foreground">
                  Nenhuma mensalidade registrada
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="Mensalidades do aluno">
                    <thead>
                      <tr className="border-b text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                        <th className="text-left py-2 px-2">Vencimento</th>
                        <th className="text-left py-2 px-2">Valor</th>
                        <th className="text-left py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tuitions.map((t) => (
                        <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-2 text-xs">{formatDateBR(t.dueDate)}</td>
                          <td className="py-2 px-2 text-xs tabular-nums font-medium">{fmtBRL(t.amount)}</td>
                          <td className="py-2 px-2">
                            <TuitionStatusBadge status={t.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Adicionar Responsável */}
      <Dialog open={guardianDialogOpen} onOpenChange={(v) => !v && setGuardianDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar responsável</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onAddGuardian)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nome completo *</Label>
              <Input {...register('name')} placeholder="Nome do responsável" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Parentesco *</Label>
              <Input placeholder="Ex: Mãe, Pai, Avó..." {...register('relationship')} />
              {errors.relationship && (
                <p className="text-xs text-destructive">{errors.relationship.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" {...register('email')} placeholder="email@exemplo.com" />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input {...register('phone')} placeholder="(00) 00000-0000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CPF</Label>
                <Input {...register('cpf')} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-1.5">
                <Label>Profissão</Label>
                <Input {...register('profession')} placeholder="Ex: Engenheiro(a)" />
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isResponsible"
                  {...register('isResponsible')}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
                <Label htmlFor="isResponsible" className="text-sm font-normal cursor-pointer">
                  Responsável legal / financeiro
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isAuthorizedPickup"
                  {...register('isAuthorizedPickup')}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
                <Label htmlFor="isAuthorizedPickup" className="text-sm font-normal cursor-pointer">
                  Autorizado a buscar o aluno
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setGuardianDialogOpen(false)
                  reset()
                }}
              >
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

