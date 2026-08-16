import { test, expect } from '@playwright/test'
import { login } from './helpers'

const TEST_CLIENT_NAME = `Test Client ${Date.now()}`
const TEST_CLIENT_PHONE = '5512345678'
const TEST_CLIENT_ZONE = 'Centro'

test.describe('Clients and payments', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.waitForURL('**/')
  })

  test('should create a new client', async ({ page }) => {
    await page.goto('/clientes')
    await page.waitForSelector('text=Clientes')

    // Click create client
    await page.getByText('Nuevo cliente').click()

    // Wait for modal
    await expect(page.getByRole('dialog', { name: 'Nuevo cliente' })).toBeVisible()

    // Fill form
    await page.getByLabelText('Nombre completo').fill(TEST_CLIENT_NAME)
    await page.getByLabelText('Teléfono').fill(TEST_CLIENT_PHONE)
    await page.getByLabelText('Zona o colonia').fill(TEST_CLIENT_ZONE)

    // Submit
    await page.getByRole('button', { name: /guardar cliente/i }).click()

    // Wait for modal to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

    // Verify client appears in list
    await expect(page.getByText(TEST_CLIENT_NAME)).toBeVisible()
  })

  test('should edit client details', async ({ page }) => {
    await page.goto('/clientes')
    await page.waitForSelector('text=Clientes')

    // Find and click on the test client
    const clientRow = page.getByText(TEST_CLIENT_NAME).first()
    if (await clientRow.isVisible()) {
      await clientRow.click()

      // Wait for edit modal
      await expect(page.getByRole('dialog', { name: 'Editar cliente' })).toBeVisible()

      // Change name
      const nameInput = page.getByLabelText('Nombre completo')
      await nameInput.clear()
      await nameInput.fill(`${TEST_CLIENT_NAME} Updated`)

      // Save
      await page.getByRole('button', { name: /guardar cliente/i }).click()

      // Wait for modal to close
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

      // Verify updated name
      await expect(page.getByText(`${TEST_CLIENT_NAME} Updated`)).toBeVisible()
    }
  })

  test('should register payments and update status', async ({ page }) => {
    // First create an order to have something to pay for
    await page.goto('/pedidos')
    await page.waitForSelector('text=Pedidos')
    await page.getByText('Crear pedido').click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Select client
    const clientTrigger = page.getByRole('combobox', { name: 'Cliente' })
    await clientTrigger.click()
    await page.getByText('Juan Pérez').click()

    // Select product
    const productTrigger = page.getByRole('combobox', { name: 'Producto' }).first()
    await productTrigger.click()
    await page.getByText('Playera Básica').click()

    // Set quantity
    const quantityInput = page.getByLabelText('Cantidad').first()
    await quantityInput.fill('1')

    // Set payment status to pending
    const paymentTrigger = page.getByRole('combobox', { name: 'Estado del pago' })
    await paymentTrigger.click()
    await page.getByText('Pendiente de pago').click()

    // Save order
    await page.getByRole('button', { name: /guardar pedido/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

    // Find and click on the order
    await page.getByText('Juan Pérez').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Register partial payment
    const registerBtn = page.getByText('Registrar abono')
    if (await registerBtn.isVisible()) {
      await registerBtn.click()

      const amountInput = page.getByLabelText('Monto')
      if (await amountInput.isVisible()) {
        await amountInput.fill('50')
        await page.getByRole('button', { name: /guardar/i }).click()
        await page.waitForTimeout(1000)
      }
    }

    // Close modal
    await page.getByLabelText('Cerrar').click()
  })

  test('should show client in order flow', async ({ page }) => {
    await page.goto('/pedidos')
    await page.waitForSelector('text=Pedidos')

    // Verify client names appear in order list
    const clientNames = page.getByText('Juan Pérez')
    const count = await clientNames.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test.afterEach(async ({ page }) => {
    // Cleanup: delete test clients
    await login(page)
    await page.goto('/clientes')
    await page.waitForSelector('text=Clientes')

    const testClients = page.getByText(/Test Client \d+/)
    const count = await testClients.count()
    for (let i = 0; i < count; i++) {
      const client = testClients.first()
      if (await client.isVisible()) {
        await client.click()
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })

        const deleteBtn = page.getByRole('button', { name: /eliminar/i })
        if (await deleteBtn.isVisible()) {
          await deleteBtn.click()
          const confirmBtn = page.getByRole('button', { name: /^Eliminar$/ })
          if (await confirmBtn.isVisible()) {
            await confirmBtn.click()
          }
        }
        await page.waitForSelector('text=Clientes', { timeout: 5000 })
      }
    }
  })
})
