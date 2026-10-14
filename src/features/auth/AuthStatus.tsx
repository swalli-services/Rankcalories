import { Button, LinkButton, Message } from '../../components/ui'
import { useAuth } from './useAuth'

export function ConfigurationNotice() {
  return (
    <Message title="Configuración pendiente">
      Falta configurar la URL de Supabase y su clave publicable. Completa
      VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env.local y reinicia
      la aplicación. Consulta docs/auth-setup.md. No se puede iniciar sesión
      todavía.
    </Message>
  )
}

export function AuthStatus() {
  const { status, error, errorAction, refreshSession, signOut } = useAuth()
  return (
    <main id="main-content" tabIndex={-1} className="auth-status-page">
      <div>
        {status === 'configuration-pending' ? (
          <>
            <ConfigurationNotice />
            <div className="mt-6">
              <LinkButton to="/login" variant="secondary">
                Ir a iniciar sesión
              </LinkButton>
            </div>
          </>
        ) : status === 'error' ? (
          <>
            <Message title="No pudimos completar el acceso">{error}</Message>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button
                onClick={() =>
                  void (errorAction === 'signout'
                    ? signOut()
                    : refreshSession())
                }
              >
                {errorAction === 'signout'
                  ? 'Reintentar cerrar sesión'
                  : 'Volver a comprobar sesión'}
              </Button>
              {errorAction !== 'signout' && (
                <LinkButton to="/login" variant="secondary">
                  Ir a iniciar sesión
                </LinkButton>
              )}
            </div>
          </>
        ) : (
          <p role="status">
            {status === 'signing-out'
              ? 'Cerrando sesión…'
              : 'Comprobando tu sesión…'}
          </p>
        )}
      </div>
    </main>
  )
}
