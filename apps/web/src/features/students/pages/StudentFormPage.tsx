import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Upload, Trash2, FileText, Plus, UserCircle2, BookOpen, X } from 'lucide-react'
import { Link } from 'react-router'
import { api } from '../../../lib/api'
import { toast } from '../../../lib/toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'
import {
  useStudent,
  useCreateStudent,
  useUpdateStudent,
  useUploadStudentPhoto,
  useStudentGuardians,
  useAddGuardian,
  useDeleteGuardian,
  useStudentMedical,
  useUpsertMedical,
  useStudentDocuments,
  useUploadDocument,
  useDeleteDocument,
} from '../hooks/useStudents'
import { useClasses, useStudentClasses, useAddStudentToClass } from '../../classes/hooks/useClasses'

function Opt() {
  return <span className="ml-1 text-[10px] font-normal text-muted-foreground">(opcional)</span>
}

// ─── Schemas por aba ──────────────────────────────────────────────────────────

const pessoalSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  sex: z.enum(['M', 'F', 'outro']).optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  naturalidade: z.string().optional(),
  phone: z.string().optional(),
  comorbidities: z.string().optional(),
  observations: z.string().optional(),
})

const familiaSchema = z.object({
  motherName: z.string().optional(),
  fatherName: z.string().optional(),
  motherPhone: z.string().optional(),
  addressCep: z.string().optional(),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
})

const medicalSchema = z.object({
  allergies: z.string().optional(),
  medications: z.string().optional(),
  foodRestrictions: z.string().optional(),
  diseases: z.string().optional(),
  medicalContact: z.string().optional(),
})

const guardianSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  profession: z.string().optional(),
  relationship: z.string().min(1, 'Parentesco obrigatório'),
  isResponsible: z.boolean(),
  isAuthorizedPickup: z.boolean(),
})

type PessoalForm = z.infer<typeof pessoalSchema>
type FamiliaForm = z.infer<typeof familiaSchema>
type MedicalForm = z.infer<typeof medicalSchema>
type GuardianForm = z.infer<typeof guardianSchema>

const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  transferred: 'Transferido',
  cancelled: 'Cancelado',
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  historico: 'Histórico Escolar',
  boletim: 'Boletim de Notas',
  identidade: 'Documento de Identidade',
  outros: 'Outros',
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function StudentFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: student, isLoading } = useStudent(id ?? '')
  const { data: guardians } = useStudentGuardians(id ?? '')
  const { data: medical } = useStudentMedical(id ?? '')
  const { data: documents } = useStudentDocuments(id ?? '')

  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent(id ?? '')
  const uploadPhoto = useUploadStudentPhoto(id ?? '')
  const addGuardian = useAddGuardian(id ?? '')
  const deleteGuardian = useDeleteGuardian(id ?? '')
  const upsertMedical = useUpsertMedical(id ?? '')
  const uploadDocument = useUploadDocument(id ?? '')
  const deleteDocument = useDeleteDocument(id ?? '')

  const queryClient = useQueryClient()
  const { data: allClasses = [] } = useClasses()
  const { data: studentClasses = [] } = useStudentClasses(id ?? '')
  const [classToAdd, setClassToAdd] = useState('')
  const addToClass = useAddStudentToClass(classToAdd)

  async function handleAddToClass() {
    if (!classToAdd || !id) return
    addToClass.mutate(id, {
      onSuccess: () => {
        toast.success('Aluno adicionado à turma')
        queryClient.invalidateQueries({ queryKey: ['student-classes', id] })
        setClassToAdd('')
      },
      onError: () => toast.error('Erro ao adicionar à turma'),
    })
  }

  async function handleRemoveFromClass(classId: string) {
    if (!id) return
    try {
      await api.delete(`/school-classes/${classId}/students/${id}`)
      toast.success('Aluno removido da turma')
      queryClient.invalidateQueries({ queryKey: ['student-classes', id] })
      queryClient.invalidateQueries({ queryKey: ['classes', classId] })
    } catch {
      toast.error('Erro ao remover da turma')
    }
  }

  const photoInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const [docType, setDocType] = useState('outros')
  const [guardianDialogOpen, setGuardianDialogOpen] = useState(false)

  // ── Formulário: dados pessoais ─────────────────────────────────────────────

  const pessoalForm = useForm<PessoalForm>({
    resolver: zodResolver(pessoalSchema),
    values: student ? {
      name: student.name,
      email: student.email ?? '',
      cpf: student.cpf ?? '',
      rg: student.rg ?? '',
      birthDate: student.birthDate ?? '',
      sex: (student.sex as 'M' | 'F' | 'outro') ?? undefined,
      bloodType: (student.bloodType as any) ?? undefined,
      naturalidade: student.naturalidade ?? '',
      phone: student.phone ?? '',
      comorbidities: student.comorbidities ?? '',
      observations: student.observations ?? '',
    } : undefined,
  })

  const familiaForm = useForm<FamiliaForm>({
    resolver: zodResolver(familiaSchema),
    values: student ? {
      motherName: student.motherName ?? '',
      fatherName: student.fatherName ?? '',
      motherPhone: student.motherPhone ?? '',
      addressCep: student.addressCep ?? '',
      addressStreet: student.addressStreet ?? '',
      addressNumber: student.addressNumber ?? '',
      addressComplement: student.addressComplement ?? '',
      addressNeighborhood: student.addressNeighborhood ?? '',
      addressCity: student.addressCity ?? '',
      addressState: student.addressState ?? '',
    } : undefined,
  })

  const medicalForm = useForm<MedicalForm>({
    resolver: zodResolver(medicalSchema),
    values: medical ? {
      allergies: medical.allergies ?? '',
      medications: medical.medications ?? '',
      foodRestrictions: medical.foodRestrictions ?? '',
      diseases: medical.diseases ?? '',
      medicalContact: medical.medicalContact ?? '',
    } : undefined,
  })

  const guardianForm = useForm<GuardianForm>({
    resolver: zodResolver(guardianSchema),
    defaultValues: { isResponsible: false, isAuthorizedPickup: false },
  })

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function onSavePessoal(data: PessoalForm) {
    const payload = { ...data, email: data.email || undefined }
    if (isEdit) {
      await updateStudent.mutateAsync(payload)
      toast.success('Dados pessoais salvos')
    } else {
      const student = await createStudent.mutateAsync(payload)
      toast.success(`Aluno cadastrado! Matrícula: ${student.enrollmentCode}`)
      navigate(`/students/${student.id}/edit`, { replace: true })
    }
  }

  async function onSaveFamilia(data: FamiliaForm) {
    await updateStudent.mutateAsync(data)
    toast.success('Dados de família salvos')
  }

  async function onSaveMedical(data: MedicalForm) {
    await upsertMedical.mutateAsync(data)
    toast.success('Ficha médica salva')
  }

  async function onAddGuardian(data: GuardianForm) {
    await addGuardian.mutateAsync({
      ...data,
      email: data.email || null,
      phone: data.phone ?? null,
      cpf: data.cpf ?? null,
      profession: data.profession ?? null,
    })
    toast.success('Responsável adicionado')
    setGuardianDialogOpen(false)
    guardianForm.reset()
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadPhoto.mutate(file, {
      onSuccess: () => toast.success('Foto atualizada'),
      onError: () => toast.error('Erro ao enviar foto'),
    })
  }

  function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadDocument.mutate({ file, type: docType }, {
      onSuccess: () => toast.success('Documento anexado'),
      onError: () => toast.error('Erro ao enviar documento'),
    })
    e.target.value = ''
  }

  if (isLoading && isEdit) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header de detalhe */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center justify-center rounded-md w-8 h-8 transition-colors shrink-0"
          title="Voltar"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--iris-blue-50)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
        >
          <ArrowLeft size={16} style={{ color: 'var(--iris-slate-700)' }} />
        </button>

        <div className="flex-1 min-w-0">
          <h1
            className="font-bold truncate"
            style={{ fontSize: 20, color: 'var(--iris-blue-900)', letterSpacing: '-0.01em' }}
          >
            {isEdit ? student?.name : 'Novo aluno'}
          </h1>
          {isEdit && student && (
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="mono text-xs" style={{ color: 'var(--iris-slate-500)' }}>
                {student.enrollmentCode}
              </span>
              {student.internalCode && (
                <span className="text-xs" style={{ color: 'var(--iris-slate-500)' }}>
                  · Cód. {student.internalCode}
                </span>
              )}
              <Badge
                variant={student.enrollmentStatus === 'active' ? 'success' : student.enrollmentStatus === 'transferred' ? 'warning' : 'outline'}
                className="text-[10px] h-4 px-1.5"
              >
                {ENROLLMENT_STATUS_LABELS[student.enrollmentStatus]}
              </Badge>
            </div>
          )}
        </div>

        {isEdit && (
          <Link to={`/students/${id}/report`}>
            <Button size="sm" variant="outline">Ver boletim</Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="pessoal">
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <TabsList className="w-full justify-start min-w-max">
            <TabsTrigger value="pessoal">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="familia" disabled={!isEdit}>Família & Responsável</TabsTrigger>
            <TabsTrigger value="saude" disabled={!isEdit}>Ficha Médica</TabsTrigger>
            <TabsTrigger value="documentos" disabled={!isEdit}>Documentos</TabsTrigger>
            <TabsTrigger value="matricula" disabled={!isEdit}>Matrícula & Turmas</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Aba 1: Dados Pessoais ──────────────────────────────────────── */}
        <TabsContent value="pessoal">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Foto */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="h-28 w-28 md:h-32 md:w-32 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted cursor-pointer hover:border-primary transition-colors"
                onClick={() => isEdit && photoInputRef.current?.click()}
              >
                {student?.photoUrl
                  ? <img src={student.photoUrl} alt="foto" className="h-full w-full object-cover" />
                  : <UserCircle2 className="h-14 w-14 md:h-16 md:w-16 text-muted-foreground/40" />
                }
              </div>
              {isEdit && (
                <>
                  <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()} disabled={uploadPhoto.isPending}>
                    <Upload className="h-3.5 w-3.5" />
                    {uploadPhoto.isPending ? 'Enviando...' : 'Foto 3x4'}
                  </Button>
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </>
              )}
              {!isEdit && <p className="text-xs text-muted-foreground text-center">Salve os dados pessoais primeiro para adicionar a foto</p>}
            </div>

            {/* Formulário */}
            <div className="md:col-span-2">
              <form onSubmit={pessoalForm.handleSubmit(onSavePessoal)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label>Nome completo *</Label>
                    <Input {...pessoalForm.register('name')} />
                    {pessoalForm.formState.errors.name && <p className="text-xs text-destructive">{pessoalForm.formState.errors.name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>CPF<Opt /></Label>
                    <Input placeholder="000.000.000-00" {...pessoalForm.register('cpf')} />
                  </div>
                  <div className="space-y-1">
                    <Label>RG<Opt /></Label>
                    <Input placeholder="00.000.000-0" {...pessoalForm.register('rg')} />
                  </div>
                  <div className="space-y-1">
                    <Label>Data de nascimento<Opt /></Label>
                    <Input type="date" {...pessoalForm.register('birthDate')} />
                  </div>
                  <div className="space-y-1">
                    <Label>Sexo<Opt /></Label>
                    <Select value={pessoalForm.watch('sex') ?? ''} onValueChange={(v) => pessoalForm.setValue('sex', v as 'M' | 'F' | 'outro')}>
                      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Tipo sanguíneo<Opt /></Label>
                    <Select value={pessoalForm.watch('bloodType') ?? ''} onValueChange={(v) => pessoalForm.setValue('bloodType', v as any)}>
                      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Naturalidade<Opt /></Label>
                    <Input placeholder="Cidade / Estado" {...pessoalForm.register('naturalidade')} />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone<Opt /></Label>
                    <Input placeholder="(00) 00000-0000" {...pessoalForm.register('phone')} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Email<Opt /></Label>
                    <Input type="email" {...pessoalForm.register('email')} />
                    {pessoalForm.formState.errors.email && <p className="text-xs text-destructive">{pessoalForm.formState.errors.email.message}</p>}
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Comorbidades<Opt /></Label>
                    <Input placeholder="Ex: Hipertensão, diabetes..." {...pessoalForm.register('comorbidities')} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Observações<Opt /></Label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      placeholder="Observações gerais sobre o aluno..."
                      {...pessoalForm.register('observations')}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={createStudent.isPending || updateStudent.isPending}>
                    {createStudent.isPending || updateStudent.isPending ? 'Salvando...' : isEdit ? 'Salvar dados pessoais' : 'Cadastrar aluno'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </TabsContent>

        {/* ── Aba 2: Família & Responsável ───────────────────────────────── */}
        <TabsContent value="familia" className="space-y-6">
          <form onSubmit={familiaForm.handleSubmit(onSaveFamilia)} className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Dados familiares</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Nome da mãe<Opt /></Label>
                  <Input {...familiaForm.register('motherName')} />
                </div>
                <div className="space-y-1">
                  <Label>Telefone da mãe<Opt /></Label>
                  <Input placeholder="(00) 00000-0000" {...familiaForm.register('motherPhone')} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Nome do pai<Opt /></Label>
                  <Input {...familiaForm.register('fatherName')} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Endereço</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>CEP<Opt /></Label>
                  <Input placeholder="00000-000" {...familiaForm.register('addressCep')} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Logradouro<Opt /></Label>
                  <Input placeholder="Rua, Avenida..." {...familiaForm.register('addressStreet')} />
                </div>
                <div className="space-y-1">
                  <Label>Número<Opt /></Label>
                  <Input {...familiaForm.register('addressNumber')} />
                </div>
                <div className="space-y-1">
                  <Label>Complemento<Opt /></Label>
                  <Input placeholder="Apto, Bloco..." {...familiaForm.register('addressComplement')} />
                </div>
                <div className="space-y-1">
                  <Label>Bairro<Opt /></Label>
                  <Input {...familiaForm.register('addressNeighborhood')} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Cidade<Opt /></Label>
                  <Input {...familiaForm.register('addressCity')} />
                </div>
                <div className="space-y-1">
                  <Label>Estado (UF)<Opt /></Label>
                  <Input maxLength={2} placeholder="SP" {...familiaForm.register('addressState')} />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateStudent.isPending}>
                {updateStudent.isPending ? 'Salvando...' : 'Salvar família & endereço'}
              </Button>
            </div>
          </form>

          {/* Responsáveis e autorizados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Responsáveis & Autorizados a buscar</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setGuardianDialogOpen(!guardianDialogOpen)}>
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {guardianDialogOpen && (
                <form onSubmit={guardianForm.handleSubmit(onAddGuardian)} className="border rounded-md p-4 space-y-3 bg-muted/30">
                  <p className="text-sm font-medium">Novo responsável / autorizado</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label>Nome completo *</Label>
                      <Input {...guardianForm.register('name')} />
                      {guardianForm.formState.errors.name && <p className="text-xs text-destructive">{guardianForm.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>Parentesco *</Label>
                      <Input placeholder="Pai, Mãe, Avó..." {...guardianForm.register('relationship')} />
                    </div>
                    <div className="space-y-1">
                      <Label>CPF<Opt /></Label>
                      <Input placeholder="000.000.000-00" {...guardianForm.register('cpf')} />
                    </div>
                    <div className="space-y-1">
                      <Label>Telefone<Opt /></Label>
                      <Input placeholder="(00) 00000-0000" {...guardianForm.register('phone')} />
                    </div>
                    <div className="space-y-1">
                      <Label>Profissão<Opt /></Label>
                      <Input {...guardianForm.register('profession')} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label>Email<Opt /></Label>
                      <Input type="email" {...guardianForm.register('email')} />
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" {...guardianForm.register('isResponsible')} className="rounded" />
                      Responsável legal
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" {...guardianForm.register('isAuthorizedPickup')} className="rounded" />
                      Autorizado a buscar
                    </label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => { setGuardianDialogOpen(false); guardianForm.reset() }}>Cancelar</Button>
                    <Button type="submit" size="sm" disabled={addGuardian.isPending}>Adicionar</Button>
                  </div>
                </form>
              )}

              {(!guardians || guardians.length === 0) && !guardianDialogOpen && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum responsável cadastrado</p>
              )}

              {guardians?.map((g) => (
                <div key={g.id} className="flex items-start justify-between border rounded-sm px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.relationship}{g.phone ? ` · ${g.phone}` : ''}{g.cpf ? ` · CPF: ${g.cpf}` : ''}</p>
                    <div className="flex gap-1 mt-1">
                      {g.isResponsible && <Badge variant="outline" className="text-[10px] h-4 px-1">Responsável</Badge>}
                      {g.isAuthorizedPickup && <Badge variant="secondary" className="text-[10px] h-4 px-1">Autorizado a buscar</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteGuardian.mutate(g.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Aba 3: Ficha Médica ────────────────────────────────────────── */}
        <TabsContent value="saude">
          <form onSubmit={medicalForm.handleSubmit(onSaveMedical)} className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Ficha médica</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { field: 'allergies' as const, label: 'Alergias', placeholder: 'Ex: Penicilina, amendoim...' },
                  { field: 'medications' as const, label: 'Uso contínuo de medicamentos', placeholder: 'Nome, dosagem e frequência...' },
                  { field: 'foodRestrictions' as const, label: 'Restrições alimentares', placeholder: 'Ex: Lactose, glúten...' },
                  { field: 'diseases' as const, label: 'Doenças importantes', placeholder: 'Ex: Asma, epilepsia...' },
                  { field: 'medicalContact' as const, label: 'Contato médico', placeholder: 'Nome do médico e telefone...' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field} className="space-y-1">
                    <Label>{label}<Opt /></Label>
                    <textarea
                      className="flex min-h-[72px] w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      placeholder={placeholder}
                      {...medicalForm.register(field)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button type="submit" disabled={upsertMedical.isPending}>
                {upsertMedical.isPending ? 'Salvando...' : 'Salvar ficha médica'}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ── Aba 4: Documentos ──────────────────────────────────────────── */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Documentos e anexos</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className="h-8 w-48 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={() => docInputRef.current?.click()} disabled={uploadDocument.isPending}>
                    <Upload className="h-3.5 w-3.5" />
                    {uploadDocument.isPending ? 'Enviando...' : 'Anexar'}
                  </Button>
                  <input ref={docInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleDocUpload} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(!documents || documents.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhum documento anexado</p>
              )}
              {documents?.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between border rounded-sm px-3 py-2">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {DOCUMENT_TYPE_LABELS[doc.type]}
                        {doc.fileSize ? ` · ${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.open(doc.fileUrl, '_blank')}>
                      Ver
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteDocument.mutate(doc.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Aba 5: Matrícula ───────────────────────────────────────────── */}
        <TabsContent value="matricula">
          <Card>
            <CardHeader><CardTitle className="text-sm">Dados de matrícula</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Número de matrícula', value: student?.enrollmentCode },
                { label: 'Código interno', value: student?.internalCode ?? '—' },
                { label: 'Data de ingresso', value: student?.enrollmentDate ?? '—' },
                { label: 'Situação', value: student?.enrollmentStatus ? ENROLLMENT_STATUS_LABELS[student.enrollmentStatus] : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-sm">Alterar situação</CardTitle></CardHeader>
            <CardContent>
              <Select
                value={student?.enrollmentStatus ?? 'active'}
                onValueChange={(v) => updateStudent.mutate({ enrollmentStatus: v })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ENROLLMENT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Turmas
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {studentClasses.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Aluno não está matriculado em nenhuma turma
                </p>
              )}
              {studentClasses.map((sc) => (
                <div key={sc.id} className="flex items-center justify-between border rounded-sm px-3 py-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{sc.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFromClass(sc.id)}
                  >
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2 pt-1">
                <Select value={classToAdd} onValueChange={setClassToAdd}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecionar turma..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allClasses
                      .filter((c) => !studentClasses.some((sc) => sc.id === c.id))
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleAddToClass}
                  disabled={!classToAdd || addToClass.isPending}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {addToClass.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
