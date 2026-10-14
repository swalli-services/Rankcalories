import assert from 'node:assert/strict'
import test from 'node:test'
import { parseAuthConfig } from '../src/lib/authConfig.ts'
import {
  authErrorMessage,
  callbackParameters,
} from '../src/features/auth/errors.ts'

test('credenciales ausentes, ejemplos y claves secretas mantienen pendiente la configuración', () => {
  assert.equal(parseAuthConfig({}).configured, false)
  for (const key of [
    'sb_secret_no_frontend',
    'service_role',
    'sb_publishable_REEMPLAZAR_CON_TU_CLAVE',
    'eyJhbGciOiJIUzI1NiJ9.secret',
  ]) {
    assert.equal(
      parseAuthConfig({
        VITE_SUPABASE_URL: 'https://project.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: key,
      }).configured,
      false,
    )
  }
  assert.equal(
    parseAuthConfig({
      VITE_SUPABASE_URL: 'https://TU_PROYECTO.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_only_do_not_use',
    }).configured,
    false,
  )
})

test('configuración válida usa solo claves publicables y Google requiere habilitación explícita', () => {
  const config = {
    VITE_SUPABASE_URL: 'https://project.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_only_do_not_use',
  }
  assert.equal(parseAuthConfig(config).configured, true)
  assert.equal(parseAuthConfig(config).googleEnabled, false)
  assert.equal(
    parseAuthConfig({ ...config, VITE_GOOGLE_AUTH_ENABLED: 'true' })
      .googleEnabled,
    true,
  )
  assert.equal(
    parseAuthConfig({
      ...config,
      VITE_SUPABASE_URL: 'http://project.supabase.co',
    }).configured,
    false,
  )
})

test('los callbacks reconocen errores en query y fragmento y no aceptan un destino externo', () => {
  assert.deepEqual(
    callbackParameters('?code=one&flow=recovery&next=https://evil.test', ''),
    { code: 'one', recovery: true, error: null },
  )
  assert.equal(
    callbackParameters('', '#error=access_denied').error,
    'access_denied',
  )
  assert.equal(
    callbackParameters('?error_code=otp_expired', '').error,
    'otp_expired',
  )
})

test('los errores públicos no filtran mensajes internos del backend', () => {
  assert.match(
    authErrorMessage({ code: 'invalid_credentials' }),
    /correo o la contraseña/,
  )
  assert.match(
    authErrorMessage({ code: 'email_not_confirmed' }),
    /Confirma tu correo/,
  )
  assert.match(
    authErrorMessage({ code: 'otp_expired' }, true),
    /enlace.*venció/,
  )
  assert.match(
    authErrorMessage({ name: 'AuthPKCECodeVerifierMissingError' }),
    /mismo navegador/,
  )
  assert.doesNotMatch(
    authErrorMessage({ message: 'backend internal confidential value' }),
    /confidential/,
  )
})
