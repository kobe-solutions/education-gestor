import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { Toaster } from './components/ui/sonner'
import { AuthProvider } from './contexts/AuthContext'
import { SchoolProvider } from './contexts/SchoolContext'
import { FinancialVisibilityProvider } from './contexts/FinancialVisibilityContext'
import { PrivateRoute } from './components/PrivateRoute'
import { AppLayout } from './components/layout/AppLayout'
import { PublicLayout } from './components/layout/PublicLayout'
import { RouteError } from './components/RouteError'
import { Skeleton } from './components/ui/skeleton'

import { LoginPage } from './features/auth/pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'

// Code-split heavy pages
const StudentsPage = lazy(() => import('./features/students/pages/StudentsPage').then(m => ({ default: m.StudentsPage })))
const StudentDetailPage = lazy(() => import('./features/students/pages/StudentDetailPage').then(m => ({ default: m.StudentDetailPage })))
const StudentFormPage = lazy(() => import('./features/students/pages/StudentFormPage').then(m => ({ default: m.StudentFormPage })))
const TeachersPage = lazy(() => import('./features/teachers/pages/TeachersPage').then(m => ({ default: m.TeachersPage })))
const TeacherFormPage = lazy(() => import('./features/teachers/pages/TeacherFormPage').then(m => ({ default: m.TeacherFormPage })))
const ClassDetailPage = lazy(() => import('./features/classes/pages/ClassDetailPage').then(m => ({ default: m.ClassDetailPage })))
const StudentReportPage = lazy(() => import('./features/academic/pages/StudentReportPage').then(m => ({ default: m.StudentReportPage })))
const TuitionsPage = lazy(() => import('./features/financial/pages/TuitionsPage').then(m => ({ default: m.TuitionsPage })))
const SecretariasPage = lazy(() => import('./features/secretarias/pages/SecretariasPage').then(m => ({ default: m.SecretariasPage })))
const MySchoolsPage = lazy(() => import('./features/secretarias/pages/MySchoolsPage').then(m => ({ default: m.MySchoolsPage })))
const SubjectsPage = lazy(() => import('./features/subjects/pages/SubjectsPage').then(m => ({ default: m.SubjectsPage })))
const SchoolsPage = lazy(() => import('./features/schools/pages/SchoolsPage').then(m => ({ default: m.SchoolsPage })))
const AcademicYearsPage = lazy(() => import('./features/classes/pages/AcademicYearsPage').then(m => ({ default: m.AcademicYearsPage })))
const EducationLevelsPage = lazy(() => import('./features/educationLevels/pages/EducationLevelsPage').then(m => ({ default: m.EducationLevelsPage })))
const SeriesPage = lazy(() => import('./features/series/pages/SeriesPage').then(m => ({ default: m.SeriesPage })))
const TimetablePage = lazy(() => import('./features/timetable/pages/TimetablePage').then(m => ({ default: m.TimetablePage })))
const SchedulingPage = lazy(() => import('./features/scheduling/pages/SchedulingPage').then(m => ({ default: m.SchedulingPage })))
const StudentSchedulingPage = lazy(() => import('./features/scheduling/pages/StudentSchedulingPage').then(m => ({ default: m.StudentSchedulingPage })))
const StructurePage = lazy(() => import('./features/structure/pages/StructurePage').then(m => ({ default: m.StructurePage })))
const ClassStructurePage = lazy(() => import('./features/academic-hub/pages/ClassStructurePage').then(m => ({ default: m.ClassStructurePage })))
const HubPeoplePage = lazy(() => import('./pages/HubPeoplePage').then(m => ({ default: m.HubPeoplePage })))
const AcademicHubPage = lazy(() => import('./pages/AcademicHubPage').then(m => ({ default: m.AcademicHubPage })))
const HubSettingsPage = lazy(() => import('./pages/HubSettingsPage').then(m => ({ default: m.HubSettingsPage })))
const HubAdminPage = lazy(() => import('./pages/HubAdminPage').then(m => ({ default: m.HubAdminPage })))
const AdminActivityPage = lazy(() => import('./features/admin/pages/AdminActivityPage').then(m => ({ default: m.AdminActivityPage })))
const HubSchoolsPage = lazy(() => import('./pages/HubSchoolsPage').then(m => ({ default: m.HubSchoolsPage })))
const ProfessorDashboardPage = lazy(() => import('./features/teacher-dashboard/pages/ProfessorDashboardPage').then(m => ({ default: m.ProfessorDashboardPage })))
const ClassPerformancePage = lazy(() => import('./features/teacher-dashboard/pages/ClassPerformancePage').then(m => ({ default: m.ClassPerformancePage })))
const TeacherAttendancePage = lazy(() => import('./features/teacher-dashboard/pages/AttendancePage').then(m => ({ default: m.AttendancePage })))
const MyClassesPage = lazy(() => import('./features/teacher-dashboard/pages/MyClassesPage').then(m => ({ default: m.MyClassesPage })))
const ProfessorGradesPage = lazy(() => import('./features/teacher-dashboard/pages/ProfessorGradesPage').then(m => ({ default: m.ProfessorGradesPage })))
const ProfessorProfilePage = lazy(() => import('./features/teacher-dashboard/pages/ProfessorProfilePage').then(m => ({ default: m.ProfessorProfilePage })))
const GestorAttendancePage = lazy(() => import('./features/academic/pages/AttendancePage').then(m => ({ default: m.AttendancePage })))
const GradesPage = lazy(() => import('./features/academic/pages/GradesPage').then(m => ({ default: m.GradesPage })))
const AcademicPeriodsPage = lazy(() => import('./features/classes/pages/AcademicPeriodsPage').then(m => ({ default: m.AcademicPeriodsPage })))

function PageLoader() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <SchoolProvider>
        <FinancialVisibilityProvider>
        <BrowserRouter>
          <Routes>
            {/* Rotas públicas */}
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Rotas autenticadas */}
            <Route element={<PrivateRoute />} errorElement={<RouteError />}>
              <Route element={<AppLayout />} errorElement={<RouteError />}>
                <Route path="/" element={<DashboardPage />} />

                {/* Hubs de navegação — gestor */}
                <Route element={<PrivateRoute allowedRoles={['gestor']} />}>
                  <Route path="/structure" element={<Suspense fallback={<PageLoader />}><StructurePage /></Suspense>} />
                  <Route path="/structure/classes" element={<Suspense fallback={<PageLoader />}><ClassStructurePage /></Suspense>} />
                  <Route path="/settings" element={<Suspense fallback={<PageLoader />}><HubSettingsPage /></Suspense>} />
                  <Route path="/subjects" element={<Suspense fallback={<PageLoader />}><SubjectsPage /></Suspense>} />
                  <Route path="/education-levels" element={<Suspense fallback={<PageLoader />}><EducationLevelsPage /></Suspense>} />
                  <Route path="/education-levels/:levelId/series" element={<Suspense fallback={<PageLoader />}><SeriesPage /></Suspense>} />
                  <Route path="/series" element={<Suspense fallback={<PageLoader />}><SeriesPage /></Suspense>} />
                  <Route path="/academic-periods" element={<Navigate to="/academic-years" replace />} />
                </Route>

                {/* Hubs de navegação — gestor e secretaria */}
                <Route element={<PrivateRoute allowedRoles={['gestor', 'secretaria']} />}>
                  <Route path="/academic-years" element={<Suspense fallback={<PageLoader />}><AcademicYearsPage /></Suspense>} />
                  <Route path="/people" element={<Suspense fallback={<PageLoader />}><HubPeoplePage /></Suspense>} />
                  <Route path="/students" element={<Suspense fallback={<PageLoader />}><StudentsPage /></Suspense>} />
                  <Route path="/students/new" element={<Suspense fallback={<PageLoader />}><StudentFormPage /></Suspense>} />
                  <Route path="/students/:id" element={<Suspense fallback={<PageLoader />}><StudentDetailPage /></Suspense>} />
                  <Route path="/students/:id/edit" element={<Suspense fallback={<PageLoader />}><StudentFormPage /></Suspense>} />
                  <Route path="/students/:id/report" element={<Suspense fallback={<PageLoader />}><StudentReportPage /></Suspense>} />
                  <Route path="/scheduling" element={<Suspense fallback={<PageLoader />}><SchedulingPage /></Suspense>} />
                  <Route path="/scheduling/students" element={<Suspense fallback={<PageLoader />}><StudentSchedulingPage /></Suspense>} />
                  <Route path="/teachers" element={<Suspense fallback={<PageLoader />}><TeachersPage /></Suspense>} />
                  <Route path="/teachers/new" element={<Suspense fallback={<PageLoader />}><TeacherFormPage /></Suspense>} />
                  <Route path="/teachers/:id/edit" element={<Suspense fallback={<PageLoader />}><TeacherFormPage /></Suspense>} />
                  <Route path="/financial" element={<Suspense fallback={<PageLoader />}><TuitionsPage /></Suspense>} />
                  <Route path="/grades" element={<Suspense fallback={<PageLoader />}><GradesPage /></Suspense>} />
                  <Route path="/attendance" element={<Suspense fallback={<PageLoader />}><GestorAttendancePage /></Suspense>} />
                </Route>

                {/* Hubs de navegação — gestor, professor e secretaria */}
                <Route element={<PrivateRoute allowedRoles={['gestor', 'professor', 'secretaria']} />}>
                  <Route path="/academic" element={<Suspense fallback={<PageLoader />}><AcademicHubPage /></Suspense>} />
                  <Route path="/classes/:id" element={<Suspense fallback={<PageLoader />}><ClassDetailPage /></Suspense>} />
                  <Route path="/classes/:id/timetable" element={<Suspense fallback={<PageLoader />}><TimetablePage /></Suspense>} />
                </Route>

                {/* Professor Dashboard */}
                <Route element={<PrivateRoute allowedRoles={['professor']} />}>
                  <Route path="/professor" element={<Suspense fallback={<PageLoader />}><ProfessorDashboardPage /></Suspense>} />
                  <Route path="/professor/classes" element={<Suspense fallback={<PageLoader />}><MyClassesPage /></Suspense>} />
                  <Route path="/professor/grades" element={<Suspense fallback={<PageLoader />}><ProfessorGradesPage /></Suspense>} />
                  <Route path="/professor/performance" element={<Suspense fallback={<PageLoader />}><ClassPerformancePage /></Suspense>} />
                  <Route path="/professor/attendance" element={<Suspense fallback={<PageLoader />}><TeacherAttendancePage /></Suspense>} />
                  <Route path="/professor/profile" element={<Suspense fallback={<PageLoader />}><ProfessorProfilePage /></Suspense>} />
                </Route>

                {/* Secretaria */}
                <Route element={<PrivateRoute allowedRoles={['secretaria']} />}>
                  <Route path="/schools-hub" element={<Suspense fallback={<PageLoader />}><HubSchoolsPage /></Suspense>} />
                  <Route path="/my-schools" element={<Suspense fallback={<PageLoader />}><MySchoolsPage /></Suspense>} />
                </Route>

                {/* Admin */}
                <Route element={<PrivateRoute allowedRoles={['admin']} />}>
                  <Route path="/admin/activity" element={<Suspense fallback={<PageLoader />}><AdminActivityPage /></Suspense>} />
                  <Route path="/secretarias" element={<Suspense fallback={<PageLoader />}><SecretariasPage /></Suspense>} />
                </Route>

                {/* Admin e secretaria */}
                <Route element={<PrivateRoute allowedRoles={['admin', 'secretaria']} />}>
                  <Route path="/schools" element={<Suspense fallback={<PageLoader />}><SchoolsPage /></Suspense>} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </FinancialVisibilityProvider>
      </SchoolProvider>
    </AuthProvider>
  )
}
