import { Network, CalendarRange, UserPlus, BookOpen, CheckSquare, Settings2 } from 'lucide-react'
import { HubCard } from '../components/HubCard'
import { PageHead } from '../components/PageHead'

export function AcademicHubPage() {
  return (
    <div className="space-y-6">
      <PageHead
        title="Acadêmico"
        subtitle="Organize a estrutura escolar, monte horários e matricule alunos em turmas"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <HubCard
          to="/structure"
          icon={Network}
          title="Estrutura Escolar"
          description="Hierarquia completa: nível de ensino → série → turma. Visualize e organize toda a árvore."
        />
        <HubCard
          to="/scheduling"
          icon={CalendarRange}
          title="Locação de Aulas"
          description="Monte a grade horária — arraste o professor para o slot da turma."
        />
        <HubCard
          to="/scheduling/students"
          icon={UserPlus}
          title="Matrícula em Turmas"
          description="Arraste alunos para turmas e controle o limite de vagas por turma."
        />
        <HubCard
          to="/grades"
          icon={BookOpen}
          title="Notas & Boletim"
          description="Lançamento de notas por bimestre e geração de boletins por aluno."
          disabled
        />
        <HubCard
          to="/attendance"
          icon={CheckSquare}
          title="Frequência"
          description="Registro diário de presença em lote ou aluno a aluno."
          disabled
        />
        <HubCard
          to="/settings"
          icon={Settings2}
          title="Disciplinas & Períodos"
          description="Catálogo de disciplinas e configuração dos períodos letivos."
        />
      </div>
    </div>
  )
}
