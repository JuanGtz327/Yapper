import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { login } from './helpers'

const TEST_CLIENT_PHONE = '5512345678'
const TEST_CLIENT_ZONE = 'Centro'
const TEST_PRODUCT_SKU = 'E2E-PLAYERA-BASICA'

function clientName(testInfo: TestInfo) {
  return `E2E Order Client ${testInfo.testId}-${Date.now()}`
}

async function openClientsPage(page: Page) {
  await page.goto('/clientes')
  await expect(
    page.getByRole('heading', { name: 'Tus clientes' }),
  ).toBeVisible()
}

async function createClient(page: Page, name: string) {
  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.locator('input[name="name"]').fill(name)
  await dialog.locator('input[name="phone"]').fill(TEST_CLIENT_PHONE)
  await dialog.locator('input[name="zone"]').fill(TEST_CLIENT_ZONE)
  await dialog.getByRole('button', { name: 'Guardar cliente' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Cliente guardado exitosamente.')).toBeVisible()
  await expect(page.getByText(name, { exact: true })).toBeVisible()
}

async function selectOrderData(page: Page, name: string) {
  const clientSelect = page.getByRole('combobox', { name: 'Cliente' })
  await expect(clientSelect).toBeVisible()
  await clientSelect.click()
  await expect(page.getByRole('option', { name, exact: true })).toBeVisible()
  await page.getByRole('option', { name, exact: true }).click()

  const productSelect = page.getByRole('combobox', { name: 'Producto' })
  await expect(productSelect).toBeVisible()
  await productSelect.click()
  await expect(
    page.getByRole('option', { name: /Playera Básica/ }),
  ).toBeVisible()
  await page.getByRole('option', { name: /Playera Básica/ }).click()
}

async function createOrder(page: Page, name: string) {
  await page.goto('/pedidos/nuevo')
  await expect(
    page.getByRole('heading', { name: 'Nuevo pedido' }),
  ).toBeVisible()
  await selectOrderData(page, name)
  await page.getByRole('button', { name: 'Guardar pedido' }).click()
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'Pedido creado exitosamente.' })
      .last(),
  ).toBeVisible()

  const orderRow = page.getByRole('row').filter({ hasText: name })
  await expect(orderRow).toBeVisible()
  await orderRow.click()
  await expect(
    page.getByRole('heading', { name: /Detalles del pedido/ }),
  ).toBeVisible()
}

async function readInventoryStock(page: Page) {
  await page.goto('/almacen')
  await expect(
    page.getByRole('heading', { name: 'Tus productos' }),
  ).toBeVisible()
  const stock = page.getByTestId(`inventory-stock-${TEST_PRODUCT_SKU}`)
  await expect(stock).toBeVisible()
  return Number(await stock.textContent())
}

async function readReceivables(page: Page) {
  const card = page.getByText('Por cobrar').locator('..')
  const value = await card.locator('strong').textContent()
  return Number(value?.replace(/[^\d.-]/g, ''))
}

async function readPeriodRevenue(page: Page) {
  const card = page.getByText('Ingresos del periodo').locator('../..')
  await expect(card).toBeVisible()
  const value = await card.locator('strong').textContent()
  return Number(value?.replace(/[^\d.-]/g, ''))
}

test.describe('Order lifecycle', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should create a complete order', async ({ page }, testInfo) => {
    const name = clientName(testInfo)
    await openClientsPage(page)
    await createClient(page, name)
    const stockBefore = await readInventoryStock(page)

    await createOrder(page, name)
    await expect(page.getByText(name, { exact: true })).toBeVisible()
    const orderLine = page
      .getByRole('listitem')
      .filter({ hasText: 'Playera Básica' })
    await expect(orderLine).toContainText('$150.00')
    await expect(
      page
        .getByRole('radiogroup', { name: 'Estado de pago' })
        .getByRole('radio', {
          name: 'Pendiente',
        }),
    ).toHaveAttribute('aria-checked', 'true')

    const stockAfterCreate = await readInventoryStock(page)
    expect(stockAfterCreate).toBe(stockBefore - 1)

    await page.goto('/pedidos')
    await expect(page.getByRole('heading', { name: 'Pedidos' })).toBeVisible()
  })

  test('should register a partial payment', async ({ page }, testInfo) => {
    const name = clientName(testInfo)
    await openClientsPage(page)
    await createClient(page, name)
    await page.goto('/pedidos')
    const receivablesBefore = await readReceivables(page)
    await page.goto('/estadisticas')
    await expect(
      page.getByRole('heading', { name: 'Estadísticas' }),
    ).toBeVisible()
    const revenueBefore = await readPeriodRevenue(page)
    await createOrder(page, name)

    await page.getByRole('button', { name: 'Registrar abono' }).click()
    const paymentDialog = page.getByRole('dialog')
    await expect(paymentDialog).toBeVisible()
    await expect(paymentDialog.getByText('Saldo restante')).toBeVisible()
    await paymentDialog.locator('input[type="number"]').fill('50')
    await paymentDialog.getByRole('radio', { name: 'Transferencia' }).click()
    await paymentDialog
      .getByRole('button', { name: /Registrar abono de/ })
      .click()

    await expect(paymentDialog).toBeHidden()
    await expect(page.getByText('Abono registrado exitosamente.')).toBeVisible()
    await expect(page.getByText('Parcial', { exact: true })).toBeVisible()
    await expect(
      page.getByRole('list', { name: 'Historial de abonos' }),
    ).toContainText('Transferencia')
    await expect(
      page.getByRole('group', { name: 'Progreso de pago' }),
    ).toContainText('$50.00')
    await expect(
      page.getByRole('group', { name: 'Progreso de pago' }),
    ).toContainText('$100.00')

    await page.goto('/pedidos')
    await expect(
      page.getByRole('columnheader', { name: 'Total pagado' }),
    ).toBeVisible()
    await expect(
      page.getByRole('columnheader', { name: 'Pendiente de pago' }),
    ).toBeVisible()
    const partialOrderRow = page.getByRole('row').filter({ hasText: name })
    await expect(partialOrderRow).toContainText('$50.00')
    await expect(partialOrderRow).toContainText('$100.00')
    expect(await readReceivables(page)).toBe(receivablesBefore + 100)
    await page.goto('/estadisticas')
    expect(await readPeriodRevenue(page)).toBe(revenueBefore + 50)
  })

  test('should change order status', async ({ page }, testInfo) => {
    const name = clientName(testInfo)
    await openClientsPage(page)
    await createClient(page, name)
    await createOrder(page, name)

    const delivered = page.getByRole('radio', { name: 'Entregado' })
    await expect(delivered).toHaveAttribute('aria-checked', 'false')
    await delivered.click()
    await expect(page.getByText('Estado del pedido actualizado.')).toBeVisible()
    await expect(delivered).toHaveAttribute('aria-checked', 'true')

    await page.getByRole('button', { name: 'Volver a pedidos' }).click()
    await expect(page.getByRole('heading', { name: 'Pedidos' })).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: name })).toContainText(
      'Entregado',
    )

    const clientFilter = page.getByRole('combobox', {
      name: 'Filtrar por cliente',
    })
    await clientFilter.click()
    await page.getByRole('option', { name, exact: true }).click()
    const orderDate = new Date().toISOString().slice(0, 10)
    await page.getByLabel('Filtrar por fecha del pedido').fill(orderDate)
    await expect(page.getByRole('row').filter({ hasText: name })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: name })).toBeVisible()
  })

  test('should verify inventory changes', async ({ page }, testInfo) => {
    const name = clientName(testInfo)
    await openClientsPage(page)
    await createClient(page, name)
    const stockBefore = await readInventoryStock(page)

    await createOrder(page, name)
    expect(await readInventoryStock(page)).toBe(stockBefore - 1)

    await page.goto('/pedidos')
    await expect(page.getByRole('heading', { name: 'Pedidos' })).toBeVisible()
    const orderRow = page.getByRole('row').filter({ hasText: name })
    await expect(orderRow).toBeVisible()
    await orderRow.click()
    await expect(
      page.getByRole('heading', { name: /Detalles del pedido/ }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Cancelar pedido' }).click()
    const confirmation = page.getByRole('dialog')
    await expect(confirmation).toBeVisible()
    await confirmation.getByRole('button', { name: 'Confirmar' }).click()
    await expect(confirmation).toBeHidden()
    await expect(page.getByText('Pedido cancelado.')).toBeVisible()

    expect(await readInventoryStock(page)).toBe(stockBefore)
  })

  test('should edit an existing order and release reduced stock', async ({
    page,
  }, testInfo) => {
    const name = clientName(testInfo)
    await openClientsPage(page)
    await createClient(page, name)
    const stockBefore = await readInventoryStock(page)

    await page.goto('/pedidos/nuevo')
    await selectOrderData(page, name)
    await page.getByRole('spinbutton', { name: 'Cantidad 1' }).fill('9')
    await page.getByRole('button', { name: 'Guardar pedido' }).click()
    await expect(page.getByText('Pedido creado exitosamente.')).toBeVisible()
    expect(await readInventoryStock(page)).toBe(stockBefore - 9)

    await page.goto('/pedidos')
    const orderRow = page.getByRole('row').filter({ hasText: name })
    await expect(orderRow).toBeVisible()
    await orderRow.click()
    await page.getByRole('button', { name: 'Editar pedido' }).click()
    await expect(
      page.getByRole('heading', { name: 'Editar pedido' }),
    ).toBeVisible()
    await expect(
      page.locator('small').filter({
        hasText: /en almacén · hasta .* en este pedido/,
      }),
    ).toBeVisible()

    await page.getByRole('spinbutton', { name: 'Cantidad 1' }).fill('7')
    const editRpcCalls: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/rest/v1/rpc/'))
        editRpcCalls.push(request.url())
    })
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(
      page.getByText('Pedido actualizado correctamente.'),
    ).toBeVisible({ timeout: 30000 })
    expect(editRpcCalls.some((url) => url.endsWith('/update_order'))).toBe(true)
    expect(editRpcCalls.some((url) => url.endsWith('/create_order'))).toBe(
      false,
    )
    expect(await readInventoryStock(page)).toBe(stockBefore - 7)

    await page.goto('/pedidos')
    await page.getByRole('row').filter({ hasText: name }).click()
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Playera Básica' }).first(),
    ).toContainText('7')
  })

  test('should reject an order quantity above available stock', async ({
    page,
  }, testInfo) => {
    const name = clientName(testInfo)
    await openClientsPage(page)
    await createClient(page, name)
    await page.goto('/pedidos/nuevo')
    await expect(
      page.getByRole('heading', { name: 'Nuevo pedido' }),
    ).toBeVisible()
    await selectOrderData(page, name)

    await page.getByRole('spinbutton', { name: 'Cantidad 1' }).fill('1001')
    await page.getByRole('button', { name: 'Guardar pedido' }).click()

    await expect(
      page.getByRole('spinbutton', { name: 'Cantidad 1' }),
    ).toHaveValue('1001')
    await expect(
      page.getByRole('heading', { name: 'Nuevo pedido' }),
    ).toBeVisible()
    await expect(page.getByText('Pedido creado exitosamente.')).toHaveCount(0)
  })

  test('should block a payment above the remaining balance', async ({
    page,
  }, testInfo) => {
    const name = clientName(testInfo)
    await openClientsPage(page)
    await createClient(page, name)
    await createOrder(page, name)

    await page.getByRole('button', { name: 'Registrar abono' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('input[type="number"]').fill('151')
    await expect(
      dialog.getByRole('button', { name: /Registrar abono de/ }),
    ).toBeDisabled()
    await expect(dialog).toBeVisible()
    await expect(page.getByText('Abono registrado exitosamente.')).toHaveCount(
      0,
    )
  })

  test.afterEach(async ({ page }) => {
    await openClientsPage(page)
    while (true) {
      const deleteButton = page
        .getByRole('button', { name: /^Eliminar E2E Order Client / })
        .first()
      if (!(await deleteButton.count())) break

      const label = await deleteButton.getAttribute('aria-label')
      await deleteButton.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: 'Confirmar' }).click()
      await expect(dialog).toBeHidden()
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Cliente eliminado.' })
          .last(),
      ).toBeVisible()
      if (label) {
        await expect(page.getByRole('button', { name: label })).toHaveCount(0)
      }
      await page.reload()
      await expect(
        page.getByRole('heading', { name: 'Tus clientes' }),
      ).toBeVisible()
    }
  })
})
