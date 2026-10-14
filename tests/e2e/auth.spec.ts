import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// Solo el servidor aislado de pruebas usa este dominio reservado y estas respuestas.
// No se incluyen fixtures de autenticación en el código de la aplicación.
const password = 'test-password-only-123!'
const userA = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'ana@example.test',
  email_confirmed_at: '2026-10-01T12:00:00Z',
  created_at: '2026-10-01T12:00:00Z',
  app_metadata: { provider: 'email' },
  user_metadata: {},
}
const userB = {
  ...userA,
  id: '22222222-2222-4222-8222-222222222222',
  email: 'bea@example.test',
}

function session(user = userA) {
  const exp = Math.floor(Date.now() / 1000) + 3600
  const token = [
    Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),
    Buffer.from(
      JSON.stringify({ sub: user.id, exp, role: 'authenticated' }),
    ).toString('base64url'),
    'test-signature',
  ].join('.')
  return {
    access_token: token,
    refresh_token: `test-refresh-${user.id}`,
    expires_in: 3600,
    expires_at: exp,
    token_type: 'bearer',
    user,
  }
}

async function mockAuth(
  page: Page,
  options: {
    userDelay?: number
    logoutFails?: boolean
    userFails?: boolean
  } = {},
) {
  const calls: {
    path: string
    method: string
    body: Record<string, unknown>
    url: URL
  }[] = []
  let account = userA
  await page.route('https://auth.nutrilog.test/auth/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/auth/v1', '')
    const body = request.postDataJSON() ?? {}
    calls.push({ path, method: request.method(), body, url })
    if (path === '/authorize') {
      const redirect = new URL(url.searchParams.get('redirect_to')!)
      redirect.searchParams.set('code', 'google-test-code')
      await route.fulfill({
        status: 302,
        headers: { location: redirect.toString() },
      })
    } else if (path === '/token') {
      if (body.auth_code === 'expired-code')
        return route.fulfill({
          status: 400,
          json: { error_code: 'flow_state_expired', msg: 'expired test code' },
        })
      if (body.password === 'wrong-password')
        return route.fulfill({
          status: 400,
          json: {
            error_code: 'invalid_credentials',
            msg: 'Invalid login credentials',
          },
        })
      if (body.email === 'pending@example.test')
        return route.fulfill({
          status: 400,
          json: {
            error_code: 'email_not_confirmed',
            msg: 'Email not confirmed',
          },
        })
      account = body.email === userB.email ? userB : userA
      await route.fulfill({ json: session(account) })
    } else if (path === '/user') {
      const authorization = request.headers().authorization ?? ''
      const tokenPart = authorization.replace('Bearer ', '').split('.')[1]
      const tokenUserId = tokenPart
        ? JSON.parse(Buffer.from(tokenPart, 'base64url').toString()).sub
        : null
      const requestedAccount = tokenUserId === userB.id ? userB : userA
      if (options.userDelay && request.method() === 'GET')
        await new Promise((resolve) => setTimeout(resolve, options.userDelay))
      if (options.userFails && request.method() === 'GET')
        return route.fulfill({
          status: 400,
          json: { error_code: 'bad_jwt', msg: 'Rejected session' },
        })
      await route.fulfill({ json: requestedAccount })
    } else if (path === '/signup') {
      await route.fulfill({
        json: { ...userA, email: body.email, email_confirmed_at: null },
      })
    } else if (path === '/logout') {
      await route.fulfill(
        options.logoutFails
          ? {
              status: 400,
              json: {
                error_code: 'unexpected_failure',
                msg: 'Test logout failure',
              },
            }
          : { status: 204 },
      )
    } else if (path === '/recover' || path === '/resend') {
      await route.fulfill({ json: {} })
    } else {
      throw new Error(`Unmocked Auth endpoint: ${path}`)
    }
  })
  return calls
}

async function login(page: Page, email = userA.email) {
  await page.goto('/login')
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Tu objetivo, día a día' }),
  ).toBeVisible()
}

test('una ruta privada sin sesión lleva al login sin montar el dashboard', async ({
  page,
}) => {
  await mockAuth(page)
  await page.addInitScript(() => {
    ;(window as unknown as { privateMounted: boolean }).privateMounted = false
    new MutationObserver(() => {
      if (document.querySelector('.demo-dashboard'))
        (window as unknown as { privateMounted: boolean }).privateMounted = true
    }).observe(document, { subtree: true, childList: true })
  })
  for (const path of [
    '/dashboard',
    '/calories',
    '/statistics',
    '/settings',
    '/update-password',
  ]) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login$/)
    expect(
      await page.evaluate(
        () => (window as unknown as { privateMounted: boolean }).privateMounted,
      ),
    ).toBe(false)
  }
})

test('login y recarga esperan la verificación; la sesión persiste y login redirige al dashboard', async ({
  page,
}) => {
  const calls = await mockAuth(page, { userDelay: 800 })
  await login(page)
  expect(
    calls.some(
      (call) =>
        call.path === '/token' &&
        call.url.searchParams.get('grant_type') === 'password',
    ),
  ).toBe(true)
  await page.reload()
  await expect(page.getByText('Comprobando tu sesión…')).toBeVisible()
  await expect(page.locator('.demo-dashboard')).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: 'Tu objetivo, día a día' }),
  ).toBeVisible()
  await page.goto('/login')
  await expect(page).toHaveURL(/\/dashboard$/)
  expect(
    await page.evaluate(
      (value) =>
        Object.values(localStorage).some((item) =>
          String(item).includes(value),
        ),
      password,
    ),
  ).toBe(false)
})

test('registro valida confirmación y solicita confirmación real; se puede reenviar', async ({
  page,
}) => {
  const calls = await mockAuth(page)
  await page.goto('/register')
  await page.getByLabel('Correo electrónico').fill('nuevo@example.test')
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByLabel('Confirmar contraseña').fill('another-password')
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('no coinciden')
  expect(calls.filter((call) => call.path === '/signup')).toHaveLength(0)
  await page.getByLabel('Confirmar contraseña').fill(password)
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
  await expect(
    page.getByText('Revisa tu correo', { exact: true }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/register$/)
  expect(calls.filter((call) => call.path === '/signup')).toHaveLength(1)
  expect(
    calls.find((call) => call.path === '/signup')!.body.code_challenge,
  ).toBeTruthy()
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('')
  await page.getByRole('button', { name: 'Reenviar confirmación' }).click()
  await expect
    .poll(() => calls.filter((call) => call.path === '/resend').length)
    .toBe(1)
  await page.goto('/auth/callback?code=signup-code')
  await expect(page).toHaveURL(/\/dashboard$/)
  expect(
    calls.filter(
      (call) => call.path === '/token' && call.body.auth_code === 'signup-code',
    ),
  ).toHaveLength(1)
})

test('credenciales incorrectas y correo sin confirmar tienen errores comprensibles', async ({
  page,
}) => {
  await mockAuth(page)
  await page.goto('/login')
  await page.getByLabel('Correo electrónico').fill(userA.email)
  await page.getByLabel('Contraseña', { exact: true }).fill('wrong-password')
  await page
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click()
  await expect(page.getByRole('alert')).toContainText('correo o la contraseña')
  await page.getByLabel('Correo electrónico').fill('pending@example.test')
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click()
  await expect(page.getByRole('alert')).toContainText('Confirma tu correo')
  await expect(
    page.getByRole('button', { name: 'Reenviar confirmación' }),
  ).toBeVisible()
})

test('recuperación PKCE y actualización de contraseña; callback se intercambia una sola vez', async ({
  page,
}) => {
  const calls = await mockAuth(page)
  await page.goto('/forgot-password')
  await page.getByLabel('Correo electrónico').fill(userA.email)
  await page.getByRole('button', { name: 'Enviar enlace' }).click()
  await expect(
    page.getByText('Revisa tu correo', { exact: true }),
  ).toBeVisible()
  const recovery = calls.find((call) => call.path === '/recover')!
  const redirect = new URL(recovery.url.searchParams.get('redirect_to')!)
  expect(redirect.origin).toBe('http://127.0.0.1:5176')
  expect(redirect.searchParams.get('flow')).toBe('recovery')
  redirect.searchParams.set('code', 'recovery-test-code')
  await page.goto(redirect.toString())
  await expect(page).toHaveURL(/\/update-password$/)
  await page.getByLabel('Nueva contraseña').fill('new-password-for-test!')
  await page.getByLabel('Confirmar contraseña').fill('new-password-for-test!')
  await page
    .getByRole('button', { name: 'Actualizar contraseña', exact: true })
    .click()
  await expect(
    page.getByText('Contraseña actualizada', { exact: true }),
  ).toBeVisible()
  expect(
    calls.filter(
      (call) =>
        call.path === '/token' && call.body.auth_code === 'recovery-test-code',
    ),
  ).toHaveLength(1)
  expect(
    calls.filter((call) => call.path === '/user' && call.method === 'PUT'),
  ).toHaveLength(1)
  expect(
    await page.evaluate(() =>
      JSON.stringify(localStorage).includes('new-password-for-test!'),
    ),
  ).toBe(false)
})

test('enlaces vencidos, ausentes y OAuth cancelado no producen accesos exitosos', async ({
  page,
}) => {
  const calls = await mockAuth(page)
  await page.goto('/forgot-password')
  await page.getByLabel('Correo electrónico').fill(userA.email)
  await page.getByRole('button', { name: 'Enviar enlace' }).click()
  await expect(
    page.getByText('Revisa tu correo', { exact: true }),
  ).toBeVisible()
  await page.goto('/auth/callback?code=expired-code&flow=recovery')
  await expect(
    page.getByText('No se pudo validar el enlace', { exact: true }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/auth\/callback$/)
  await expect(page.locator('.demo-dashboard')).toHaveCount(0)
  expect(calls.some((call) => call.body.auth_code === 'expired-code')).toBe(
    true,
  )
  await page.goto('/auth/callback')
  await expect(
    page.getByText('No se pudo validar el enlace', { exact: true }),
  ).toBeVisible()
  await page.goto(
    '/auth/callback#error=access_denied&error_description=DoNotExposeInternalMessage',
  )
  await expect(page.getByText(/El acceso fue cancelado/)).toBeVisible()
  await expect(page).toHaveURL(/\/auth\/callback$/)
  await expect(page.getByText('DoNotExposeInternalMessage')).toHaveCount(0)
})

test('Google usa PKCE y exclusivamente scopes de identidad', async ({
  page,
}) => {
  const calls = await mockAuth(page)
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar con Google' }).click()
  await expect(
    page.getByRole('heading', { name: 'Tu objetivo, día a día' }),
  ).toBeVisible()
  const oauth = calls.find((call) => call.path === '/authorize')!.url
  expect(oauth.searchParams.get('provider')).toBe('google')
  expect(oauth.searchParams.get('scopes')).toBe('openid email profile')
  expect(oauth.searchParams.get('code_challenge')).toBeTruthy()
  expect(oauth.searchParams.get('access_type')).toBeNull()
  expect(new URL(oauth.searchParams.get('redirect_to')!).pathname).toBe(
    '/auth/callback',
  )
  expect(
    calls.filter(
      (call) =>
        call.path === '/token' && call.body.auth_code === 'google-test-code',
    ),
  ).toHaveLength(1)
})

test('cerrar sesión elimina datos visibles y el estado de la cuenta anterior', async ({
  page,
}) => {
  const calls = await mockAuth(page)
  await login(page)
  await page.locator('button[data-date="2026-10-07"]').click()
  await page.getByRole('button', { name: 'Usar ejemplo' }).click()
  await expect(page.locator('.account-email')).toHaveText(userA.email)
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.locator('.demo-dashboard')).toHaveCount(0)
  await expect(page.getByText(userA.email, { exact: true })).toHaveCount(0)
  expect(
    calls.some(
      (call) =>
        call.path === '/logout' &&
        call.url.searchParams.get('scope') === 'local',
    ),
  ).toBe(true)
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).some((key) => key.endsWith('-auth-token')),
    ),
  ).toBe(false)
  await login(page, userB.email)
  await expect(page.locator('.account-email')).toHaveText(userB.email)
  await expect(page.locator('button[data-date="2026-10-08"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(
    page.getByLabel('Describe tu comida y sus cantidades'),
  ).toHaveValue('')
  await expect(page.getByText(userA.email, { exact: true })).toHaveCount(0)
})

test('un fallo de cierre de sesión no deja información privada visible ni simula éxito', async ({
  page,
}) => {
  await mockAuth(page, { logoutFails: true })
  await login(page)
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Reintentar cerrar sesión' }),
  ).toBeVisible()
  await expect(page.getByText(/No se pudo cerrar la sesión/)).toBeVisible()
  await expect(page.locator('.demo-dashboard')).toHaveCount(0)
  await expect(page.getByText(userA.email, { exact: true })).toHaveCount(0)
})

test('un cambio de identidad descarta el árbol anterior antes de validar la cuenta nueva', async ({
  page,
}) => {
  await mockAuth(page, { userDelay: 500 })
  await login(page)
  await page.locator('button[data-date="2026-10-07"]').click()
  await page.getByRole('button', { name: 'Usar ejemplo' }).click()
  await page.evaluate(
    async ({ email, secret }) => {
      const { supabase } = await import('/src/lib/supabase.ts')
      await supabase.auth.signInWithPassword({ email, password: secret })
    },
    { email: userB.email, secret: password },
  )
  await expect(page.getByText('Comprobando tu sesión…')).toBeVisible()
  await expect(page.locator('.demo-dashboard')).toHaveCount(0)
  await expect(page.getByText(userA.email, { exact: true })).toHaveCount(0)
  await expect(page.locator('.account-email')).toHaveText(userB.email)
  await expect(page.locator('button[data-date="2026-10-08"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(
    page.getByLabel('Describe tu comida y sus cantidades'),
  ).toHaveValue('')
})

test('cerrar sesión en una pestaña oculta la cuenta en las demás', async ({
  page,
  context,
}) => {
  await mockAuth(page)
  await login(page)
  const other = await context.newPage()
  await mockAuth(other)
  await other.goto('/dashboard')
  await expect(other.locator('.account-email')).toHaveText(userA.email)
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(other).toHaveURL(/\/login$/)
  await expect(other.locator('.demo-dashboard')).toHaveCount(0)
  await expect(other.getByText(userA.email, { exact: true })).toHaveCount(0)
})

test('una sesión rechazada por Auth no permite montar contenido privado', async ({
  page,
}) => {
  await mockAuth(page, { userFails: true })
  await page.goto('/login')
  await page.getByLabel('Correo electrónico').fill(userA.email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click()
  await expect(
    page.getByText('No pudimos completar el acceso', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText(/enlace o la sesión venció/)).toBeVisible()
  await expect(page.locator('.demo-dashboard')).toHaveCount(0)
  await expect(page.getByText(userA.email, { exact: true })).toHaveCount(0)
})
