import { lazy, Suspense, useEffect, useRef } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router'
import { AppLayout } from '../layouts/AppLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { AuthCallbackPage } from '../features/auth/AuthCallbackPage'
import { AuthProvider } from '../features/auth/AuthProvider'
import { GuestOnly, RequireAuth } from '../features/auth/AuthGuards'
import { CaloriesPage } from '../features/meals/CaloriesPage'
import { StatisticsPage } from '../features/statistics/StatisticsPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { EmptyState, LinkButton } from '../components/ui'
import { Compass } from 'lucide-react'
import { navigation } from './navigation'

const authTitles: Record<string, string> = {
  '/login': 'Iniciar sesión',
  '/register': 'Crear cuenta',
  '/forgot-password': 'Recuperar acceso',
  '/update-password': 'Actualizar contraseña',
  '/auth/callback': 'Confirmación de acceso',
}
const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
)
const AuthPage = lazy(() =>
  import('../features/auth/AuthPage').then((module) => ({
    default: module.AuthPage,
  })),
)

function AuthScreen() {
  return (
    <Suspense fallback={<p role="status">Cargando acceso…</p>}>
      <AuthLayout />
    </Suspense>
  )
}

function RouteEffects() {
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)
  useEffect(() => {
    document.title = `${navigation.find((item) => item.path === pathname)?.label ?? authTitles[pathname] ?? 'Página no encontrada'} · NutriLog`
    if (previousPath.current !== pathname) {
      document.getElementById('main-content')?.focus()
      window.scrollTo(0, 0)
      previousPath.current = pathname
    }
  }, [pathname])
  return null
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RouteEffects />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<GuestOnly />}>
            <Route element={<AuthScreen />}>
              <Route
                path="/login"
                element={<AuthPage key="login" mode="login" />}
              />
              <Route
                path="/register"
                element={<AuthPage key="register" mode="register" />}
              />
            </Route>
          </Route>
          <Route element={<AuthScreen />}>
            <Route
              path="/forgot-password"
              element={<AuthPage key="forgot" mode="forgot-password" />}
            />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
          </Route>
          <Route element={<RequireAuth />}>
            <Route element={<AuthScreen />}>
              <Route
                path="/update-password"
                element={<AuthPage key="update" mode="update-password" />}
              />
            </Route>
            <Route element={<AppLayout />}>
              <Route
                path="/dashboard"
                element={
                  <Suspense fallback={<p role="status">Cargando dashboard…</p>}>
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route path="/calories" element={<CaloriesPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route
            path="*"
            element={
              <main id="main-content" tabIndex={-1} className="not-found">
                <EmptyState
                  icon={Compass}
                  title="Esta página no existe"
                  description="Revisa la dirección o vuelve a tu espacio de NutriLog."
                >
                  <LinkButton to="/dashboard">Volver al dashboard</LinkButton>
                </EmptyState>
              </main>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
