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
import { AcademicYearsPage } from './features/classes/pages/AcademicYearsPage'
import { EducationLevelsPage } from './features/educationLevels/pages/EducationLevelsPage'
import { SeriesPage } from './features/series/pages/SeriesPage'
import { TimetablePage } from './features/timetable/pages/TimetablePage'
import { SchedulingPage } from './features/scheduling/pages/SchedulingPage'
import { StudentSchedulingPage } from './features/scheduling/pages/StudentSchedulingPage'
import { StructurePage } from './features/structure/pages/StructurePage'
import { ClassStructurePage } from './features/academic-hub/pages/ClassStructurePage'
import { HubPeoplePage } from './pages/HubPeoplePage'
import { AcademicHubPage } from './pages/AcademicHubPage'
import { HubSettingsPage } from './pages/HubSettingsPage'
import { HubAdminPage } from './pages/HubAdminPage'
import { AdminActivityPage } from './features/admin/pages/AdminActivityPage'
import { HubSchoolsPage } from './pages/HubSchoolsPage'
import { ProfessorDashboardPage } from './features/teacher-dashboard/pages/ProfessorDashboardPage'
import { ClassPerformancePage } from './features/teacher-dashboard/pages/ClassPerformancePage'
import { AttendancePage } from './features/teacher-dashboard/pages/AttendancePage'
import { MyClassesPage } from './features/teacher-dashboard/pages/MyClassesPage'

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
                  <Route path="/structure" element={<StructurePage />} />
                  <Route path="/structure/classes" element={<ClassStructurePage />} />
                  <Route path="/settings" element={<HubSettingsPage />} />
                  <Route path="/subjects" element={<SubjectsPage />} />
                  <Route path="/education-levels" element={<EducationLevelsPage />} />
                  <Route path="/education-levels/:levelId/series" element={<SeriesPage />} />
                  <Route path="/series" element={<SeriesPage />} />
                </Route>

                {/* Hubs de navegação — gestor e secretaria */}
                <Route element={<PrivateRoute allowedRoles={['gestor', 'secretaria']} />}>
                  <Route path="/academic-years" element={<AcademicYearsPage />} />
                  <Route path="/people" element={<HubPeoplePage />} />
                  <Route path="/students" element={<StudentsPage />} />
                  <Route path="/students/new" element={<StudentFormPage />} />
                  <Route path="/students/:id" element={<StudentFormPage />} />
                  <Route path="/students/:id/report" element={<StudentReportPage />} />
                  <Route path="/scheduling" element={<SchedulingPage />} />
                  <Route path="/scheduling/students" element={<StudentSchedulingPage />} />
                  <Route path="/teachers" element={<TeachersPage />} />
                  <Route path="/teachers/new" element={<TeacherFormPage />} />
                  <Route path="/teachers/:id/edit" element={<TeacherFormPage />} />
                  <Route path="/financial" element={<TuitionsPage />} />
                </Route>

                {/* Hubs de navegação — gestor, professor e secretaria */}
                <Route element={<PrivateRoute allowedRoles={['gestor', 'professor', 'secretaria']} />}>
                  <Route path="/academic" element={<AcademicHubPage />} />
                  <Route path="/classes/:id" element={<ClassDetailPage />} />
                  <Route path="/classes/:id/timetable" element={<TimetablePage />} />
                </Route>

                {/* Professor Dashboard */}
                <Route element={<PrivateRoute allowedRoles={['professor']} />}>
                  <Route path="/professor" element={<ProfessorDashboardPage />} />
                  <Route path="/professor/classes" element={<MyClassesPage />} />
                  <Route path="/professor/performance" element={<ClassPerformancePage />} />
                  <Route path="/professor/attendance" element={<AttendancePage />} />
                </Route>

                {/* Secretaria */}
                <Route element={<PrivateRoute allowedRoles={['secretaria']} />}>
                  <Route path="/schools-hub" element={<HubSchoolsPage />} />
                  <Route path="/my-schools" element={<MySchoolsPage />} />
                </Route>

                {/* Admin */}
                <Route element={<PrivateRoute allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<HubAdminPage />} />
                  <Route path="/admin/activity" element={<AdminActivityPage />} />
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
