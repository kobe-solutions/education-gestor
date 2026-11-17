import { Activity, Building2, School } from 'lucide-react'
import { PageHead } from '../components/PageHead'
import { TaskSection } from '../components/TaskNavigation'

export function HubAdminPage() {
  return (
    <div className="space-y-8">
      <PageHead title="Administração da plataforma" subtitle="Gerencie as organizações que usam a IRIS Educação." />
      <TaskSection title="Organizações" items={[
        { to: '/secretarias', icon: Building2, title: 'Secretarias', description: 'Cadastre e gerencie as secretarias vinculadas à plataforma.', action: 'Ver secretarias' },
        { to: '/schools', icon: School, title: 'Escolas', description: 'Consulte os cadastros de escolas e seus vínculos.', action: 'Ver escolas' },
      ]} />
      <TaskSection title="Acompanhar a plataforma" items={[
        { to: '/admin/activity', icon: Activity, title: 'Histórico de atividade', description: 'Consulte ações realizadas por usuários na plataforma.', action: 'Ver atividade' },
      ]} />
    </div>
  )
}
