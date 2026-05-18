import { Users, GraduationCap, CalendarRange, UserPlus } from 'lucide-react'
import { HubCard } from '../components/HubCard'

export function HubPessoasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Pessoas</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie alunos e professores da escola</p>
      </div>
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        <HubCard
          to="/students"
          icon={Users}
          title="Alunos"
          description="Cadastro, matrículas e dados dos alunos. Acesse o boletim e histórico individual."
        />
        <HubCard
          to="/teachers"
          icon={GraduationCap}
          title="Professores"
          description="Cadastro de professores e seus dados completos."
        />
        <HubCard
          to="/locacao"
          icon={CalendarRange}
          title="Locação de Aulas"
          description="Monte visualmente a grade horária — arraste professores para as turmas."
        />
        <HubCard
          to="/locacao-alunos"
          icon={UserPlus}
          title="Matrícula em Turmas"
          description="Arraste alunos para turmas e controle o limite de vagas por turma."
        />
      </div>
    </div>
  )
}
