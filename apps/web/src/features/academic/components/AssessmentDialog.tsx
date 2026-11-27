import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import type { Assessment } from '@education-gestor/types'

const QUICK_SUGGESTIONS = ['Prova', 'Trabalho', 'Seminário', 'Atividade', 'Participação']

interface AssessmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  periodName: string
  assessment: Assessment | null
  calculationMethod: 'simple' | 'weighted'
  isPending: boolean
  onSubmit: (values: { name: string; weight: number }) => void
}

export function AssessmentDialog({
  open,
  onOpenChange,
  periodName,
  assessment,
  calculationMethod,
  isPending,
  onSubmit,
}: AssessmentDialogProps) {
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('1')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(assessment?.name ?? '')
      setWeight(assessment ? String(Number(assessment.weight)) : '1')
      setError(null)
    }
  }, [open, assessment])

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Informe o nome do método de avaliação.')
      return
    }
    const parsedWeight = Number(weight.replace(',', '.'))
    if (Number.isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight > 100) {
      setError('Informe um peso válido maior que zero (até 100).')
      return
    }
    setError(null)
    onSubmit({ name: trimmed, weight: parsedWeight })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {assessment ? 'Editar avaliação' : 'Nova avaliação'}
          </DialogTitle>
          <DialogDescription>
            {assessment
              ? `Atualize os dados da avaliação em ${periodName}.`
              : `Adicione um método de avaliação em ${periodName} (ex: Prova 1, Trabalho).`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {!assessment && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Sugestões rápidas</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setName(suggestion)}
                    className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="assessment-name">Nome da avaliação</Label>
            <Input
              id="assessment-name"
              placeholder="Ex: Prova 1, Trabalho em Grupo..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assessment-weight">
              Peso {calculationMethod === 'simple' ? '(usado na média ponderada)' : ''}
            </Label>
            <Input
              id="assessment-weight"
              type="number"
              step="0.1"
              min="0.1"
              max="100"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {calculationMethod === 'weighted'
                ? 'Este período usa média ponderada: notas com peso maior têm maior influência na média.'
                : 'No momento este período usa média simples, mas o peso fica salvo caso você altere para média ponderada.'}
            </p>
          </div>

          {error && (
            <p className="text-xs font-medium text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : assessment ? 'Salvar alterações' : 'Adicionar avaliação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
