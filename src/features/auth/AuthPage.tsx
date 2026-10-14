import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react'
import { Button, Field, Message } from '../../components/ui'
import { authConfig } from '../../lib/supabase'
import {
  continueWithGoogle,
  register,
  requestPasswordReset,
  resendConfirmation,
  signIn,
  updatePassword,
} from './actions'
import { authErrorMessage } from './errors'
import { ConfigurationNotice } from './AuthStatus'
import { useAuth } from './useAuth'

type AuthMode = 'login' | 'register' | 'forgot-password' | 'update-password'
const content: Record<
  AuthMode,
  { title: string; description: string; action: string }
> = {
  login: {
    title: 'Qué bueno verte de nuevo',
    description: 'Tu espacio para una alimentación más consciente.',
    action: 'Iniciar sesión',
  },
  register: {
    title: 'Comienza con NutriLog',
    description: 'Crea tu cuenta y confirma tu correo para comenzar.',
    action: 'Crear cuenta',
  },
  'forgot-password': {
    title: 'Recupera tu acceso',
    description: 'Solicita un enlace para restablecer tu contraseña.',
    action: 'Enviar enlace',
  },
  'update-password': {
    title: 'Una nueva contraseña',
    description: 'Elige una contraseña segura para tu cuenta.',
    action: 'Actualizar contraseña',
  },
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [updated, setUpdated] = useState(false)
  const { error: sessionError } = useAuth()
  const navigate = useNavigate()
  const { title, description, action } = content[mode]
  const hasPassword = mode !== 'forgot-password'
  const newPassword = mode === 'register' || mode === 'update-password'
  const disabled = busy || !authConfig.configured || updated

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return
    const form = event.currentTarget
    const fields = new FormData(form)
    const email = String(fields.get('email') ?? '').trim()
    const password = String(fields.get('password') ?? '')
    const confirmation = String(fields.get('confirmation') ?? '')
    setError('')
    setNotice('')
    if (newPassword && password !== confirmation) {
      setError('Las contraseñas no coinciden. Revisa ambos campos.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        navigate('/dashboard', { replace: true })
      } else if (mode === 'register') {
        const data = await register(email, password)
        if (data.session) navigate('/dashboard', { replace: true })
        else {
          setConfirmationEmail(email)
          setNotice(
            'Revisa tu correo para confirmar el acceso. Si el correo puede registrarse, recibirás un enlace de confirmación. Ábrelo en este mismo navegador; revisa también la carpeta de spam.',
          )
        }
      } else if (mode === 'forgot-password') {
        await requestPasswordReset(email)
        setNotice(
          'Si existe una cuenta asociada a ese correo, recibirás un enlace para cambiar tu contraseña. Ábrelo en este mismo navegador y revisa también la carpeta de spam.',
        )
      } else {
        await updatePassword(password)
        setUpdated(true)
        setNotice(
          'Tu contraseña se actualizó correctamente. Ya puedes volver a tu espacio.',
        )
      }
    } catch (failure) {
      setError(authErrorMessage(failure))
      if (
        typeof failure === 'object' &&
        failure &&
        'code' in failure &&
        failure.code === 'email_not_confirmed'
      )
        setConfirmationEmail(email)
    } finally {
      for (const name of ['password', 'confirmation']) {
        const field = form.elements.namedItem(name)
        if (field instanceof HTMLInputElement) field.value = ''
      }
      setBusy(false)
    }
  }

  async function googleLogin() {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await continueWithGoogle()
    } catch (failure) {
      setError(authErrorMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setBusy(true)
    setError('')
    try {
      await resendConfirmation(confirmationEmail)
      setNotice(
        'Si hay una confirmación pendiente, recibirás un nuevo correo. Ábrelo en este navegador.',
      )
    } catch (failure) {
      setError(authErrorMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <span className="icon-tile mb-6">
        <LockKeyhole size={23} aria-hidden="true" />
      </span>
      <h2 className="auth-title">{title}</h2>
      <p className="mb-8 text-muted">{description}</p>
      {!authConfig.configured && <ConfigurationNotice />}
      {sessionError && (
        <Message title="Revisa tu sesión">{sessionError}</Message>
      )}
      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <Message
          title={
            mode === 'update-password'
              ? 'Contraseña actualizada'
              : 'Revisa tu correo'
          }
        >
          {notice}
        </Message>
      )}
      <form className="auth-form" onSubmit={handleSubmit} aria-busy={busy}>
        {mode !== 'update-password' && (
          <Field
            label="Correo electrónico"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nombre@ejemplo.com"
            required
            disabled={disabled}
          />
        )}
        {hasPassword && (
          <Field
            label={
              mode === 'update-password' ? 'Nueva contraseña' : 'Contraseña'
            }
            name="password"
            type="password"
            autoComplete={newPassword ? 'new-password' : 'current-password'}
            required
            minLength={newPassword ? 8 : 1}
            disabled={disabled}
            hint={
              newPassword
                ? 'Al menos 8 caracteres. El servicio puede exigir una contraseña más segura.'
                : undefined
            }
          />
        )}
        {newPassword && (
          <Field
            label="Confirmar contraseña"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={disabled}
          />
        )}
        {mode === 'login' && (
          <Link className="text-link self-end" to="/forgot-password">
            ¿Olvidaste tu contraseña?
          </Link>
        )}
        <Button type="submit" disabled={disabled}>
          {busy ? 'Procesando…' : action}
          <ArrowRight size={17} aria-hidden="true" />
        </Button>
      </form>
      {(mode === 'login' || mode === 'register') && (
        <div className="google-login">
          <span className="auth-divider">o</span>
          <Button
            variant="secondary"
            onClick={() => void googleLogin()}
            disabled={busy || !authConfig.googleEnabled}
          >
            <span className="google-symbol" aria-hidden="true">
              G
            </span>
            Continuar con Google
          </Button>
          {!authConfig.googleEnabled && (
            <p className="field-hint">
              El acceso con Google está pendiente de configuración.
            </p>
          )}
        </div>
      )}
      {confirmationEmail && (
        <div className="mt-5">
          <Button
            variant="secondary"
            onClick={() => void resend()}
            disabled={busy || !authConfig.configured}
          >
            Reenviar confirmación
          </Button>
        </div>
      )}
      {updated && (
        <Link to="/dashboard" className="button button-primary">
          Volver al dashboard
        </Link>
      )}
      <p className="auth-links">
        {mode === 'login' ? (
          <>
            ¿Primera vez aquí? <Link to="/register">Crear una cuenta</Link>
          </>
        ) : mode === 'register' ? (
          <>
            ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
          </>
        ) : (
          <Link to="/login">
            <ArrowLeft size={15} aria-hidden="true" />
            Volver a iniciar sesión
          </Link>
        )}
      </p>
    </>
  )
}
