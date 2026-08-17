import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { login } from './helpers'

const TEST_PRODUCT_PRICE = '150'
const TEST_PRODUCT_COST = '80'
const TEST_PRODUCT_STOCK = '25'

function productName(testInfo: TestInfo) {
  return `E2E Product ${testInfo.testId}-${Date.now()}`
}

function variantSku(testInfo: TestInfo, suffix = '') {
  return `E2E-${testInfo.workerIndex}-${Date.now()}${suffix}`
}

async function openProductsPage(page: Page) {
  await page.goto('/almacen')
  await expect(
    page.getByRole('heading', { name: 'Tus productos' }),
  ).toBeVisible()
}

async function openNewProduct(page: Page) {
  await openProductsPage(page)
  await page.getByRole('button', { name: 'Añadir producto' }).click()
  await expect(
    page.getByRole('heading', { name: 'Nuevo producto' }),
  ).toBeVisible()
}

async function addVariant(
  page: Page,
  sku: string,
  price = TEST_PRODUCT_PRICE,
  stock = TEST_PRODUCT_STOCK,
) {
  await page.getByRole('button', { name: 'Añadir variante' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('heading', { name: 'Añadir variante' }),
  ).toBeVisible()
  await dialog.getByPlaceholder('Ej. TUP-REC-1L-NEG').fill(sku)
  await dialog.getByRole('spinbutton', { name: 'Precio de venta' }).fill(price)
  await dialog
    .getByRole('spinbutton', { name: 'Costo de inventario' })
    .fill(TEST_PRODUCT_COST)
  await dialog.getByRole('spinbutton', { name: 'Existencias' }).fill(stock)
  const submitButton = dialog.getByRole('button', { name: 'Añadir variante' })
  await submitButton.click()
  await expect(dialog).toBeHidden()
  await expect(
    page.getByRole('alert').filter({ hasText: 'Variante añadida.' }).last(),
  ).toBeVisible()
  await expect(
    page.getByRole('listitem').filter({ hasText: sku }).first(),
  ).toBeVisible()
}

async function createProduct(page: Page, name: string, sku: string) {
  await openNewProduct(page)
  await page.getByLabel('Nombre del producto').fill(name)
  await addVariant(page, sku)
  await expect(
    page.getByRole('heading', { name: 'Nuevo producto' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Crear producto' }).click()
  await expect(page.getByText('Producto guardado exitosamente.')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Tus productos' }),
  ).toBeVisible()
  await expect(page.getByRole('row', { name: new RegExp(name) })).toContainText(
    sku,
  )
}

async function openProductDetail(page: Page, name: string) {
  const row = page.getByRole('row', { name: new RegExp(name) }).first()
  await expect(row).toBeVisible()
  await row.click()
  await expect(page.getByRole('heading', { name })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Editar producto' }),
  ).toBeVisible()
}

async function openProductEditor(page: Page, name: string) {
  await openProductDetail(page, name)
  await page.getByRole('button', { name: 'Editar producto' }).click()
  await expect(
    page.getByRole('heading', { name: 'Editar producto' }),
  ).toBeVisible()
}

test.describe('Inventory and product lifecycle', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should create a product with a variant', async ({ page }, testInfo) => {
    const name = productName(testInfo)
    const sku = variantSku(testInfo)
    await createProduct(page, name, sku)

    await page.reload()
    await expect(
      page.getByRole('row', { name: new RegExp(name) }),
    ).toContainText(sku)
    await openProductDetail(page, name)
    await expect(page.getByText('1 variante', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: sku })).toContainText(
      '25 uds',
    )
  })

  test('should edit product details', async ({ page }, testInfo) => {
    const name = productName(testInfo)
    const sku = variantSku(testInfo)
    const updatedName = `${name} Updated`
    await createProduct(page, name, sku)
    await openProductEditor(page, name)

    const nameInput = page.getByLabel('Nombre del producto')
    await expect(nameInput).toHaveValue(name)
    await nameInput.fill(updatedName)
    await page.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(
      page.getByText('Producto actualizado exitosamente.'),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Tus productos' }),
    ).toBeVisible()
    await expect(
      page.getByRole('row', { name: new RegExp(updatedName) }),
    ).toContainText(sku)
  })

  test('should manage variants', async ({ page }, testInfo) => {
    const name = productName(testInfo)
    const initialSku = variantSku(testInfo)
    const secondSku = variantSku(testInfo, '-SECOND')
    await createProduct(page, name, initialSku)
    await openProductEditor(page, name)

    await addVariant(page, secondSku, '200', '10')
    await expect(page.getByText(secondSku, { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(
      page.getByText('Producto actualizado exitosamente.'),
    ).toBeVisible()

    await page.goto('/almacen')
    await openProductDetail(page, name)
    await expect(page.getByText('2 variantes', { exact: true })).toBeVisible()
    await expect(
      page.getByRole('button').filter({ hasText: initialSku }).first(),
    ).toBeVisible()
    await expect(
      page.getByRole('button').filter({ hasText: secondSku }).first(),
    ).toContainText('10 uds')
  })

  test('should persist product data', async ({ page }, testInfo) => {
    const name = productName(testInfo)
    const sku = variantSku(testInfo)
    await createProduct(page, name, sku)

    await page.reload()
    await expect(
      page.getByRole('row', { name: new RegExp(name) }),
    ).toContainText(sku)
    await openProductDetail(page, name)
    await page.reload()
    await expect(page.getByRole('heading', { name })).toBeVisible()
    await expect(page.getByRole('button', { name: sku })).toContainText(
      '25 uds',
    )
  })

  test('should reject a product without a valid name', async ({
    page,
  }, testInfo) => {
    const sku = variantSku(testInfo)
    await openNewProduct(page)
    await page.getByLabel('Nombre del producto').fill('A')
    await addVariant(page, sku)
    await page.getByRole('button', { name: 'Crear producto' }).click()

    await expect(page.getByText('Revisa los campos marcados.')).toBeVisible()
    await expect(
      page.getByText('El nombre debe tener entre 2 y 120 caracteres.'),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Nuevo producto' }),
    ).toBeVisible()
    await expect(page.getByText('Producto guardado exitosamente.')).toHaveCount(
      0,
    )
  })

  test('should reject an unsafe public image URL', async ({
    page,
  }, testInfo) => {
    const name = productName(testInfo)
    const sku = variantSku(testInfo)
    await openNewProduct(page)
    await page.getByLabel('Nombre del producto').fill(name)
    await addVariant(page, sku)
    await page.getByLabel('Imagen pública (URL)').fill('javascript:alert(1)')
    await page.getByRole('button', { name: 'Crear producto' }).click()

    await expect(page.getByText('Revisa los campos marcados.')).toBeVisible()
    await expect(
      page.getByText('La imagen debe usar una URL HTTPS válida.'),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Nuevo producto' }),
    ).toBeVisible()
  })

  test('should reject a duplicate variant SKU', async ({ page }, testInfo) => {
    const firstName = productName(testInfo)
    const secondName = `${firstName} Second`
    const sku = variantSku(testInfo)
    await createProduct(page, firstName, sku)
    await openNewProduct(page)
    await page.getByLabel('Nombre del producto').fill(secondName)
    await addVariant(page, sku)
    await page.getByRole('button', { name: 'Crear producto' }).click()

    await expect(
      page.getByText(
        'Ya existe otra variante con ese SKU. Usa un SKU diferente.',
      ),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Nuevo producto' }),
    ).toBeVisible()
    await expect(
      page.getByRole('row', { name: new RegExp(secondName) }),
    ).toHaveCount(0)
  })

  test.afterEach(async ({ page }) => {
    await openProductsPage(page)
    while (true) {
      const productRow = page.getByRole('row', { name: /E2E Product/ }).first()
      if (!(await productRow.count())) break
      await productRow.click()
      await expect(
        page.getByRole('button', { name: 'Editar producto' }),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Editar producto' }).click()
      await expect(
        page.getByRole('heading', { name: 'Editar producto' }),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Eliminar producto' }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: 'Confirmar' }).click()
      await expect(dialog).toBeHidden()
      await expect(page.getByText('Producto eliminado.')).toBeVisible()
      await page.reload()
      await expect(
        page.getByRole('heading', { name: 'Tus productos' }),
      ).toBeVisible()
    }
  })
})
