import { useParams, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { toast } from '../../../lib/toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'
import { useTeacher, useCreateTeacher, useUpdateTeacher, useChangeTeacherPassword } from '../hooks/useTeachers'

function Opt() {
  return <span className="ml-1 text-[10px] font-normal text-muted-foreground">(opcional)</span>
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const pessoalSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal('')),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  sex: z.enum(['M', 'F', 'outro']).optional(),
  nationality: z.string().optional(),
  maritalStatus: z.string().optional(),
  phone: z.string().optional(),
})

const enderecoSchema = z.object({
  addressCep: z.string().optional(),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
})

const profissionalSchema = z.object({
  position: z.string().optional(),
  contractType: z.enum(['clt', 'temporario', 'horista']).optional(),
  workload: z.string().optional(),
  workShift: z.enum(['matutino', 'vespertino', 'noturno', 'integral']).optional(),
  employmentStatus: z.enum(['ativo', 'inativo', 'licenca']).optional(),
})

const formacaoSchema = z.object({
  educationLevel: z.string().optional(),
  degree: z.string().optional(),
  institution: z.string().optional(),
  professionalRegistry: z.string().optional(),
})

const financeiroSchema = z.object({
  bank: z.string().optional(),
  agency: z.string().optional(),
  accountNumber: z.string().optional(),
  accountType: z.string().optional(),
  pixKey: z.string().optional(),
})

const senhaSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

type PessoalForm = z.infer<typeof pessoalSchema>
type EnderecoForm = z.infer<typeof enderecoSchema>
type ProfissionalForm = z.infer<typeof profissionalSchema>
type FormacaoForm = z.infer<typeof formacaoSchema>
type FinanceiroForm = z.infer<typeof financeiroSchema>
type SenhaForm = z.infer<typeof senhaSchema>

const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  licenca: 'Licença',
}

const CONTRACT_LABELS: Record<string, string> = {
  clt: 'CLT',
  temporario: 'Temporário',
  horista: 'Horista',
}

const SHIFT_LABELS: Record<string, string> = {
  matutino: 'Matutino',
  vespertino: 'Vespertino',
  noturno: 'Noturno',
  integral: 'Integral',
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function TeacherFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: teacher, isLoading } = useTeacher(id ?? '')
  const createTeacher = useCreateTeacher()
  const updateTeacher = useUpdateTeacher(id ?? '')
  const changePassword = useChangeTeacherPassword(id ?? '')

  // ── Forms ──────────────────────────────────────────────────────────────────

  const pessoalForm = useForm<PessoalForm>({
    resolver: zodResolver(pessoalSchema),
    values: teacher ? {
      name: teacher.name,
      email: teacher.email,
      password: '',
      cpf: teacher.cpf ?? '',
      rg: teacher.rg ?? '',
      birthDate: teacher.birthDate ?? '',
      sex: (teacher.sex as 'M' | 'F' | 'outro') ?? undefined,
      nationality: teacher.nationality ?? '',
      maritalStatus: teacher.maritalStatus ?? '',
      phone: teacher.phone ?? '',
    } : undefined,
  })

  const enderecoForm = useForm<EnderecoForm>({
    resolver: zodResolver(enderecoSchema),
    values: teacher ? {
      addressCep: teacher.addressCep ?? '',
      addressStreet: teacher.addressStreet ?? '',
      addressNumber: teacher.addressNumber ?? '',
      addressComplement: teacher.addressComplement ?? '',
      addressNeighborhood: teacher.addressNeighborhood ?? '',
      addressCity: teacher.addressCity ?? '',
      addressState: teacher.addressState ?? '',
    } : undefined,
  })

  const profissionalForm = useForm<ProfissionalForm>({
    resolver: zodResolver(profissionalSchema),
    values: teacher ? {
      position: teacher.position ?? '',
      contractType: (teacher.contractType as any) ?? undefined,
      workload: teacher.workload ?? '',
      workShift: (teacher.workShift as any) ?? undefined,
      employmentStatus: teacher.employmentStatus ?? 'ativo',
    } : undefined,
  })

  const formacaoForm = useForm<FormacaoForm>({
    resolver: zodResolver(formacaoSchema),
    values: teacher ? {
      educationLevel: teacher.educationLevel ?? '',
      degree: teacher.degree ?? '',
      institution: teacher.institution ?? '',
      professionalRegistry: teacher.professionalRegistry ?? '',
    } : undefined,
  })

  const financeiroForm = useForm<FinanceiroForm>({
    resolver: zodResolver(financeiroSchema),
    values: teacher ? {
      bank: teacher.bank ?? '',
      agency: teacher.agency ?? '',
      accountNumber: teacher.accountNumber ?? '',
      accountType: teacher.accountType ?? '',
      pixKey: teacher.pixKey ?? '',
    } : undefined,
  })

  const senhaForm = useForm<SenhaForm>({ resolver: zodResolver(senhaSchema) })

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function onSavePessoal(data: PessoalForm) {
    const { password, ...rest } = data
    if (isEdit) {
      await updateTeacher.mutateAsync(rest)
      if (password) {
        await changePassword.mutateAsync(password)
        toast.success('Dados e senha atualizados')
      } else {
        toast.success('Dados pessoais salvos')
      }
    } else {
      if (!password) {
        pessoalForm.setError('password', { message: 'Senha obrigatória' })
        return
      }
      const created = await createTeacher.mutateAsync({ ...rest, password })
      toast.success('Professor cadastrado!')
      navigate(`/teachers/${created.id}/edit`, { replace: true })
    }
  }

  async function onSaveEndereco(data: EnderecoForm) {
    await updateTeacher.mutateAsync(data)
    toast.success('Endereço salvo')
  }

  async function onSaveProfissional(data: ProfissionalForm) {
    await updateTeacher.mutateAsync(data)
    toast.success('Dados profissionais salvos')
  }

  async function onSaveFormacao(data: FormacaoForm) {
    await updateTeacher.mutateAsync(data)
    toast.success('Formação acadêmica salva')
  }

  async function onSaveFinanceiro(data: FinanceiroForm) {
    await updateTeacher.mutateAsync(data)
    toast.success('Dados financeiros salvos')
  }

  async function onChangeSenha(data: SenhaForm) {
    await changePassword.mutateAsync(data.password)
    toast.success('Senha alterada')
    senhaForm.reset()
  }

  if (isLoading && isEdit) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teachers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">
            {isEdit ? teacher?.name : 'Novo Professor'}
          </h1>
          {isEdit && teacher && (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              {teacher.position && <span>{teacher.position}</span>}
              <Badge
                variant={teacher.employmentStatus === 'ativo' ? 'success' : 'secondary'}
                className="text-[10px] h-4 px-1.5"
              >
                {EMPLOYMENT_STATUS_LABELS[teacher.employmentStatus]}
              </Badge>
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="pessoal">
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <TabsList className="w-full justify-start min-w-max">
            <TabsTrigger value="pessoal">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="endereco" disabled={!isEdit}>Endereço</TabsTrigger>
            <TabsTrigger value="profissional" disabled={!isEdit}>Dados Profissionais</TabsTrigger>
            <TabsTrigger value="formacao" disabled={!isEdit}>Formação</TabsTrigger>
            <TabsTrigger value="financeiro" disabled={!isEdit}>Financeiro</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Aba 1: Dados Pessoais ──────────────────────────────────────── */}
        <TabsContent value="pessoal">
          <form onSubmit={pessoalForm.handleSubmit(onSavePessoal)} className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Identificação pessoal</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label>Nome completo *</Label>
                  <Input {...pessoalForm.register('name')} />
                  {pessoalForm.formState.errors.name && (
                    <p className="text-xs text-destructive">{pessoalForm.formState.errors.name.message}</p>
                  )}
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
                  <Select
                    value={pessoalForm.watch('sex') ?? ''}
                    onValueChange={(v) => pessoalForm.setValue('sex', v as 'M' | 'F' | 'outro')}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Nacionalidade<Opt /></Label>
                  <Input placeholder="Brasileiro(a)" {...pessoalForm.register('nationality')} />
                </div>
                <div className="space-y-1">
                  <Label>Estado civil<Opt /></Label>
                  <Input placeholder="Solteiro(a), Casado(a)..." {...pessoalForm.register('maritalStatus')} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Contato & acesso</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Telefone<Opt /></Label>
                  <Input placeholder="(00) 00000-0000" {...pessoalForm.register('phone')} />
                </div>
                <div className="space-y-1">
                  <Label>Email *</Label>
                  <Input type="email" {...pessoalForm.register('email')} />
                  {pessoalForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{pessoalForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>{isEdit ? 'Nova senha' : 'Senha *'}<Opt /></Label>
                  <Input type="password" placeholder="Mínimo 8 caracteres" {...pessoalForm.register('password')} />
                  {pessoalForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{pessoalForm.formState.errors.password.message}</p>
                  )}
                  {isEdit && (
                    <p className="text-xs text-muted-foreground">Deixe em branco para não alterar</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={createTeacher.isPending || updateTeacher.isPending}>
                {createTeacher.isPending || updateTeacher.isPending
                  ? 'Salvando...'
                  : isEdit ? 'Salvar dados pessoais' : 'Cadastrar professor'}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ── Aba 2: Endereço ────────────────────────────────────────────── */}
        <TabsContent value="endereco">
          <form onSubmit={enderecoForm.handleSubmit(onSaveEndereco)} className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Endereço</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>CEP<Opt /></Label>
                  <Input placeholder="00000-000" {...enderecoForm.register('addressCep')} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Logradouro<Opt /></Label>
                  <Input placeholder="Rua, Avenida..." {...enderecoForm.register('addressStreet')} />
                </div>
                <div className="space-y-1">
                  <Label>Número<Opt /></Label>
                  <Input {...enderecoForm.register('addressNumber')} />
                </div>
                <div className="space-y-1">
                  <Label>Complemento<Opt /></Label>
                  <Input placeholder="Apto, Bloco..." {...enderecoForm.register('addressComplement')} />
                </div>
                <div className="space-y-1">
                  <Label>Bairro<Opt /></Label>
                  <Input {...enderecoForm.register('addressNeighborhood')} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Cidade<Opt /></Label>
                  <Input {...enderecoForm.register('addressCity')} />
                </div>
                <div className="space-y-1">
                  <Label>Estado (UF)<Opt /></Label>
                  <Input maxLength={2} placeholder="CE" {...enderecoForm.register('addressState')} />
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button type="submit" disabled={updateTeacher.isPending}>
                {updateTeacher.isPending ? 'Salvando...' : 'Salvar endereço'}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ── Aba 3: Dados Profissionais ─────────────────────────────────── */}
        <TabsContent value="profissional">
          <form onSubmit={profissionalForm.handleSubmit(onSaveProfissional)} className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Dados profissionais</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label>Cargo / Função<Opt /></Label>
                  <Input placeholder="Professor, Coordenador, Auxiliar..." {...profissionalForm.register('position')} />
                </div>
                <div className="space-y-1">
                  <Label>Tipo de contrato<Opt /></Label>
                  <Select
                    value={profissionalForm.watch('contractType') ?? ''}
                    onValueChange={(v) => profissionalForm.setValue('contractType', v as any)}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONTRACT_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Carga horária<Opt /></Label>
                  <Input placeholder="Ex: 40h/semana" {...profissionalForm.register('workload')} />
                </div>
                <div className="space-y-1">
                  <Label>Turno<Opt /></Label>
                  <Select
                    value={profissionalForm.watch('workShift') ?? ''}
                    onValueChange={(v) => profissionalForm.setValue('workShift', v as any)}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SHIFT_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Situação</Label>
                  <Select
                    value={profissionalForm.watch('employmentStatus') ?? 'ativo'}
                    onValueChange={(v) => profissionalForm.setValue('employmentStatus', v as any)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button type="submit" disabled={updateTeacher.isPending}>
                {updateTeacher.isPending ? 'Salvando...' : 'Salvar dados profissionais'}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ── Aba 4: Formação Acadêmica ──────────────────────────────────── */}
        <TabsContent value="formacao">
          <form onSubmit={formacaoForm.handleSubmit(onSaveFormacao)} className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Formação acadêmica</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Escolaridade<Opt /></Label>
                  <Input placeholder="Superior completo, Pós-graduação..." {...formacaoForm.register('educationLevel')} />
                </div>
                <div className="space-y-1">
                  <Label>Curso de formação<Opt /></Label>
                  <Input placeholder="Licenciatura em Matemática..." {...formacaoForm.register('degree')} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Instituição<Opt /></Label>
                  <Input placeholder="Nome da universidade / faculdade" {...formacaoForm.register('institution')} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Registro profissional<Opt /></Label>
                  <Input placeholder="CREA, CREF, CRP, etc." {...formacaoForm.register('professionalRegistry')} />
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button type="submit" disabled={updateTeacher.isPending}>
                {updateTeacher.isPending ? 'Salvando...' : 'Salvar formação'}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ── Aba 5: Dados Financeiros ───────────────────────────────────── */}
        <TabsContent value="financeiro" className="space-y-4">
          <form onSubmit={financeiroForm.handleSubmit(onSaveFinanceiro)} className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Dados bancários</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Banco<Opt /></Label>
                  <Input placeholder="Ex: Banco do Brasil, Itaú..." {...financeiroForm.register('bank')} />
                </div>
                <div className="space-y-1">
                  <Label>Agência<Opt /></Label>
                  <Input placeholder="0000" {...financeiroForm.register('agency')} />
                </div>
                <div className="space-y-1">
                  <Label>Número da conta<Opt /></Label>
                  <Input placeholder="00000-0" {...financeiroForm.register('accountNumber')} />
                </div>
                <div className="space-y-1">
                  <Label>Tipo de conta<Opt /></Label>
                  <Input placeholder="Corrente, Poupança..." {...financeiroForm.register('accountType')} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Chave PIX<Opt /></Label>
                  <Input placeholder="CPF, e-mail, telefone ou chave aleatória" {...financeiroForm.register('pixKey')} />
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button type="submit" disabled={updateTeacher.isPending}>
                {updateTeacher.isPending ? 'Salvando...' : 'Salvar dados bancários'}
              </Button>
            </div>
          </form>

          <form onSubmit={senhaForm.handleSubmit(onChangeSenha)} className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Alterar senha</CardTitle></CardHeader>
              <CardContent className="max-w-sm">
                <div className="space-y-1">
                  <Label>Nova senha</Label>
                  <Input type="password" placeholder="Mínimo 8 caracteres" {...senhaForm.register('password')} />
                  {senhaForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{senhaForm.formState.errors.password.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? 'Alterando...' : 'Alterar senha'}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
