import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { Toaster } from './components/ui/sonner'
import { AuthProvider } from './contexts/AuthContext'
import { SchoolProvider } from './contexts/SchoolContext'
import { PrivateRoute } from './components/PrivateRoute'
import { AppLayout } from './components/layout/AppLayout'
import { PublicLayout } from './components/layout/PublicLayout'

import { LoginPage } from './features/auth/pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'

import { StudentsPage } from './features/students/pages/StudentsPage'
import { StudentFormPage } from './features/students/pages/StudentFormPage'

import { TeachersPage } from './features/teachers/pages/TeachersPage'
import { TeacherFormPage } from './features/teachers/pages/TeacherFormPage'

import { ClassDetailPage } from './features/classes/pages/ClassDetailPage'

import { StudentReportPage } from './features/academic/pages/StudentReportPage'

import { TuitionsPage } from './features/financial/pages/TuitionsPage'

import { SecretariasPage } from './features/secretarias/pages/SecretariasPage'
import { MySchoolsPage } from './features/secretarias/pages/MySchoolsPage'

import { SubjectsPage } from './features/subjects/pages/SubjectsPage'
import { SchoolsPage } from './features/schools/pages/SchoolsPage'
import { AcademicPeriodsPage } from './features/classes/pages/AcademicPeriodsPage'
import { EducationLevelsPage } from './features/educationLevels/pages/EducationLevelsPage'
import { SeriesPage } from './features/series/pages/SeriesPage'
import { TimetablePage } from './features/timetable/pages/TimetablePage'
import { LocacaoPage } from './features/locacao/pages/LocacaoPage'
import { LocacaoAlunosPage } from './features/locacao/pages/LocacaoAlunosPage'
import { EstruturaPage } from './features/estrutura/pages/EstruturaPage'
import { EstruturaTurmasPage } from './features/academico/pages/EstruturaTurmasPage'
import { HubPessoasPage } from './pages/HubPessoasPage'
import { HubConfiguracoesPage } from './pages/HubConfiguracoesPage'
import { HubAdminPage } from './pages/HubAdminPage'
import { HubEscolasPage } from './pages/HubEscolasPage'

export function App() {
  return (
    <AuthProvider>
      <SchoolProvider>
        <BrowserRouter>
          <Routes>
            {/* Rotas públicas */}
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Rotas autenticadas */}
            <Route element={<PrivateRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />

                {/* Hubs de navegação — gestor */}
                <Route element={<PrivateRoute allowedRoles={['gestor']} />}>
                  <Route path="/estrutura" element={<EstruturaPage />} />
                  <Route path="/configuracoes" element={<HubConfiguracoesPage />} />
                  <Route path="/subjects" element={<SubjectsPage />} />
                  <Route path="/academic-periods" element={<AcademicPeriodsPage />} />
                  <Route path="/education-levels" element={<EducationLevelsPage />} />
                  <Route path="/education-levels/:levelId/series" element={<SeriesPage />} />
                  <Route path="/series" element={<SeriesPage />} />
                </Route>

                {/* Hubs de navegação — gestor e secretaria */}
                <Route element={<PrivateRoute allowedRoles={['gestor', 'secretaria']} />}>
                  <Route path="/pessoas" element={<HubPessoasPage />} />
                  <Route path="/students" element={<StudentsPage />} />
                  <Route path="/students/new" element={<StudentFormPage />} />
                  <Route path="/students/:id" element={<StudentFormPage />} />
                  <Route path="/students/:id/report" element={<StudentReportPage />} />
                  <Route path="/locacao" element={<LocacaoPage />} />
                  <Route path="/locacao-alunos" element={<LocacaoAlunosPage />} />
                  <Route path="/teachers" element={<TeachersPage />} />
                  <Route path="/teachers/new" element={<TeacherFormPage />} />
                  <Route path="/teachers/:id/edit" element={<TeacherFormPage />} />
                  <Route path="/financial" element={<TuitionsPage />} />
                </Route>

                {/* Hubs de navegação — gestor, professor e secretaria */}
                <Route element={<PrivateRoute allowedRoles={['gestor', 'professor', 'secretaria']} />}>
                  <Route path="/academico" element={<EstruturaTurmasPage />} />
                  <Route path="/classes/:id" element={<ClassDetailPage />} />
                  <Route path="/classes/:id/timetable" element={<TimetablePage />} />
                </Route>

                {/* Secretaria */}
                <Route element={<PrivateRoute allowedRoles={['secretaria']} />}>
                  <Route path="/escolas" element={<HubEscolasPage />} />
                  <Route path="/my-schools" element={<MySchoolsPage />} />
                </Route>

                {/* Admin */}
                <Route element={<PrivateRoute allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<HubAdminPage />} />
                  <Route path="/secretarias" element={<SecretariasPage />} />
                </Route>

                {/* Admin e secretaria */}
                <Route element={<PrivateRoute allowedRoles={['admin', 'secretaria']} />}>
                  <Route path="/schools" element={<SchoolsPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </SchoolProvider>
    </AuthProvider>
  )
}
