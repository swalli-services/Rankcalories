import { createClient } from '@supabase/supabase-js'
import { parseAuthConfig } from './authConfig'

export const authConfig = parseAuthConfig(import.meta.env)
export const supabase = authConfig.configured
  ? createClient(authConfig.url, authConfig.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce',
        // La ruta callback realiza el intercambio una sola vez y muestra sus errores.
        detectSessionInUrl: false,
      },
    })
  : null

export function requireSupabase() {
  if (!supabase) throw new Error('AUTH_CONFIGURATION_PENDING')
  return supabase
}

export function authCallbackUrl(recovery = false) {
  const url = new URL('/auth/callback', window.location.origin)
  if (recovery) url.searchParams.set('flow', 'recovery')
  return url.toString()
}
