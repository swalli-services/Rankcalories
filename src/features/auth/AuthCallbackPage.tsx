import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'
import { Message } from '../../components/ui'
import { authErrorMessage, callbackParameters } from './errors'
import { ConfigurationNotice } from './AuthStatus'

export function AuthCallbackPage() {
  const location = useLocation()
  const params = useMemo(
    () => callbackParameters(location.search, location.hash),
    [location.search, location.hash],
  )
  const [failureState, setFailureState] = useState<{
    params: typeof params
    message: string
  } | null>(null)
  const error = failureState?.params === params ? failureState.message : null
  const exchange = useRef<ReturnType<
    NonNullable<typeof supabase>['auth']['exchangeCodeForSession']
  > | null>(null)
  const exchangedCode = useRef<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!supabase) return
    let active = true
    async function complete() {
      try {
        if (params.error) throw { code: params.error }
        if (!params.code) throw new Error('Missing callback code')
        // La ref comparte el mismo intercambio durante los efectos dobles de StrictMode.
        if (exchangedCode.current !== params.code) {
          exchange.current = supabase!.auth.exchangeCodeForSession(params.code)
          exchangedCode.current = params.code
        }
        if (!exchange.current) throw new Error('Missing callback exchange')
        const { data, error: exchangeError } = await exchange.current
        if (exchangeError) throw exchangeError
        if (!data.session) throw new Error('Missing callback session')
        if (!active) return
        navigate(params.recovery ? '/update-password' : '/dashboard', {
          replace: true,
        })
      } catch (failure) {
        if (!active) return
        // El código y los parámetros de error no quedan en la barra de direcciones.
        window.history.replaceState(window.history.state, '', '/auth/callback')
        setFailureState({ params, message: authErrorMessage(failure, true) })
      }
    }
    void complete()
    return () => {
      active = false
    }
  }, [navigate, params])

  return (
    <>
      <h2 className="auth-title">Confirmación de acceso</h2>
      {!supabase ? (
        <ConfigurationNotice />
      ) : error ? (
        <>
          <Message title="No se pudo validar el enlace">{error}</Message>
          <div className="flex flex-wrap gap-4 mt-6">
            <Link to="/forgot-password" className="text-link">
              Solicitar nueva recuperación
            </Link>
            <Link to="/login" className="text-link">
              Volver a iniciar sesión
            </Link>
          </div>
        </>
      ) : (
        <p role="status" className="text-muted">
          Validando tu enlace de acceso…
        </p>
      )}
    </>
  )
}
