import { Building2, School } from 'lucide-react'
import { HubCard } from '../components/HubCard'
import { PageHead } from '../components/PageHead'

export function HubAdminPage() {
  return (
    <div className="space-y-6">
      <PageHead
        title="Administração"
        subtitle="Gestão de secretarias e escolas da plataforma"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
