import { useNavigate } from 'react-router'
import { GraduationCap, UserRound, UserRoundPlus } from 'lucide-react'
import { PageHead } from '../components/PageHead'
import { TaskSection } from '../components/TaskNavigation'
import { Button } from '../components/ui/button'

export function HubPeoplePage() {
  const navigate = useNavigate()
  return (
    <div className="space-y-8">
      <PageHead
        title="Pessoas"
        subtitle="Encontre alunos e professores ou faça um novo cadastro."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate('/students/new')}><UserRoundPlus size={16} /> Cadastrar aluno</Button>
            <Button variant="outline" onClick={() => navigate('/teachers/new')}><UserRoundPlus size={16} /> Cadastrar professor</Button>
          </div>
        )}
      />
      <TaskSection title="Acessar cadastros" description="Cada cadastro reúne os dados, documentos e informações escolares da pessoa." items={[
        { to: '/students', icon: UserRound, title: 'Alunos', description: 'Consulte cadastros, matrículas e histórico dos estudantes.', action: 'Ver alunos' },
        { to: '/teachers', icon: GraduationCap, title: 'Professores', description: 'Consulte a equipe docente e seus dados profissionais.', action: 'Ver professores' },
      ]} />
    </div>
  )
}
