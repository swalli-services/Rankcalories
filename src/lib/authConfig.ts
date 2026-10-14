export function parseAuthConfig(env: Record<string, unknown>) {
  const url = String(env.VITE_SUPABASE_URL ?? '').trim()
  const key = String(env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim()
  let validUrl = false
  try {
    const parsed = new URL(url)
    validUrl =
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash &&
      parsed.pathname === '/' &&
      (parsed.protocol === 'https:' ||
        (parsed.protocol === 'http:' &&
          ['localhost', '127.0.0.1'].includes(parsed.hostname))) &&
      !/REEMPLAZAR|TU_PROYECTO|example/i.test(url)
  } catch {
    /* La interfaz muestra un estado pendiente sin crear un cliente inválido. */
  }
  const configured =
    validUrl &&
    key.startsWith('sb_publishable_') &&
    key.length > 20 &&
    !/REEMPLAZAR|TU_CLAVE/i.test(key)
  return {
    url,
    key,
    configured,
    googleEnabled: configured && env.VITE_GOOGLE_AUTH_ENABLED === 'true',
  }
}
