import { Building2, School } from 'lucide-react'
import { HubCard } from '../components/HubCard'

export function HubAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Administração</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão de secretarias e escolas da plataforma</p>
      </div>
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        <HubCard
          to="/secretarias"
          icon={Building2}
          title="Secretarias"
          description="Cadastro e gerenciamento das secretarias de educação vinculadas à plataforma."
        />
        <HubCard
          to="/schools"
          icon={School}
          title="Escolas"
          description="Visualize e gerencie as escolas vinculadas a cada secretaria."
        />
      </div>
    </div>
  )
}
