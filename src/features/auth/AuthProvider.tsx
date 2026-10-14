import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { AuthContext } from './AuthContext'
import type { AuthState } from './AuthContext'
import { authErrorMessage } from './errors'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    status: supabase ? 'loading' : 'configuration-pending',
    error: null,
    errorAction: 'session',
    scope: 0,
  })
  const revision = useRef(0)
  const mounted = useRef(false)
  const verifiedIdentity = useRef<string | null>(null)
  const signingOut = useRef(false)

  const clearVisibleUser = useCallback((status: AuthState['status']) => {
    verifiedIdentity.current = null
    setState((previous) => ({
      ...previous,
      session: null,
      status,
      error: null,
      scope: previous.scope + 1,
    }))
  }, [])

  const verifySession = useCallback(
    async (session: Session | null, version: number) => {
      if (!supabase) return
      try {
        if (session) {
          // Se comprueba con Auth antes de montar rutas privadas, incluso al recargar.
          const { data, error } = await supabase.auth.getUser(
            session.access_token,
          )
          if (error) throw error
          if (!data.user || data.user.id !== session.user.id)
            throw new Error('Invalid session identity')
          session = { ...session, user: data.user }
        }
        if (
          !mounted.current ||
          revision.current !== version ||
          signingOut.current
        )
          return
        verifiedIdentity.current = session?.user.id ?? null
        setState((previous) => ({
          ...previous,
          session,
          status: 'ready',
          error: null,
          errorAction: 'session',
        }))
      } catch (error) {
        if (
          !mounted.current ||
          revision.current !== version ||
          signingOut.current
        )
          return
        verifiedIdentity.current = null
        setState((previous) => ({
          ...previous,
          session: null,
          status: 'error',
          error: authErrorMessage(error),
          errorAction: 'session',
          scope: previous.scope + 1,
        }))
      }
    },
    [],
  )

  const refreshSession = useCallback(async () => {
    if (!supabase || signingOut.current) return
    const version = ++revision.current
    clearVisibleUser('loading')
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      await verifySession(data.session, version)
    } catch (error) {
      if (mounted.current && revision.current === version)
        setState((previous) => ({
          ...previous,
          status: 'error',
          error: authErrorMessage(error),
          errorAction: 'session',
        }))
    }
  }, [clearVisibleUser, verifySession])

  useEffect(() => {
    mounted.current = true
    if (!supabase)
      return () => {
        mounted.current = false
      }
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return // getSession + getUser controlan la carga inicial.
      if (event === 'SIGNED_OUT') {
        ++revision.current
        clearVisibleUser(signingOut.current ? 'signing-out' : 'ready')
        return
      }
      if (signingOut.current) return
      if (session && session.user.id === verifiedIdentity.current) {
        setState((previous) => ({ ...previous, session }))
        return
      }
      const version = ++revision.current
      clearVisibleUser('loading')
      // No se esperan llamadas Auth dentro de onAuthStateChange: evita bloquear el SDK.
      const timer = setTimeout(() => {
        timers.delete(timer)
        void verifySession(session, version)
      }, 0)
      timers.add(timer)
    })
    const initialCheck = setTimeout(() => {
      timers.delete(initialCheck)
      void refreshSession()
    }, 0)
    timers.add(initialCheck)
    return () => {
      mounted.current = false
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- Es una generación de solicitudes, no una referencia DOM; se debe invalidar el valor vigente.
      ++revision.current
      subscription.unsubscribe()
      timers.forEach(clearTimeout)
    }
  }, [clearVisibleUser, refreshSession, verifySession])

  const signOut = useCallback(async () => {
    if (!supabase || signingOut.current) return
    signingOut.current = true
    ++revision.current
    clearVisibleUser('signing-out')
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
      if (mounted.current) clearVisibleUser('ready')
    } catch (error) {
      // No se restaura información privada si falló el cierre remoto.
      if (mounted.current)
        setState((previous) => ({
          ...previous,
          session: null,
          status: 'error',
          error: `No se pudo cerrar la sesión. ${authErrorMessage(error)}`,
          errorAction: 'signout',
        }))
    } finally {
      signingOut.current = false
    }
  }, [clearVisibleUser])

  return (
    <AuthContext.Provider value={{ ...state, refreshSession, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
