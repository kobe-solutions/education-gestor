import { BookMarked, Calendar } from 'lucide-react'
import { HubCard } from '../components/HubCard'

export function HubConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Disciplinas e períodos letivos da escola</p>
      </div>
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        <HubCard
          to="/subjects"
          icon={BookMarked}
          title="Disciplinas"
          description="Cadastre as disciplinas oferecidas pela escola e defina carga horária semanal."
        />
        <HubCard
          to="/academic-periods"
          icon={Calendar}
          title="Períodos Letivos"
          description="Defina os anos e períodos letivos (bimestres, trimestres) com datas de início e fim."
        />
      </div>
    </div>
  )
}
