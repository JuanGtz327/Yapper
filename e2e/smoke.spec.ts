import { test, expect } from '@playwright/test'

test.describe('Smoke test', () => {
  test('should load the app and show login page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('Yapper')).toBeVisible()
    await expect(page.getByText('Correo electrónico')).toBeVisible()
    await expect(page.getByText('Contraseña')).toBeVisible()
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
  })

  test('should navigate to dashboard after login', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('tu@correo.com').fill('test@yapper.com')
    await page.getByRole('textbox', { name: /contraseña/i }).fill('Test1234!')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('Todo bajo control')).toBeVisible({
      timeout: 15000,
    })
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('tu@correo.com').fill('wrong@email.com')
    await page.getByRole('textbox', { name: /contraseña/i }).fill('WrongPass!')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Todo bajo control')).toHaveCount(0)
  })
})
