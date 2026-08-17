import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { login } from './helpers'

const TEST_CLIENT_PHONE = '5512345678'
const TEST_CLIENT_ZONE = 'Centro'

function clientName(testInfo: TestInfo) {
  return `E2E Client ${testInfo.testId}-${Date.now()}`
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
  await expect(
    dialog.getByRole('heading', { name: 'Nuevo cliente' }),
  ).toBeVisible()
  await dialog.locator('input[name="name"]').fill(name)
  await dialog.locator('input[name="phone"]').fill(TEST_CLIENT_PHONE)
  await dialog.locator('input[name="zone"]').fill(TEST_CLIENT_ZONE)
  await dialog.getByRole('button', { name: 'Guardar cliente' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText(name, { exact: true })).toBeVisible()
  await expect(page.getByText('Cliente guardado exitosamente.')).toBeVisible()
}

test.describe('Clients and payments', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should create a new client', async ({ page }, testInfo) => {
    const name = clientName(testInfo)
    await openClientsPage(page)
    await createClient(page, name)

    const clientCard = page.getByRole('article').filter({ hasText: name })
    await expect(clientCard).toContainText(TEST_CLIENT_PHONE)
    await expect(clientCard).toContainText(TEST_CLIENT_ZONE)
    await expect(clientCard).toContainText('0 pedidos')

    await page.reload()
    await expect(page.getByText(name, { exact: true })).toBeVisible()
  })

  test('should edit client details', async ({ page }, testInfo) => {
    const name = clientName(testInfo)
    const updatedName = `${name} Updated`
    await openClientsPage(page)
    await createClient(page, name)

    const clientCard = page.getByRole('article').filter({ hasText: name })
    await clientCard.getByRole('button', { name: `Editar ${name}` }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toHaveRole('dialog')
    await expect(
      dialog.getByRole('heading', { name: 'Editar cliente' }),
    ).toBeVisible()
    await expect(dialog.locator('input[name="name"]')).toHaveValue(name)
    await expect(dialog.locator('input[name="phone"]')).toHaveValue(
      TEST_CLIENT_PHONE,
    )
    await expect(dialog.locator('input[name="zone"]')).toHaveValue(
      TEST_CLIENT_ZONE,
    )

    await dialog.locator('input[name="name"]').fill(updatedName)
    await dialog.getByRole('button', { name: 'Guardar cliente' }).click()

    await expect(dialog).toBeHidden()
    await expect(
      page.getByText('Cliente actualizado exitosamente.'),
    ).toBeVisible()
    await expect(page.getByText(updatedName, { exact: true })).toBeVisible()
    await expect(page.getByText(name, { exact: true })).toHaveCount(0)

    await page.reload()
    const updatedCard = page
      .getByRole('article')
      .filter({ hasText: updatedName })
    await expect(updatedCard).toContainText(TEST_CLIENT_PHONE)
    await expect(updatedCard).toContainText(TEST_CLIENT_ZONE)
  })

  test('should register payments and update status', async ({
    page,
  }, testInfo) => {
    const name = clientName(testInfo)
    await openClientsPage(page)
    await createClient(page, name)

    await page.goto('/pedidos/nuevo')
    await expect(
      page.getByRole('heading', { name: 'Nuevo pedido' }),
    ).toBeVisible()

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

    await page.getByRole('button', { name: 'Guardar pedido' }).click()
    await expect(page.getByText('Pedido creado exitosamente.')).toBeVisible()

    const orderRow = page.getByRole('row').filter({ hasText: name })
    await expect(orderRow).toBeVisible()
    await orderRow.click()
    await expect(
      page.getByRole('heading', { name: /Detalles del pedido/ }),
    ).toBeVisible()

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
  })

  test('should show client in order flow', async ({ page }, testInfo) => {
    const name = clientName(testInfo)
    await openClientsPage(page)
    await createClient(page, name)

    await page.goto('/pedidos/nuevo')
    await expect(
      page.getByRole('heading', { name: 'Nuevo pedido' }),
    ).toBeVisible()
    const clientSelect = page.getByRole('combobox', { name: 'Cliente' })
    await expect(clientSelect).toBeVisible()
    await clientSelect.click()
    await expect(page.getByRole('option', { name, exact: true })).toBeVisible()
  })

  test('should delete a client after confirmation', async ({
    page,
  }, testInfo) => {
    const name = clientName(testInfo)
    await openClientsPage(page)
    await createClient(page, name)

    const card = page.getByRole('article').filter({ hasText: name })
    await card.getByRole('button', { name: `Eliminar ${name}` }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(`¿Eliminar el cliente "${name}"?`)
    await dialog.getByRole('button', { name: 'Confirmar' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByText('Cliente eliminado.')).toBeVisible()
    await expect(page.getByText(name, { exact: true })).toHaveCount(0)
  })

  test.afterEach(async ({ page }) => {
    await openClientsPage(page)
    while (true) {
      const deleteButton = page
        .getByRole('button', { name: /^Eliminar E2E Client / })
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
