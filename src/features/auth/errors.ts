export function authErrorMessage(error: unknown, link = false): string {
  const item =
    error && typeof error === 'object'
      ? (error as {
          code?: string
          name?: string
          message?: string
          status?: number
        })
      : {}
  const code = item.code ?? ''
  const messages: Record<string, string> = {
    invalid_credentials: 'El correo o la contraseña no son correctos.',
    email_not_confirmed:
      'Confirma tu correo antes de iniciar sesión. Revisa también la carpeta de spam.',
    user_already_exists:
      'No se pudo crear la cuenta. Si ya te registraste, inicia sesión o recupera tu contraseña.',
    email_exists:
      'No se pudo crear la cuenta. Si ya te registraste, inicia sesión o recupera tu contraseña.',
    weak_password:
      'La contraseña no cumple la política de seguridad del proyecto. Usa una contraseña más segura.',
    same_password: 'Elige una contraseña diferente de la actual.',
    over_email_send_rate_limit:
      'Se enviaron demasiados correos. Espera unos minutos antes de volver a intentarlo.',
    over_request_rate_limit:
      'Hay demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
    provider_disabled:
      'Google todavía no está habilitado en este proyecto. Puedes iniciar sesión con correo.',
    validation_failed: 'Revisa el correo y los campos del formulario.',
    access_denied:
      'El acceso fue cancelado o no se autorizó. Puedes volver a intentarlo.',
  }
  if (messages[code]) return messages[code]
  if (item.message === 'AUTH_CONFIGURATION_PENDING')
    return 'La autenticación está pendiente de configuración.'
  if (
    link ||
    [
      'otp_expired',
      'bad_code_verifier',
      'flow_state_not_found',
      'flow_state_expired',
      'session_not_found',
      'refresh_token_not_found',
      'refresh_token_already_used',
      'bad_jwt',
    ].includes(code) ||
    item.name === 'AuthPKCECodeVerifierMissingError'
  ) {
    return 'El enlace o la sesión venció, ya se utilizó o no corresponde a este navegador. Solicita un enlace nuevo y ábrelo en el mismo navegador donde lo pediste.'
  }
  if (
    item.name === 'AuthRetryableFetchError' ||
    item.name === 'TypeError' ||
    (item.status ?? 0) >= 500
  )
    return 'No pudimos conectar con el servicio de acceso. Revisa tu conexión y vuelve a intentarlo.'
  return 'No se pudo completar la operación. Revisa los datos y vuelve a intentarlo.'
}

export function callbackParameters(search: string, hash: string) {
  const query = new URLSearchParams(search)
  const fragment = new URLSearchParams(hash.replace(/^#/, ''))
  return {
    code: query.get('code'),
    recovery: query.get('flow') === 'recovery',
    error:
      query.get('error_code') ??
      fragment.get('error_code') ??
      query.get('error') ??
      fragment.get('error'),
  }
}
