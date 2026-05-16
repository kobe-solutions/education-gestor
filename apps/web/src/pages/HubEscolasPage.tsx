import { Home, School } from 'lucide-react'
import { HubCard } from '../components/HubCard'

export function HubEscolasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Escolas</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie as escolas vinculadas à sua secretaria</p>
      </div>
      <div className="grid grid-cols-2 gap-4 max-w-xl">
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
