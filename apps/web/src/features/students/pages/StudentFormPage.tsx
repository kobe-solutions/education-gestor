import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router'
import { ArrowLeft, FileText } from 'lucide-react'
import { api } from '../../../lib/api'
import { toast } from '../../../lib/toast'
import { Breadcrumbs } from '../../../components/Breadcrumbs'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent } from '../../../components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs'
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
import { useAuth } from '../../../contexts/AuthContext'
import { useSecretariaSchools } from '../../secretarias/hooks/useSecretarias'
import { ENROLLMENT_STATUS_LABELS } from '../../../lib/labels'
import { PessoalTab, type PessoalForm } from '../components/tabs/PessoalTab'
import { FamiliaTab, type FamiliaForm, type GuardianForm } from '../components/tabs/FamiliaTab'
import { MedicalTab, type MedicalForm } from '../components/tabs/MedicalTab'
import { DocumentsTab } from '../components/tabs/DocumentsTab'
import { MatriculaTab } from '../components/tabs/MatriculaTab'

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

  // ── Guard: secretaria sem escolas não pode criar ──────────────────────────

  const { payload } = useAuth()
  const isSecretaria = payload?.role === 'secretaria'
  const secretariaId = isSecretaria ? (payload as Record<string, unknown>).secretariaId as string : undefined
  const { data: linkedSchools, isLoading: loadingSchools } = useSecretariaSchools(secretariaId ?? '')
  const showBlocked = !isEdit && isSecretaria && !loadingSchools && linkedSchools?.length === 0

  // ── Handlers de save ──────────────────────────────────────────────────────

  async function onSavePessoal(data: PessoalForm) {
    const payload = { ...data, email: data.email || undefined }
    if (isEdit) {
      await updateStudent.mutateAsync(payload)
      toast.success('Dados pessoais salvos')
    } else {
      const created = await createStudent.mutateAsync(payload)
      toast.success(`Aluno cadastrado! Matrícula: ${created.enrollmentCode}`)
      navigate(`/students/${created.id}/edit`, { replace: true })
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
  }

  function handlePhotoChange(file: File) {
    uploadPhoto.mutate(file, {
      onSuccess: () => toast.success('Foto atualizada'),
      onError: () => toast.error('Erro ao enviar foto'),
    })
  }

  function handleDocUpload(file: File, type: string) {
    uploadDocument.mutate({ file, type }, {
      onSuccess: () => toast.success('Documento anexado'),
      onError: () => toast.error('Erro ao enviar documento'),
    })
  }

  if (isLoading && isEdit) {    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  if (showBlocked) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
        <div className="text-5xl">🏫</div>
        <h2 className="text-xl font-semibold">Nenhuma escola vinculada</h2>
        <p className="text-muted-foreground">
          Esta Secretaria de Educação ainda não tem escolas vinculadas. Peça a um administrador
          da plataforma para incluir escolas na rede antes de cadastrar alunos.
        </p>
        <Button variant="outline" onClick={() => navigate('/students')}>
          Voltar para alunos
        </Button>
      </div>
    )
  }

  if (loadingSchools && !isEdit && isSecretaria) {
    return <p className="text-sm text-muted-foreground">Verificando permissões...</p>
  }

  const savingPessoal = createStudent.isPending || updateStudent.isPending

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Pessoas', to: '/people' },
          { label: 'Alunos', to: '/students' },
          { label: isEdit ? student?.name ?? 'Editar' : 'Novo aluno' },
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

              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground truncate">
                  {isEdit ? student?.name ?? 'Editar aluno' : 'Novo aluno'}
                </h1>
                {isEdit && student && (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="mono text-xs text-muted-foreground">
                      Matrícula: {student.enrollmentCode}
                    </span>
                    {student.internalCode && (
                      <span className="text-xs text-muted-foreground">
                        · Cód. {student.internalCode}
                      </span>
                    )}
                    <Badge
                      variant={
                        student.enrollmentStatus === 'active'
                          ? 'success'
                          : student.enrollmentStatus === 'transferred'
                          ? 'warning'
                          : 'outline'
                      }
                      className="text-[10px] h-4 px-1.5"
                    >
                      {ENROLLMENT_STATUS_LABELS[student.enrollmentStatus]}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {isEdit && (
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <Link to={`/students/${id}`}>
                  <Button size="sm" variant="outline">
                    Ver detalhes
                  </Button>
                </Link>
                <Link to={`/students/${id}/report`}>
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-1.5" />
                    Boletim
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!isEdit && <p className="rounded-lg border border-primary/20 bg-secondary px-4 py-3 text-sm text-secondary-foreground">Comece pelos dados pessoais. Depois de salvar o cadastro, você poderá completar as outras etapas.</p>}
      <Tabs defaultValue="pessoal" className="w-full space-y-5">
        <div>
          {isEdit && <p className="mb-2 text-sm text-muted-foreground">Você pode preencher cada etapa e voltar para completar ou atualizar as informações.</p>}
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-transparent p-0 sm:grid-cols-3 lg:grid-cols-5">
            <TabsTrigger className="min-h-11 h-auto whitespace-normal rounded-lg border bg-card px-2 text-left text-xs data-active:border-primary data-active:bg-secondary sm:text-sm" value="pessoal">1. Dados pessoais</TabsTrigger>
            <TabsTrigger className="min-h-11 h-auto whitespace-normal rounded-lg border bg-card px-2 text-left text-xs data-active:border-primary data-active:bg-secondary sm:text-sm" value="familia" disabled={!isEdit}>2. Família</TabsTrigger>
            <TabsTrigger className="min-h-11 h-auto whitespace-normal rounded-lg border bg-card px-2 text-left text-xs data-active:border-primary data-active:bg-secondary sm:text-sm" value="saude" disabled={!isEdit}>3. Saúde</TabsTrigger>
            <TabsTrigger className="min-h-11 h-auto whitespace-normal rounded-lg border bg-card px-2 text-left text-xs data-active:border-primary data-active:bg-secondary sm:text-sm" value="documentos" disabled={!isEdit}>4. Documentos</TabsTrigger>
            <TabsTrigger className="min-h-11 h-auto whitespace-normal rounded-lg border bg-card px-2 text-left text-xs data-active:border-primary data-active:bg-secondary sm:text-sm" value="matricula">5. Turmas e matrícula</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Aba 1: Dados Pessoais ──────────────────────────────────────── */}
        <TabsContent value="pessoal">
          <PessoalTab
            isEdit={isEdit}
            student={student}
            uploadingPhoto={uploadPhoto.isPending}
            saving={savingPessoal}
            onSave={onSavePessoal}
            onPhotoChange={handlePhotoChange}
          />
        </TabsContent>

        {/* ── Aba 2: Família & Responsável ───────────────────────────────── */}
        <TabsContent value="familia" className="space-y-6">
          <FamiliaTab
            student={student}
            guardians={guardians}
            savingFamily={updateStudent.isPending}
            addingGuardian={addGuardian.isPending}
            onSaveFamilia={onSaveFamilia}
            onAddGuardian={onAddGuardian}
            onDeleteGuardian={(gid) => deleteGuardian.mutate(gid)}
          />
        </TabsContent>

        {/* ── Aba 3: Ficha Médica ────────────────────────────────────────── */}
        <TabsContent value="saude">
          <MedicalTab
            medical={medical}
            saving={upsertMedical.isPending}
            onSave={onSaveMedical}
          />
        </TabsContent>

        {/* ── Aba 4: Documentos ──────────────────────────────────────────── */}
        <TabsContent value="documentos">
          <DocumentsTab
            documents={documents}
            uploading={uploadDocument.isPending}
            onUpload={handleDocUpload}
            onDelete={(docId) => deleteDocument.mutate(docId)}
          />
        </TabsContent>

        {/* ── Aba 5: Matrícula ───────────────────────────────────────────── */}
        <TabsContent value="matricula">
          <MatriculaTab
            isEdit={isEdit}
            student={student}
            allClasses={allClasses}
            studentClasses={studentClasses}
            adding={addToClass.isPending}
            onAddToClass={handleAddToClass}
            onRemoveFromClass={handleRemoveFromClass}
            onStatusChange={(status) => updateStudent.mutate({ enrollmentStatus: status })}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
