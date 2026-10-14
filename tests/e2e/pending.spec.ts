import { expect, test } from '@playwright/test'

test('sin credenciales no se monta contenido privado ni se simula un acceso', async ({
  page,
}) => {
  await page.goto('/dashboard')
  await expect(
    page.getByText('Configuración pendiente', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Tu objetivo, día a día' }),
  ).toHaveCount(0)
  await page.getByRole('link', { name: 'Ir a iniciar sesión' }).click()
  await expect(
    page.getByRole('button', { name: 'Iniciar sesión', exact: true }),
  ).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Continuar con Google' }),
  ).toBeDisabled()
  await page.goto('/register')
  await expect(page.getByLabel('Confirmar contraseña')).toBeDisabled()
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  }
})
