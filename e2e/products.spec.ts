import { test, expect } from '@playwright/test'
import { login } from './helpers'

const TEST_PRODUCT_NAME = `Test Product ${Date.now()}`
const TEST_VARIANT_SKU = `TEST-SKU-${Date.now()}`

test.describe('Inventory and product lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.waitForURL('**/')
  })

  test('should create a product with variant', async ({ page }) => {
    await page.goto('/almacen')
    await page.waitForSelector('text=Tus productos')

    // Click create product
    await page.getByText('Añadir producto').click()

    // Wait for form to load
    await expect(page.getByText('Nuevo producto')).toBeVisible()

    // Fill product name
    await page.getByLabelText('Nombre del producto').fill(TEST_PRODUCT_NAME)

    // Add a variant
    await page.getByRole('button', { name: 'Añadir variante' }).click()
    await expect(page.getByRole('dialog', { name: 'Añadir variante' })).toBeVisible()

    // Fill variant details
    await page.getByLabelText('SKU').fill(TEST_VARIANT_SKU)
    await page.getByLabelText('Precio de venta').fill('150')
    await page.getByLabelText('Existencias').fill('25')

    // Submit variant
    await page.getByRole('button', { name: /añadir variante/i }).last().click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    // Submit product
    await page.getByRole('button', { name: /crear producto/i }).click()

    // Wait for redirect back to products list
    await page.waitForSelector('text=Tus productos', { timeout: 10000 })

    // Verify product appears in list
    await expect(page.getByText(TEST_PRODUCT_NAME)).toBeVisible()
  })

  test('should edit product details', async ({ page }) => {
    await page.goto('/almacen')
    await page.waitForSelector('text=Tus productos')

    // Find and click on the test product
    const productRow = page.getByText(TEST_PRODUCT_NAME).first()
    if (await productRow.isVisible()) {
      await productRow.click()

      // Wait for edit form
      await expect(page.getByText('Editar producto')).toBeVisible()

      // Change the name
      const nameInput = page.getByLabelText('Nombre del producto')
      await nameInput.clear()
      await nameInput.fill(`${TEST_PRODUCT_NAME} Updated`)

      // Save changes
      await page.getByRole('button', { name: /guardar cambios/i }).click()

      // Wait for redirect
      await page.waitForSelector('text=Tus productos', { timeout: 10000 })

      // Verify updated name appears
      await expect(page.getByText(`${TEST_PRODUCT_NAME} Updated`)).toBeVisible()
    }
  })

  test('should manage variants', async ({ page }) => {
    await page.goto('/almacen')
    await page.waitForSelector('text=Tus productos')

    // Find and click on the test product
    const productRow = page.getByText(TEST_PRODUCT_NAME).first()
    if (await productRow.isVisible()) {
      await productRow.click()

      // Wait for edit form
      await expect(page.getByText('Editar producto')).toBeVisible()

      // Add a new variant
      await page.getByRole('button', { name: 'Añadir variante' }).click()
      await expect(page.getByRole('dialog', { name: 'Añadir variante' })).toBeVisible()

      const newSku = `TEST-NEW-${Date.now()}`
      await page.getByLabelText('SKU').fill(newSku)
      await page.getByLabelText('Precio de venta').fill('200')
      await page.getByLabelText('Existencias').fill('10')

      await page.getByRole('button', { name: /añadir variante/i }).last().click()
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

      // Verify new variant appears
      await expect(page.getByText(newSku)).toBeVisible()

      // Save product
      await page.getByRole('button', { name: /guardar cambios/i }).click()
      await page.waitForSelector('text=Tus productos', { timeout: 10000 })
    }
  })

  test('should persist product data', async ({ page }) => {
    await page.goto('/almacen')
    await page.waitForSelector('text=Tus productos')

    // Verify product still exists after page reload
    await expect(page.getByText(`${TEST_PRODUCT_NAME} Updated`).first()).toBeVisible()

    // Reload and verify again
    await page.reload()
    await page.waitForSelector('text=Tus productos')
    await expect(page.getByText(`${TEST_PRODUCT_NAME} Updated`).first()).toBeVisible()
  })

  test.afterEach(async ({ page }) => {
    // Cleanup: delete test products
    await login(page)
    await page.goto('/almacen')
    await page.waitForSelector('text=Tus productos')

    // Find test products and delete them
    const testProducts = page.getByText(/Test Product \d+/)
    const count = await testProducts.count()
    for (let i = 0; i < count; i++) {
      const product = testProducts.first()
      if (await product.isVisible()) {
        await product.click()
        await expect(page.getByText('Editar producto')).toBeVisible({ timeout: 5000 })

        // Look for delete button
        const deleteBtn = page.getByRole('button', { name: /eliminar/i })
        if (await deleteBtn.isVisible()) {
          await deleteBtn.click()
          // Confirm deletion
          const confirmBtn = page.getByRole('button', { name: /^Eliminar$/ })
          if (await confirmBtn.isVisible()) {
            await confirmBtn.click()
          }
        }
        await page.waitForSelector('text=Tus productos', { timeout: 5000 })
      }
    }
  })
})
