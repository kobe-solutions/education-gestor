import { useAuth } from '../contexts/AuthContext'
import { PageHead } from '../components/PageHead'
import { TaskSection, type TaskLinkItem } from '../components/TaskNavigation'
import {
  Network, CalendarRange, UserPlus, BookOpen, CheckSquare, Settings2,
  ClipboardCheck, PartyPopper, FileText, GraduationCap,
} from 'lucide-react'

export function AcademicHubPage() {
  const { payload } = useAuth()
  const isProfessor = payload?.role === 'professor'
  const isManager = payload?.role === 'gestor'

  const organization: TaskLinkItem[] = [
    { to: '/structure', icon: Network, title: 'Turmas e séries', description: 'Organize níveis de ensino, séries e turmas.', action: 'Organizar' },
    { to: '/academic-years', icon: CalendarRange, title: 'Ano letivo', description: 'Defina o calendário e os períodos do ano.', action: 'Configurar' },
    { to: '/scheduling', icon: CalendarRange, title: 'Horários das turmas', description: 'Monte a grade semanal de aulas.', action: 'Ver horários' },
    { to: '/scheduling/students', icon: UserPlus, title: 'Matrículas em turmas', description: 'Confira alunos sem turma e organize as vagas.', action: 'Organizar alunos' },
  ]

  const learning: TaskLinkItem[] = isProfessor
    ? [
        { to: '/professor/grades', icon: GraduationCap, title: 'Notas', description: 'Lance e consulte as notas das suas turmas.', action: 'Acessar notas' },
        { to: '/professor/attendance', icon: CheckSquare, title: 'Frequência', description: 'Faça a chamada e acompanhe presenças.', action: 'Fazer chamada' },
        { to: '/lesson-records', icon: FileText, title: 'Registro de aulas', description: 'Registre o conteúdo trabalhado em cada aula.', action: 'Registrar aula' },
      ]
    : [
        { to: '/grades', icon: BookOpen, title: 'Notas e boletins', description: 'Acompanhe os resultados de cada turma.', action: 'Acessar notas' },
        { to: '/attendance', icon: CheckSquare, title: 'Frequência', description: 'Consulte e registre a presença dos alunos.', action: 'Acessar frequência' },
        { to: '/dashboard/registration-status', icon: ClipboardCheck, title: 'Acompanhar registros', description: 'Veja o que já foi lançado e o que está pendente.', action: 'Ver pendências' },
        { to: '/lesson-records', icon: FileText, title: 'Registros de aula', description: 'Consulte o conteúdo registrado pelos professores.', action: 'Consultar' },
      ]

  const routine: TaskLinkItem[] = [
    { to: '/school-events', icon: PartyPopper, title: 'Calendário da escola', description: 'Consulte e organize eventos escolares.', action: 'Abrir calendário' },
  ]

  if (isManager) routine.push({ to: '/settings', icon: Settings2, title: 'Disciplinas e horários', description: 'Configure disciplinas e tempos de aula.', action: 'Configurar' })

  return (
    <div className="space-y-8">
      <PageHead title={isProfessor ? 'Minha rotina de ensino' : 'Rotina escolar'} subtitle={isProfessor ? 'Acesse suas turmas e conclua os registros do dia.' : 'Organize as turmas, acompanhe a aprendizagem e cuide do calendário escolar.'} />
      {!isProfessor && <TaskSection title="Organizar a escola" description="Prepare a estrutura e distribua os alunos nas turmas." items={organization} />}
      <TaskSection title={isProfessor ? 'Trabalhar com as turmas' : 'Acompanhar a aprendizagem'} description={isProfessor ? undefined : 'Consulte o andamento das notas, presenças e registros de aula.'} items={learning} />
      <TaskSection title="Calendário e configurações" items={routine} />
    </div>
  )
}
