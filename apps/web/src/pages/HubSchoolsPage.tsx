import { Home, School } from 'lucide-react'
import { PageHead } from '../components/PageHead'
import { TaskSection } from '../components/TaskNavigation'

export function HubSchoolsPage() {
  return (
    <div className="space-y-8">
      <PageHead title="Rede de escolas" subtitle="A Secretaria de Educação administra as escolas vinculadas e pode acessar uma escola por vez." />
      <TaskSection title="Trabalhar com escolas" items={[
        { to: '/my-schools', icon: Home, title: 'Acessar uma escola', description: 'Escolha uma escola vinculada para abrir o painel e as rotinas dela.', action: 'Escolher escola' },
        { to: '/schools', icon: School, title: 'Escolas da rede', description: 'Consulte ou atualize os dados das escolas administradas pela rede.', action: 'Gerenciar escolas' },
      ]} />
    </div>
  )
}
