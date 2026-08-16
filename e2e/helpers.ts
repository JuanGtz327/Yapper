import type { Page } from '@playwright/test'

export async function login(
  page: Page,
  email: string = 'test@yapper.com',
  password: string = 'Test1234!',
) {
  await page.goto('/')
  await page.getByPlaceholder('tu@correo.com').fill(email)
  await page.getByPlaceholder('tu@correo.com').press('Tab')
  await page.getByRole('textbox', { name: /contraseña/i }).fill(password)
  await page.getByRole('button', { name: /entrar/i }).click()
  await page.waitForSelector('text=Todo bajo control', { timeout: 15000 })
}

export async function waitForDashboard(page: Page) {
  await page.waitForSelector('text=Todo bajo control', { timeout: 10000 })
}
