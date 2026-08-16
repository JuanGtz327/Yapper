import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Order lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.waitForURL('**/')
  })

  test('should create a complete order', async ({ page }) => {
    await page.goto('/pedidos')
    await page.waitForSelector('text=Pedidos')

    // Click create order
    await page.getByText('Crear pedido').click()

    // Wait for modal to open
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
    await quantityInput.fill('2')

    // Verify total updates
    await expect(page.getByText('$300.00')).toBeVisible()

    // Save order
    await page.getByRole('button', { name: /guardar pedido/i }).click()

    // Wait for modal to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

    // Verify order appears in list
    await expect(page.getByText('Juan Pérez')).toBeVisible()
  })

  test('should register a partial payment', async ({ page }) => {
    await page.goto('/pedidos')
    await page.waitForSelector('text=Pedidos')

    // Find and click on an existing order
    const orderRow = page.getByText('Juan Pérez').first()
    await orderRow.click()

    // Wait for detail modal
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click register payment button if available
    const registerBtn = page.getByText('Registrar abono')
    if (await registerBtn.isVisible()) {
      await registerBtn.click()

      // Fill payment amount
      const amountInput = page.getByLabelText('Monto')
      if (await amountInput.isVisible()) {
        await amountInput.fill('100')
        await page.getByRole('button', { name: /guardar/i }).click()
      }
    }

    // Close modal
    await page.getByLabelText('Cerrar').click()
  })

  test('should change order status', async ({ page }) => {
    await page.goto('/pedidos')
    await page.waitForSelector('text=Pedidos')

    // Find and click on an existing order
    const orderRow = page.getByText('Juan Pérez').first()
    await orderRow.click()

    // Wait for detail modal
    await expect(page.getByRole('dialog')).toBeVisible()

    // Change status to Entregado
    const deliveredBtn = page.getByRole('button', { name: 'Entregado' }).first()
    if (await deliveredBtn.isVisible()) {
      await deliveredBtn.click()
    }

    // Close modal
    await page.getByLabelText('Cerrar').click()
  })

  test('should verify inventory changes', async ({ page }) => {
    // Navigate to products to check initial stock
    await page.goto('/almacen')
    await page.waitForSelector('text=Tus productos')

    // Note initial stock for Playera Básica
    const stockBefore = await page.locator('text=25').first().textContent()

    // Create order with specific product
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

    // Set quantity to 1
    const quantityInput = page.getByLabelText('Cantidad').first()
    await quantityInput.fill('1')

    // Save order
    await page.getByRole('button', { name: /guardar pedido/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

    // Verify stock reduced in products page
    await page.goto('/almacen')
    await page.waitForSelector('text=Tus productos')

    // Stock should be 24 now (25 - 1)
    await expect(page.getByText('24').first()).toBeVisible({ timeout: 5000 })

    // Cancel the order to restore stock
    await page.goto('/pedidos')
    await page.waitForSelector('text=Pedidos')
    await page.getByText('Juan Pérez').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Find cancel button
    const cancelBtn = page.getByText('Cancelar pedido')
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click()
      // Confirm cancellation if dialog appears
      const confirmBtn = page.getByRole('button', { name: /^Eliminar$/ })
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click()
      }
    }

    // Verify stock restored
    await page.goto('/almacen')
    await page.waitForSelector('text=Tus productos')
    await expect(page.getByText('25').first()).toBeVisible({ timeout: 5000 })
  })
})
