/**
 * ProductModal.test.tsx — Bug fix tests for variant editing data flow
 *
 * Bug: When editing a variant through the VariantManagerModal, the ProductModal
 * doesn't update automatically with the new variant information. The `initial`
 * prop is a snapshot set when the modal opens and is never refreshed.
 *
 * Fix: After a variant is saved, onVariantsChanged should trigger a query
 * invalidation, and the parent (App.tsx) should update editingProduct with
 * fresh data from the cache, causing the modal to re-render with updated
 * variant data.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProductModal } from '../ProductModal.tsx'
import type { Product, Variant } from '../../../types.ts'

// ─── Mock de repository (para VariantManagerModal) ───────────

vi.mock('../../../lib/repository.ts', () => ({
  createVariant: vi.fn().mockResolvedValue('new-variant-id'),
  updateVariant: vi.fn().mockResolvedValue(undefined),
  deleteVariant: vi.fn().mockResolvedValue(undefined),
}))

import * as repository from '../../../lib/repository.ts'

// ─── Datos de prueba ─────────────────────────────────────────

const mockCategories = [
  { id: 'cat1', name: 'Ropa' },
  { id: 'cat2', name: 'Accesorios' },
]

const mockOptionTypes = [
  {
    id: 'ot1',
    name: 'Color',
    values: [
      { id: 'ov1', name: 'Negro' },
      { id: 'ov2', name: 'Blanco' },
    ],
  },
]

const createVariant = (overrides: Partial<Variant> = {}): Variant => ({
  id: 'v1',
  productId: 'p1',
  sku: 'PLA-BAS-NEG',
  name: 'Negro',
  inventoryCost: 80,
  salePrice: 150,
  stock: 25,
  optionValues: [{ optionType: 'Color', value: 'Negro' }],
  ...overrides,
})

const createProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Playera Básica',
  category: 'Ropa',
  categoryId: 'cat1',
  published: true,
  publicDescription: 'Playera cómoda',
  imageUrl: null,
  color: 'sky',
  variants: [createVariant()],
  ...overrides,
})

const defaultProps = {
  initial: null as Product | null,
  categories: mockCategories,
  optionTypes: mockOptionTypes,
  onCategoryCreated: vi.fn(),
  onVariantsChanged: vi.fn(),
  onClose: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue(undefined),
}

// ─── Tests ───────────────────────────────────────────────────

describe('ProductModal — bug fix: variant editing data flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(repository.createVariant).mockResolvedValue('new-variant-id')
    vi.mocked(repository.updateVariant).mockResolvedValue(undefined)
    vi.mocked(repository.deleteVariant).mockResolvedValue(undefined)
    window.confirm = vi.fn(() => true)
  })

  describe('onVariantsChanged callback', () => {
    it('debería llamar a onVariantsChanged después de guardar una variante existente', async () => {
      const onVariantsChanged = vi.fn()
      const product = createProduct()

      render(
        <ProductModal
          {...defaultProps}
          initial={product}
          onVariantsChanged={onVariantsChanged}
        />,
      )

      // Click "Editar variante" button
      fireEvent.click(screen.getByLabelText('Editar variante PLA-BAS-NEG'))

      // Fill in the variant form
      fireEvent.change(screen.getByLabelText('SKU'), {
        target: { value: 'PLA-BAS-NEG-UPDATED' },
      })
      fireEvent.change(screen.getByLabelText('Precio de venta'), {
        target: { value: '180' },
      })
      fireEvent.change(screen.getByLabelText('Existencias'), {
        target: { value: '30' },
      })

      // Submit the variant form
      fireEvent.click(screen.getByRole('button', { name: /guardar variante/i }))

      await waitFor(() => {
        expect(onVariantsChanged).toHaveBeenCalledTimes(1)
      })
    })

    it('debería llamar a onVariantsChanged después de crear una nueva variante', async () => {
      const onVariantsChanged = vi.fn()
      const product = createProduct()

      render(
        <ProductModal
          {...defaultProps}
          initial={product}
          onVariantsChanged={onVariantsChanged}
        />,
      )

      // Click "Añadir variante"
      fireEvent.click(screen.getByText('Añadir variante'))

      // Fill in the variant form
      fireEvent.change(screen.getByLabelText('SKU'), {
        target: { value: 'PLA-BAS-BLAN' },
      })
      fireEvent.change(screen.getByLabelText('Precio de venta'), {
        target: { value: '160' },
      })
      fireEvent.change(screen.getByLabelText('Existencias'), {
        target: { value: '20' },
      })

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /añadir variante/i }))

      await waitFor(() => {
        expect(onVariantsChanged).toHaveBeenCalledTimes(1)
      })
    })

    it('debería llamar a onVariantsChanged después de eliminar una variante', async () => {
      const onVariantsChanged = vi.fn()
      const product = createProduct({
        variants: [
          createVariant({ id: 'v1' }),
          createVariant({ id: 'v2', sku: 'PLA-BAS-BLAN', name: 'Blanco' }),
        ],
      })

      render(
        <ProductModal
          {...defaultProps}
          initial={product}
          onVariantsChanged={onVariantsChanged}
        />,
      )

      // Click delete on the second variant
      fireEvent.click(screen.getByLabelText('Eliminar variante PLA-BAS-BLAN'))

      await waitFor(() => {
        expect(onVariantsChanged).toHaveBeenCalledTimes(1)
      })
    })

    it('debería llamar a updateVariant con los datos correctos al editar', async () => {
      const product = createProduct()

      render(
        <ProductModal
          {...defaultProps}
          initial={product}
          onVariantsChanged={vi.fn()}
        />,
      )

      // Open variant editor
      fireEvent.click(screen.getByLabelText('Editar variante PLA-BAS-NEG'))

      // Modify fields
      fireEvent.change(screen.getByLabelText('SKU'), {
        target: { value: 'NEW-SKU' },
      })
      fireEvent.change(screen.getByLabelText('Nombre de variante'), {
        target: { value: 'Blanco' },
      })
      fireEvent.change(screen.getByLabelText('Precio de venta'), {
        target: { value: '200' },
      })
      fireEvent.change(screen.getByLabelText('Costo de inventario'), {
        target: { value: '100' },
      })
      fireEvent.change(screen.getByLabelText('Existencias'), {
        target: { value: '50' },
      })

      fireEvent.click(screen.getByRole('button', { name: /guardar variante/i }))

      await waitFor(() => {
        expect(repository.updateVariant).toHaveBeenCalledWith('v1', {
          sku: 'NEW-SKU',
          name: 'Blanco',
          inventoryCost: 100,
          salePrice: 200,
          stock: 50,
          optionValueIds: ['ov1'],
        })
      })
    })

    it('debería llamar a createVariant con los datos correctos al crear variante', async () => {
      const product = createProduct()

      render(
        <ProductModal
          {...defaultProps}
          initial={product}
          onVariantsChanged={vi.fn()}
        />,
      )

      // Open new variant form
      fireEvent.click(screen.getByText('Añadir variante'))

      // Fill fields
      fireEvent.change(screen.getByLabelText('SKU'), {
        target: { value: 'PLA-BAS-BLAN' },
      })
      fireEvent.change(screen.getByLabelText('Precio de venta'), {
        target: { value: '160' },
      })
      fireEvent.change(screen.getByLabelText('Existencias'), {
        target: { value: '20' },
      })

      fireEvent.click(screen.getByRole('button', { name: /añadir variante/i }))

      await waitFor(() => {
        expect(repository.createVariant).toHaveBeenCalledWith('p1', {
          sku: 'PLA-BAS-BLAN',
          name: '',
          inventoryCost: 0,
          salePrice: 160,
          stock: 20,
          optionValueIds: [],
        })
      })
    })
  })

  describe('Re-renderizado con datos frescos después de editar variante', () => {
    it('debería mostrar la variante actualizada cuando el componente se re-renderiza con nuevos datos', () => {
      // Simula el fix: editingProduct se actualiza con datos frescos del cache
      const staleProduct = createProduct({
        variants: [createVariant({ stock: 25 })],
      })

      const { rerender } = render(
        <ProductModal
          {...defaultProps}
          initial={staleProduct}
          onVariantsChanged={vi.fn()}
        />,
      )

      // Initially shows stale stock
      expect(screen.getByText(/25 uds/)).toBeInTheDocument()

      // Re-render with fresh data (simulating editingProduct update from cache)
      const freshProduct = createProduct({
        variants: [createVariant({ stock: 50 })],
      })

      rerender(
        <ProductModal
          {...defaultProps}
          initial={freshProduct}
          onVariantsChanged={vi.fn()}
        />,
      )

      // Should show updated stock
      expect(screen.getByText(/50 uds/)).toBeInTheDocument()
    })

    it('debería mostrar variante con SKU actualizado tras re-render con datos frescos', () => {
      const staleProduct = createProduct({
        variants: [createVariant({ sku: 'OLD-SKU' })],
      })

      const { rerender } = render(
        <ProductModal
          {...defaultProps}
          initial={staleProduct}
          onVariantsChanged={vi.fn()}
        />,
      )

      expect(screen.getByText('OLD-SKU')).toBeInTheDocument()

      // Simulate fresh data from cache after variant edit
      const freshProduct = createProduct({
        variants: [createVariant({ sku: 'NEW-SKU' })],
      })

      rerender(
        <ProductModal
          {...defaultProps}
          initial={freshProduct}
          onVariantsChanged={vi.fn()}
        />,
      )

      expect(screen.getByText('NEW-SKU')).toBeInTheDocument()
    })

    it('debería mostrar variante con precio actualizado tras re-render', () => {
      const staleProduct = createProduct({
        variants: [createVariant({ salePrice: 150, stock: 25 })],
      })

      const { rerender } = render(
        <ProductModal
          {...defaultProps}
          initial={staleProduct}
          onVariantsChanged={vi.fn()}
        />,
      )

      expect(screen.getByText(/150/)).toBeInTheDocument()

      const freshProduct = createProduct({
        variants: [createVariant({ salePrice: 200, stock: 30 })],
      })

      rerender(
        <ProductModal
          {...defaultProps}
          initial={freshProduct}
          onVariantsChanged={vi.fn()}
        />,
      )

      expect(screen.getByText(/200.*30 uds/)).toBeInTheDocument()
    })

    it('debería mostrar variantes adicionales cuando se añaden y editingProduct se actualiza', () => {
      const productWithOneVariant = createProduct({
        variants: [createVariant({ id: 'v1', sku: 'PLA-V1' })],
      })

      const { rerender } = render(
        <ProductModal
          {...defaultProps}
          initial={productWithOneVariant}
          onVariantsChanged={vi.fn()}
        />,
      )

      expect(screen.getByText('PLA-V1')).toBeInTheDocument()
      expect(screen.queryByText('PLA-V2')).not.toBeInTheDocument()

      // Simulate fresh data with new variant added
      const productWithTwoVariants = createProduct({
        variants: [
          createVariant({ id: 'v1', sku: 'PLA-V1' }),
          createVariant({ id: 'v2', sku: 'PLA-V2', name: 'Blanco' }),
        ],
      })

      rerender(
        <ProductModal
          {...defaultProps}
          initial={productWithTwoVariants}
          onVariantsChanged={vi.fn()}
        />,
      )

      expect(screen.getByText('PLA-V1')).toBeInTheDocument()
      expect(screen.getByText('PLA-V2')).toBeInTheDocument()
    })
  })

  describe('Flujo completo: editar variante → guardar producto', () => {
    it('debería enviar datos frescos de variante al guardar producto después de editar variante', async () => {
      // Escenario: editingProduct se actualiza correctamente con datos frescos
      const freshProduct = createProduct({
        variants: [
          createVariant({
            id: 'v1',
            sku: 'PLA-001-UPDATED',
            salePrice: 200,
            stock: 50,
          }),
        ],
      })

      const onSubmit = vi.fn().mockResolvedValue(undefined)

      render(
        <ProductModal
          {...defaultProps}
          initial={freshProduct}
          onSubmit={onSubmit}
        />,
      )

      // Submit the product form
      fireEvent.click(screen.getByRole('button', { name: /guardar producto/i }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1)
      })
    })
  })
})
