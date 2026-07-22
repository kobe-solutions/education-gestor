import { BookMarked, Calendar } from 'lucide-react'
import { HubCard } from '../components/HubCard'
import { PageHead } from '../components/PageHead'

export function HubConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <PageHead
        title="Configurações"
        subtitle="Disciplinas e períodos letivos da escola"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
