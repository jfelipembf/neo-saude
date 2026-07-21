import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { AuthGuard } from './guards/AuthGuard'
import { APP_ROUTES, AUTH_ROUTES, SYSTEM_ROUTES } from '@/constants'
import { PageLoader } from '@/components/PageLoader/PageLoader'

// Páginas carregadas sob demanda (code-splitting): cada página é um chunk próprio,
// baixado só quando a rota é acessada; o Suspense mostra o PageLoader nesse meio-tempo.
const LoginPage          = lazy(() => import('@/pages/Auth/Login/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage      = lazy(() => import('@/pages/Dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const AgendaPage         = lazy(() => import('@/pages/Agenda/AgendaPage').then(m => ({ default: m.AgendaPage })))
const PatientsPage       = lazy(() => import('@/pages/Patients/PatientsPage').then(m => ({ default: m.PatientsPage })))
const PatientProfilePage = lazy(() => import('@/pages/Patients/Profile/PatientProfilePage').then(m => ({ default: m.PatientProfilePage })))
const ProfessionalsPage  = lazy(() => import('@/pages/Professionals/ProfessionalsPage').then(m => ({ default: m.ProfessionalsPage })))
const FinancePage        = lazy(() => import('@/pages/Finance/FinancePage').then(m => ({ default: m.FinancePage })))
const AdminPage          = lazy(() => import('@/pages/Admin/AdminPage').then(m => ({ default: m.AdminPage })))
const NotFoundPage       = lazy(() => import('@/pages/System/NotFound/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* ── Rotas públicas ──────────────────────────────────────── */}
          <Route path={AUTH_ROUTES.LOGIN} element={<LoginPage />} />

          {/* ── Rotas protegidas: exige login ───────────────────────── */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route path={APP_ROUTES.DASHBOARD}       element={<DashboardPage />} />
              <Route path={APP_ROUTES.AGENDA}          element={<AgendaPage />} />
              <Route path={APP_ROUTES.PACIENTES}       element={<PatientsPage />} />
              <Route path={APP_ROUTES.PACIENTE_PERFIL} element={<PatientProfilePage />} />
              <Route path={APP_ROUTES.PROFISSIONAIS}   element={<ProfessionalsPage />} />
              <Route path={APP_ROUTES.FINANCEIRO}      element={<FinancePage />} />
              {/* Administrativo: página única com abas (consultório · salas · materiais). */}
              <Route path={APP_ROUTES.ADMINISTRATIVO}  element={<AdminPage />} />
            </Route>
          </Route>

          {/* ── Fallback ────────────────────────────────────────────── */}
          <Route path={SYSTEM_ROUTES.NOT_FOUND} element={<NotFoundPage />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
