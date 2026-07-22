import { Home, School } from 'lucide-react'
import { HubCard } from '../components/HubCard'
import { PageHead } from '../components/PageHead'

export function HubSchoolsPage() {
  return (
    <div className="space-y-6">
      <PageHead
        title="Escolas"
        subtitle="Gerencie as escolas vinculadas à sua secretaria"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HubCard
          to="/my-schools"
          icon={Home}
          title="Minhas Escolas"
          description="Visualize e selecione as escolas vinculadas à sua secretaria para gerenciamento."
        />
        <HubCard
          to="/schools"
          icon={School}
          title="Todas as Escolas"
          description="Cadastro completo de escolas com dados de endereço e responsáveis."
        />
      </div>
    </div>
  )
}
