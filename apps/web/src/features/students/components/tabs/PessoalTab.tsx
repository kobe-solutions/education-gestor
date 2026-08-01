import { useRef } from 'react'
import { Upload, UserCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Textarea } from '../../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { useUnsavedChanges } from '../../../../lib/useUnsavedChanges'
import type { Student } from '@education-gestor/types'

export const pessoalSchema = z.object({
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

export type PessoalForm = z.infer<typeof pessoalSchema>

function Opt() {
  return <span className="ml-1 text-[10px] font-normal text-muted-foreground">(opcional)</span>
}

interface PessoalTabProps {
  isEdit: boolean
  student?: Student
  uploadingPhoto: boolean
  saving: boolean
  onSave(data: PessoalForm): void
  onPhotoChange(file: File): void
}

export function PessoalTab({ isEdit, student, uploadingPhoto, saving, onSave, onPhotoChange }: PessoalTabProps) {
  const form = useForm<PessoalForm>({
    resolver: zodResolver(pessoalSchema),
    mode: 'onBlur',
    values: student
      ? {
          name: student.name,
          email: student.email ?? '',
          cpf: student.cpf ?? '',
          rg: student.rg ?? '',
          birthDate: student.birthDate ?? '',
          sex: (student.sex as 'M' | 'F' | 'outro') ?? undefined,
          bloodType: (student.bloodType as PessoalForm['bloodType']) ?? undefined,
          naturalidade: student.naturalidade ?? '',
          phone: student.phone ?? '',
          comorbidities: student.comorbidities ?? '',
          observations: student.observations ?? '',
        }
      : undefined,
  })

  useUnsavedChanges(form.formState.isDirty)

  const photoInputRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onPhotoChange(file)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Foto */}
      <Card className="md:col-span-1 p-5 flex flex-col items-center justify-start gap-4 h-fit">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center w-full">
          Foto 3x4
        </div>
        <div
          className="h-28 w-28 md:h-32 md:w-32 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted cursor-pointer hover:border-primary transition-colors"
          onClick={() => isEdit && photoInputRef.current?.click()}
        >
          {student?.photoUrl ? (
            <img
              src={student.photoUrl}
              alt="foto"
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <UserCircle2 className="h-14 w-14 md:h-16 md:w-16 text-muted-foreground/40" />
          )}
        </div>
        {isEdit ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="w-full text-xs"
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              {uploadingPhoto ? 'Enviando...' : 'Alterar foto'}
            </Button>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </>
        ) : (
          <p className="text-xs text-muted-foreground text-center">
            Salve os dados pessoais primeiro para adicionar a foto
          </p>
        )}
      </Card>

      {/* Formulário */}
      <Card className="md:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados Pessoais e Identificação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2 space-y-1.5">
                <Label>Nome completo *</Label>
                <Input {...form.register('name')} placeholder="Nome completo do aluno" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>CPF<Opt /></Label>
                <Input placeholder="000.000.000-00" {...form.register('cpf')} />
              </div>
              <div className="space-y-1.5">
                <Label>RG<Opt /></Label>
                <Input placeholder="00.000.000-0" {...form.register('rg')} />
              </div>
              <div className="space-y-1.5">
                <Label>Data de nascimento<Opt /></Label>
                <Input type="date" {...form.register('birthDate')} />
              </div>
              <div className="space-y-1.5">
                <Label>Sexo<Opt /></Label>
                <Select
                  value={form.watch('sex') ?? ''}
                  onValueChange={(v) => form.setValue('sex', v as 'M' | 'F' | 'outro')}
                >
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo sanguíneo<Opt /></Label>
                <Select
                  value={form.watch('bloodType') ?? ''}
                  onValueChange={(v) => form.setValue('bloodType', v as PessoalForm['bloodType'])}
                >
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Naturalidade<Opt /></Label>
                <Input placeholder="Cidade / Estado" {...form.register('naturalidade')} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone<Opt /></Label>
                <Input placeholder="(00) 00000-0000" {...form.register('phone')} />
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-1.5">
                <Label>Email<Opt /></Label>
                <Input type="email" placeholder="email@exemplo.com" {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-1.5">
                <Label>Comorbidades<Opt /></Label>
                <Input placeholder="Ex: Hipertensão, diabetes..." {...form.register('comorbidities')} />
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-1.5">
                <Label>Observações<Opt /></Label>
                <Textarea
                  className="resize-none min-h-[80px]"
                  placeholder="Observações gerais sobre o aluno..."
                  {...form.register('observations')}
                />
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t">
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : isEdit ? 'Salvar dados pessoais' : 'Cadastrar aluno'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
