import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProductModal } from './ProductModal'
import type { Product, Variant } from '../../types.ts'

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

const createMockVariant = (overrides: Partial<Variant> = {}): Variant => ({
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

const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Playera Básica',
  category: 'Ropa',
  categoryId: 'cat1',
  published: true,
  publicDescription: 'Playera cómoda',
  imageUrl: null,
  color: 'sky',
  variants: [createMockVariant()],
  ...overrides,
})

const defaultProps = {
  initial: null,
  categories: mockCategories,
  optionTypes: mockOptionTypes,
  onCategoryCreated: vi.fn(),
  onVariantsChanged: vi.fn(),
  onClose: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue(undefined),
}

describe('ProductModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Formulario - Creación', () => {
    it('debería llamar a onSubmit al enviar el formulario', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      render(<ProductModal {...defaultProps} onSubmit={onSubmit} />)

      const nameInput = screen.getByLabelText('Nombre del producto')
      fireEvent.change(nameInput, { target: { value: 'Nueva Playera' } })

      const skuInput = screen.getByLabelText('SKU')
      fireEvent.change(skuInput, { target: { value: 'NUE-PLA-001' } })

      const priceInput = screen.getByLabelText('Precio de venta')
      fireEvent.change(priceInput, { target: { value: '200' } })

      const stockInput = screen.getByLabelText('Existencias')
      fireEvent.change(stockInput, { target: { value: '50' } })

      const submitButton = screen.getByText('Guardar producto')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Formulario - Edición', () => {
    it('debería poblar todos los campos al editar', () => {
      const product = createMockProduct({
        publicDescription: 'Descripción de prueba',
        imageUrl: 'https://example.com/image.jpg',
      })
      render(<ProductModal {...defaultProps} initial={product} />)

      const nameInput = screen.getByLabelText(
        'Nombre del producto',
      ) as HTMLInputElement
      expect(nameInput.value).toBe('Playera Básica')

      const descriptionInput = screen.getByLabelText(
        'Descripción pública',
      ) as HTMLTextAreaElement
      expect(descriptionInput.value).toBe('Descripción de prueba')
    })

    it('debería mostrar checkbox de publicación con valor existente', () => {
      const product = createMockProduct({ published: true })
      render(<ProductModal {...defaultProps} initial={product} />)

      const checkbox = screen.getByLabelText(
        'Mostrar en mi catálogo público',
      ) as HTMLInputElement
      expect(checkbox.checked).toBe(true)
    })
  })

  describe('Cierre del modal', () => {
    it('debería llamar a onClose al hacer clic en el botón de cerrar del modal', () => {
      const onClose = vi.fn()
      render(<ProductModal {...defaultProps} onClose={onClose} />)
      // El botón de cerrar está en ModalFrame
      const closeButton = screen.getByLabelText('Cerrar')
      fireEvent.click(closeButton)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})
