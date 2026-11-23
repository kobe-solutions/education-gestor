import { BookMarked, Calendar, Clock, Network } from 'lucide-react'
import { PageHead } from '../components/PageHead'
import { TaskSection } from '../components/TaskNavigation'

export function HubSettingsPage() {
  return (
    <div className="space-y-8">
      <PageHead title="Configurar a escola" subtitle="Ajuste os cadastros que serão usados nas turmas e no calendário letivo." />
      <TaskSection title="Preparar o ano letivo" description="Faça esta configuração antes de organizar turmas e matrículas." items={[
        { to: '/academic-years', icon: Calendar, title: 'Anos e períodos letivos', description: 'Defina o ano, as datas e os períodos de avaliação.', action: 'Configurar calendário' },
        { to: '/education-levels', icon: Network, title: 'Níveis, séries e turmas', description: 'Monte a estrutura que representa as etapas de ensino da escola.', action: 'Organizar estrutura' },
      ]} />
      <TaskSection title="Completar os cadastros" items={[
        { to: '/subjects', icon: BookMarked, title: 'Disciplinas', description: 'Cadastre as matérias oferecidas pela escola.', action: 'Ver disciplinas' },
        { to: '/class-periods', icon: Clock, title: 'Horários de aula', description: 'Defina os horários usados para montar as grades das turmas.', action: 'Configurar horários' },
      ]} />
    </div>
  )
}
