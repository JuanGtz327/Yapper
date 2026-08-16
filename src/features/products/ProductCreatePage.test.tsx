import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProductCreatePage } from './ProductCreatePage'
import type { Product } from '../../types.ts'

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
  {
    id: 'ot2',
    name: 'Talla',
    values: [
      { id: 'ov3', name: 'M' },
      { id: 'ov4', name: 'L' },
    ],
  },
]

const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Playera Básica',
  category: 'Ropa',
  categoryId: 'cat1',
  published: true,
  publicDescription: 'Playera cómoda',
  imageUrl: null,
  color: 'sky',
  variants: [
    {
      id: 'v1',
      productId: 'p1',
      sku: 'PLA-BAS-NEG',
      name: 'Negro',
      inventoryCost: 80,
      salePrice: 150,
      stock: 25,
      optionValues: [{ optionType: 'Color', value: 'Negro' }],
    },
  ],
  ...overrides,
})

const defaultProps = {
  initial: null,
  categories: mockCategories,
  optionTypes: mockOptionTypes,
  onCategoryCreated: vi.fn(),
  onVariantsChanged: vi.fn(),
  onClose: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue(true),
}

describe('ProductCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Element.prototype.scrollIntoView = vi.fn()
  })

  describe('Navegación', () => {
    it('debería llamar a onClose al hacer clic en volver', () => {
      const onClose = vi.fn()
      render(<ProductCreatePage {...defaultProps} onClose={onClose} />)
      fireEvent.click(screen.getByText('Volver'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Modal de variante', () => {
    it('debería abrir modal de variante al hacer clic en añadir', async () => {
      const user = userEvent.setup()
      render(<ProductCreatePage {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Añadir variante' }))
      expect(
        screen.getByRole('dialog', { name: 'Añadir variante' }),
      ).toBeInTheDocument()
    })

    it('debería mostrar campos del formulario en el modal', async () => {
      const user = userEvent.setup()
      render(<ProductCreatePage {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Añadir variante' }))
      expect(screen.getByLabelText('SKU')).toBeInTheDocument()
      expect(screen.getByLabelText('Nombre de variante')).toBeInTheDocument()
      expect(screen.getByLabelText('Precio de venta')).toBeInTheDocument()
      expect(screen.getByLabelText('Existencias')).toBeInTheDocument()
    })

    it('debería mostrar selects de opciones si hay optionTypes', async () => {
      const user = userEvent.setup()
      render(<ProductCreatePage {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Añadir variante' }))
      expect(screen.getByText('Agregar opción')).toBeInTheDocument()
    })

    it('debería agregar variante al draft desde el modal', async () => {
      const user = userEvent.setup()
      render(<ProductCreatePage {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Añadir variante' }))

      // Fill modal
      await user.type(screen.getByLabelText('SKU'), 'PLA-001')
      await user.type(screen.getByLabelText('Precio de venta'), '200')
      await user.type(screen.getByLabelText('Existencias'), '50')

      // Submit modal via the form's submit button
      const modal = screen.getByRole('dialog')
      const submitBtn = modal.querySelector('button[type="submit"]')!
      await user.click(submitBtn)

      // Modal should close, variant should appear in the list
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
      expect(screen.getAllByText('PLA-001').length).toBeGreaterThanOrEqual(1)
    })

    it('debería abrir modal de editar para variante existente', async () => {
      const user = userEvent.setup()
      const product = createMockProduct()
      render(<ProductCreatePage {...defaultProps} initial={product} />)
      await user.click(screen.getByLabelText('Editar variante PLA-BAS-NEG'))
      expect(
        screen.getByRole('dialog', { name: 'Editar variante' }),
      ).toBeInTheDocument()
      expect((screen.getByLabelText('SKU') as HTMLInputElement).value).toBe(
        'PLA-BAS-NEG',
      )
    })

    it('debería cerrar modal al cancelar', async () => {
      const user = userEvent.setup()
      render(<ProductCreatePage {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Añadir variante' }))
      await user.click(screen.getByLabelText('Cerrar'))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Eliminar variante', () => {
    it('debería mostrar confirmación al eliminar variante', async () => {
      const user = userEvent.setup()
      const product = createMockProduct()
      render(<ProductCreatePage {...defaultProps} initial={product} />)
      await user.click(screen.getByLabelText('Eliminar variante PLA-BAS-NEG'))
      expect(
        screen.getByText(/Eliminar la variante PLA-BAS-NEG/),
      ).toBeInTheDocument()
    })
  })
})
