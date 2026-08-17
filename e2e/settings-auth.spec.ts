import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Catalog, settings, stats and auth', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should logout and redirect to login', async ({ page }) => {
    await page.goto('/ajustes')
    await expect(
      page.getByRole('heading', { name: 'Tu negocio' }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Cerrar sesión' }).click()

    await expect(page.getByText('Correo electrónico')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
    await expect(page.getByText('Todo bajo control')).toHaveCount(0)
  })

  test('should update business settings', async ({ page }) => {
    await page.goto('/ajustes')
    await expect(
      page.getByRole('heading', { name: 'Tu negocio' }),
    ).toBeVisible()

    const nameInput = page.getByLabel('Nombre del negocio')
    await expect(nameInput).toHaveValue('Mi Negocio')
    await nameInput.fill('Yapper Test Business')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(page.getByText('Configuración guardada.')).toBeVisible()
    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Tu negocio' }),
    ).toBeVisible()
    await expect(page.getByLabel('Nombre del negocio')).toHaveValue(
      'Yapper Test Business',
    )

    await page.getByLabel('Nombre del negocio').fill('Mi Negocio')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByText('Configuración guardada.')).toBeVisible()
  })

  test('should display public catalog', async ({ page }) => {
    await page.goto('/tienda/mi-negocio')

    await expect(
      page.getByRole('heading', { name: 'Mi Negocio' }),
    ).toBeVisible()
    const products = page.getByRole('region', { name: 'Productos publicados' })
    await expect(products).toBeVisible()
    const product = products.getByRole('article').filter({
      hasText: 'Playera Básica',
    })
    await expect(product).toBeVisible()
    await expect(product).toContainText('Playera cómoda de algodón')
    await expect(
      product.getByRole('link', { name: 'Preguntar por WhatsApp' }),
    ).toHaveAttribute('href', /wa\.me\/525512345678/)
  })

  test('should display stats page', async ({ page }) => {
    await page.goto('/estadisticas')
    await expect(
      page.getByRole('heading', { name: 'Estadísticas' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Resumen de ventas' }),
    ).toBeVisible()
    await expect(page.getByText('Ingresos del periodo')).toBeVisible()
    await expect(page.getByText('Ticket promedio')).toBeVisible()
    await expect(page.getByText('Días con ventas')).toBeVisible()

    const period = page.getByRole('combobox', {
      name: 'Periodo de estadísticas',
    })
    await period.click()
    await page.getByRole('option', { name: 'Últimos 6 meses' }).click()
    await expect(period).toContainText('Últimos 6 meses')
    await expect(
      page.getByRole('heading', { name: 'Resumen de ventas' }),
    ).toBeVisible()
  })
})
