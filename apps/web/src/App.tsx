import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { AppLayout } from './components/layout/AppLayout'
import { PublicLayout } from './components/layout/PublicLayout'

import { LoginPage } from './features/auth/pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'

import { StudentsPage } from './features/students/pages/StudentsPage'
import { StudentDetailPage } from './features/students/pages/StudentDetailPage'

import { TeachersPage } from './features/teachers/pages/TeachersPage'

import { ClassesPage } from './features/classes/pages/ClassesPage'
import { ClassDetailPage } from './features/classes/pages/ClassDetailPage'

import { GradesPage } from './features/academic/pages/GradesPage'
import { AttendancePage } from './features/academic/pages/AttendancePage'
import { StudentReportPage } from './features/academic/pages/StudentReportPage'

import { TuitionsPage } from './features/financial/pages/TuitionsPage'

import { SecretariasPage } from './features/secretarias/pages/SecretariasPage'

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas */}
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Rotas autenticadas — gestor + admin */}
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />

              {/* Gestores */}
              <Route element={<PrivateRoute allowedRoles={['gestor']} />}>
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/students/:id" element={<StudentDetailPage />} />
                <Route path="/students/:id/report" element={<StudentReportPage />} />
                <Route path="/teachers" element={<TeachersPage />} />
                <Route path="/financial" element={<TuitionsPage />} />
              </Route>

              {/* Gestores e professores */}
              <Route element={<PrivateRoute allowedRoles={['gestor', 'professor']} />}>
                <Route path="/classes" element={<ClassesPage />} />
                <Route path="/classes/:id" element={<ClassDetailPage />} />
                <Route path="/grades" element={<GradesPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
              </Route>

              {/* Admin */}
              <Route element={<PrivateRoute allowedRoles={['admin']} />}>
                <Route path="/secretarias" element={<SecretariasPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
