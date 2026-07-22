import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { AuthGuard } from './guards/AuthGuard'
import { APP_ROUTES, AUTH_ROUTES, SYSTEM_ROUTES } from '@/constants'
import { PageLoader } from '@/components/PageLoader/PageLoader'

// Páginas carregadas sob demanda (code-splitting): cada página é um chunk próprio,
// baixado só quando a rota é acessada; o Suspense mostra o PageLoader nesse meio-tempo.
const LoginPage          = lazy(() => import('@/pages/Auth/Login/LoginPage').then(m => ({ default: m.LoginPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/Auth/ForgotPassword/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const DashboardPage      = lazy(() => import('@/pages/Dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const AgendaPage         = lazy(() => import('@/pages/Agenda/AgendaPage').then(m => ({ default: m.AgendaPage })))
const PatientsPage       = lazy(() => import('@/pages/Patients/PatientsPage').then(m => ({ default: m.PatientsPage })))
const PatientProfilePage = lazy(() => import('@/pages/Patients/Profile/PatientProfilePage').then(m => ({ default: m.PatientProfilePage })))
const ProfessionalsPage  = lazy(() => import('@/pages/Professionals/ProfessionalsPage').then(m => ({ default: m.ProfessionalsPage })))
const ProfessionalProfilePage = lazy(() => import('@/pages/Professionals/Profile/ProfessionalProfilePage').then(m => ({ default: m.ProfessionalProfilePage })))
const FinancePage        = lazy(() => import('@/pages/Finance/FinancePage').then(m => ({ default: m.FinancePage })))
const AdminPage          = lazy(() => import('@/pages/Admin/AdminPage').then(m => ({ default: m.AdminPage })))
const SettingsPage       = lazy(() => import('@/pages/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const NotFoundPage       = lazy(() => import('@/pages/System/NotFound/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* ── Rotas públicas ──────────────────────────────────────── */}
          <Route path={AUTH_ROUTES.LOGIN}           element={<LoginPage />} />
          <Route path={AUTH_ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

          {/* ── Rotas protegidas: exige login ───────────────────────── */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route path={APP_ROUTES.DASHBOARD}       element={<DashboardPage />} />
              <Route path={APP_ROUTES.SCHEDULE}          element={<AgendaPage />} />
              <Route path={APP_ROUTES.PATIENTS}       element={<PatientsPage />} />
              <Route path={APP_ROUTES.PATIENT_PROFILE} element={<PatientProfilePage />} />
              <Route path={APP_ROUTES.PROFESSIONALS}   element={<ProfessionalsPage />} />
              <Route path={APP_ROUTES.PROFESSIONAL_PROFILE} element={<ProfessionalProfilePage />} />
              <Route path={APP_ROUTES.FINANCE}      element={<FinancePage />} />
              {/* Administrativo: página única com abas (consultório · salas · materiais). */}
              <Route path={APP_ROUTES.ADMIN}  element={<AdminPage />} />
              <Route path={APP_ROUTES.SETTINGS}   element={<SettingsPage />} />
            </Route>
          </Route>

          {/* ── Fallback ────────────────────────────────────────────── */}
          <Route path={SYSTEM_ROUTES.NOT_FOUND} element={<NotFoundPage />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
