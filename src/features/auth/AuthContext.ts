import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AuthStatus =
  'loading' | 'ready' | 'error' | 'configuration-pending' | 'signing-out'
export interface AuthState {
  session: Session | null
  status: AuthStatus
  error: string | null
  errorAction: 'session' | 'signout'
  scope: number
}
export interface AuthContextValue extends AuthState {
  refreshSession: () => Promise<void>
  signOut: () => Promise<void>
}
export const AuthContext = createContext<AuthContextValue | null>(null)
