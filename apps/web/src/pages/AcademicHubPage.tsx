import { useAuth } from '../contexts/AuthContext'
import { PageHead } from '../components/PageHead'
import { TaskSection, type TaskLinkItem } from '../components/TaskNavigation'
import {
  Network, CalendarRange, UserPlus, BookOpen, CheckSquare, BookMarked, Clock,
  ClipboardCheck, FileText, GraduationCap,
} from 'lucide-react'

export function AcademicHubPage() {
  const { payload } = useAuth()
  const isProfessor = payload?.role === 'professor'
  const isManager = payload?.role === 'gestor'
  const isSecretaria = payload?.role === 'secretaria'

  const managerOrganization: TaskLinkItem[] = [
    { to: '/academic-years', icon: CalendarRange, title: 'Comece pelo ano letivo', description: 'Defina o calendário e os períodos antes de configurar as demais rotinas.', action: 'Configurar ano' },
    { to: '/structure', icon: Network, title: 'Turmas e séries', description: 'Organize níveis de ensino, séries e turmas.', action: 'Organizar' },
    { to: '/scheduling', icon: CalendarRange, title: 'Horários das turmas', description: 'Monte a grade semanal de aulas depois de criar as turmas.', action: 'Ver horários' },
    { to: '/scheduling/students', icon: UserPlus, title: 'Matrículas em turmas', description: 'Confira alunos sem turma e organize as vagas.', action: 'Organizar alunos' },
  ]

  const secretariaOrganization: TaskLinkItem[] = [
    { to: '/academic-years', icon: CalendarRange, title: 'Ano letivo', description: 'Consulte e ajuste o calendário da escola em uso.', action: 'Ver ano letivo' },
    { to: '/scheduling', icon: CalendarRange, title: 'Horários das turmas', description: 'Consulte a grade semanal das turmas.', action: 'Ver horários' },
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
        ...(isManager ? [{ to: '/lesson-records', icon: FileText, title: 'Registros de aula', description: 'Consulte o conteúdo registrado pelos professores.', action: 'Consultar' }] : []),
      ]

  const routine: TaskLinkItem[] = []

  if (isManager) routine.push(
    { to: '/subjects', icon: BookMarked, title: 'Disciplinas', description: 'Cadastre as matérias oferecidas pela escola.', action: 'Registrar disciplinas' },
    { to: '/class-periods', icon: Clock, title: 'Horários de aula', description: 'Defina os horários usados para montar as grades das turmas.', action: 'Registrar horários' },
  )

  return (
    <div className="space-y-8">
      <PageHead title={isProfessor ? 'Minha rotina de ensino' : 'Rotina escolar'} subtitle={isProfessor ? 'Acesse suas turmas e conclua os registros do dia.' : 'Organize as turmas e acompanhe a aprendizagem.'} />
      {!isProfessor && <TaskSection title={isSecretaria ? 'Acompanhe a rotina da escola' : 'Prepare o ano e a estrutura'} description={isSecretaria ? 'Consulte o contexto da escola em uso e organize as matrículas.' : 'Siga esta ordem para evitar listas vazias e deixe a escola pronta para a rotina.'} items={isSecretaria ? secretariaOrganization : managerOrganization} />}
      <TaskSection title={isProfessor ? 'Trabalhar com as turmas' : 'Acompanhar a aprendizagem'} description={isProfessor ? undefined : 'Consulte o andamento das notas, presenças e registros de aula.'} items={learning} />
      {routine.length > 0 && <TaskSection title="Configurações" items={routine} />}
    </div>
  )
}
