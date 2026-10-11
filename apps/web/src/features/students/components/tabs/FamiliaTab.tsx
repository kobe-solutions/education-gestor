import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import type { Student, Guardian } from '@education-gestor/types'

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

export type FamiliaForm = z.infer<typeof familiaSchema>

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

export type GuardianForm = z.infer<typeof guardianSchema>

function Opt() {
  return <span className="ml-1 text-[10px] font-normal text-muted-foreground">(opcional)</span>
}

interface FamiliaTabProps {
  student?: Student
  guardians?: Guardian[]
  savingFamily: boolean
  addingGuardian: boolean
  onSaveFamilia(data: FamiliaForm): void
  onAddGuardian(data: GuardianForm): void
  onDeleteGuardian(id: string): void
}

export function FamiliaTab({
  student,
  guardians,
  savingFamily,
  addingGuardian,
  onSaveFamilia,
  onAddGuardian,
  onDeleteGuardian,
}: FamiliaTabProps) {
  const familiaForm = useForm<FamiliaForm>({
    resolver: zodResolver(familiaSchema),
    mode: 'onBlur',
    values: student
      ? {
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
        }
      : undefined,
  })

  const guardianForm = useForm<GuardianForm>({
    resolver: zodResolver(guardianSchema),
    mode: 'onBlur',
    defaultValues: { isResponsible: false, isAuthorizedPickup: false },
  })

  const [showGuardianForm, setShowGuardianForm] = useState(false)

  function handleAdd(data: GuardianForm) {
    onAddGuardian(data)
    guardianForm.reset()
    setShowGuardianForm(false)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={familiaForm.handleSubmit(onSaveFamilia)} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Dados familiares</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="motherName">Nome da mãe<Opt /></Label>
              <Input id="motherName" {...familiaForm.register('motherName')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="motherPhone">Telefone da mãe<Opt /></Label>
              <Input id="motherPhone" placeholder="(00) 00000-0000" {...familiaForm.register('motherPhone')} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="fatherName">Nome do pai<Opt /></Label>
              <Input id="fatherName" {...familiaForm.register('fatherName')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Endereço</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="family-address-cep">CEP<Opt /></Label>
              <Input id="family-address-cep" placeholder="00000-000" {...familiaForm.register('addressCep')} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="family-address-street">Logradouro<Opt /></Label>
              <Input id="family-address-street" placeholder="Rua, Avenida..." {...familiaForm.register('addressStreet')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="family-address-number">Número<Opt /></Label>
              <Input id="family-address-number" {...familiaForm.register('addressNumber')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="family-address-complement">Complemento<Opt /></Label>
              <Input id="family-address-complement" placeholder="Apto, Bloco..." {...familiaForm.register('addressComplement')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="family-address-neighborhood">Bairro<Opt /></Label>
              <Input id="family-address-neighborhood" {...familiaForm.register('addressNeighborhood')} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="family-address-city">Cidade<Opt /></Label>
              <Input id="family-address-city" {...familiaForm.register('addressCity')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="family-address-state">Estado (UF)<Opt /></Label>
              <Input id="family-address-state" maxLength={2} placeholder="SP" {...familiaForm.register('addressState')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={savingFamily}>
            {savingFamily ? 'Salvando...' : 'Salvar família & endereço'}
          </Button>
        </div>
      </form>

      {/* Responsáveis e autorizados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Responsáveis & Autorizados a buscar</CardTitle>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setShowGuardianForm((v) => !v)}
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showGuardianForm && (
          <form onSubmit={guardianForm.handleSubmit(handleAdd)} className="border rounded-md p-4 space-y-3 bg-muted/30">
            <p className="text-sm font-medium">Novo responsável / autorizado</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="guardian-name">Nome completo *</Label>
                <Input id="guardian-name" {...guardianForm.register('name')} />
                {guardianForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{guardianForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="guardian-relationship">Parentesco *</Label>
                <Input id="guardian-relationship" placeholder="Pai, Mãe, Avó..." {...guardianForm.register('relationship')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="guardian-cpf">CPF<Opt /></Label>
                <Input id="guardian-cpf" placeholder="000.000.000-00" {...guardianForm.register('cpf')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="guardian-phone">Telefone<Opt /></Label>
                <Input id="guardian-phone" placeholder="(00) 00000-0000" {...guardianForm.register('phone')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="guardian-profession">Profissão<Opt /></Label>
                <Input id="guardian-profession" {...guardianForm.register('profession')} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="guardian-email">Email<Opt /></Label>
                <Input id="guardian-email" type="email" {...guardianForm.register('email')} />
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
              <Button type="button" variant="outline" size="sm" onClick={() => { setShowGuardianForm(false); guardianForm.reset() }}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={addingGuardian}>Adicionar</Button>
            </div>
          </form>
          )}

          {(!guardians || guardians.length === 0) && !showGuardianForm && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum responsável cadastrado</p>
          )}

          {guardians?.map((g) => (
            <div key={g.id} className="flex items-start justify-between border rounded-sm px-3 py-2">
              <div>
                <p className="text-sm font-medium">{g.name}</p>
                <p className="text-xs text-muted-foreground">
                  {g.relationship}
                  {g.phone ? ` · ${g.phone}` : ''}
                  {g.cpf ? ` · CPF: ${g.cpf}` : ''}
                </p>
                <div className="flex gap-1 mt-1">
                  {g.isResponsible && <Badge variant="outline" className="text-[10px] h-4 px-1">Responsável</Badge>}
                  {g.isAuthorizedPickup && <Badge variant="secondary" className="text-[10px] h-4 px-1">Autorizado a buscar</Badge>}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onDeleteGuardian(g.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
