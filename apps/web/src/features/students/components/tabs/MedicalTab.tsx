import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../../../../components/ui/button'
import { Label } from '../../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Textarea } from '../../../../components/ui/textarea'
import type { StudentMedical } from '@education-gestor/types'

const medicalSchema = z.object({
  allergies: z.string().optional(),
  medications: z.string().optional(),
  foodRestrictions: z.string().optional(),
  diseases: z.string().optional(),
  medicalContact: z.string().optional(),
})

export type MedicalForm = z.infer<typeof medicalSchema>

function Opt() {
  return <span className="ml-1 text-[10px] font-normal text-muted-foreground">(opcional)</span>
}

interface MedicalTabProps {
  medical?: StudentMedical
  saving: boolean
  onSave(data: MedicalForm): void
}

export function MedicalTab({ medical, saving, onSave }: MedicalTabProps) {
  const form = useForm<MedicalForm>({
    resolver: zodResolver(medicalSchema),
    mode: 'onBlur',
    values: medical
      ? {
          allergies: medical.allergies ?? '',
          medications: medical.medications ?? '',
          foodRestrictions: medical.foodRestrictions ?? '',
          diseases: medical.diseases ?? '',
          medicalContact: medical.medicalContact ?? '',
        }
      : undefined,
  })

  return (
    <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
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
              <Textarea
                className="min-h-[72px] resize-none"
                placeholder={placeholder}
                {...form.register(field)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar ficha médica'}
        </Button>
      </div>
    </form>
  )
}
