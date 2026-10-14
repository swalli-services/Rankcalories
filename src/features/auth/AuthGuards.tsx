import { Navigate, Outlet } from 'react-router'
import { useAuth } from './useAuth'
import { AuthStatus } from './AuthStatus'

export function RequireAuth() {
  const { status, session, scope } = useAuth()
  if (status !== 'ready') return <AuthStatus />
  if (!session) return <Navigate to="/login" replace />
  // Al salir o cambiar de cuenta se desmonta todo el estado privado y su caché en memoria.
  return <Outlet key={`${session.user.id}:${scope}`} />
}

export function GuestOnly() {
  const { status, session } = useAuth()
  if (status === 'loading' || status === 'signing-out') return <AuthStatus />
  if (status === 'ready' && session) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
