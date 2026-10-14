import { authCallbackUrl, requireSupabase } from '../../lib/supabase'

export async function signIn(email: string, password: string) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function register(email: string, password: string) {
  const { data, error } = await requireSupabase().auth.signUp({
    email,
    password,
    options: { emailRedirectTo: authCallbackUrl() },
  })
  if (error) throw error
  return data
}

export async function requestPasswordReset(email: string) {
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: authCallbackUrl(true),
  })
  if (error) throw error
}

export async function updatePassword(password: string) {
  const { error } = await requireSupabase().auth.updateUser({ password })
  if (error) throw error
}

export async function resendConfirmation(email: string) {
  const { error } = await requireSupabase().auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: authCallbackUrl() },
  })
  if (error) throw error
}

export async function continueWithGoogle() {
  const { error } = await requireSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: authCallbackUrl(), scopes: 'openid email profile' },
  })
  if (error) throw error
}
