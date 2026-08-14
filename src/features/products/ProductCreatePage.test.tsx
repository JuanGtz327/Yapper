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

  describe('Renderizado - Nuevo producto', () => {
    it('debería mostrar título "Nuevo producto"', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByText('Nuevo producto')).toBeInTheDocument()
    })

    it('debería mostrar campo de nombre del producto', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByLabelText('Nombre del producto')).toBeInTheDocument()
    })

    it('debería mostrar campo de categoría', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByLabelText('Categoría')).toBeInTheDocument()
    })

    it('debería mostrar sección de variantes', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByText('Variantes')).toBeInTheDocument()
    })

    it('debería mostrar botón de añadir variante', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByText('Añadir variante')).toBeInTheDocument()
    })

    it('debería mostrar mensaje de variantes vacías', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByText(/Aún no tienes variantes/)).toBeInTheDocument()
    })

    it('debería mostrar sección de catálogo público', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByText('Catálogo público')).toBeInTheDocument()
    })

    it('debería mostrar botón de crear producto', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByText('Crear producto')).toBeInTheDocument()
    })

    it('debería mostrar botón de cancelar', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })

    it('debería mostrar botón de volver', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByText('Volver')).toBeInTheDocument()
    })

    it('debería mostrar vista previa', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByText('VISTA PREVIA')).toBeInTheDocument()
    })

    it('debería mostrar 0 variantes en resumen', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByText('RESUMEN')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  describe('Renderizado - Editar producto', () => {
    it('debería mostrar título "Editar producto"', () => {
      const product = createMockProduct()
      render(<ProductCreatePage {...defaultProps} initial={product} />)
      expect(screen.getByText('Editar producto')).toBeInTheDocument()
    })

    it('debería poblar el campo nombre con el valor existente', () => {
      const product = createMockProduct()
      render(<ProductCreatePage {...defaultProps} initial={product} />)
      const input = screen.getByLabelText(
        'Nombre del producto',
      ) as HTMLInputElement
      expect(input.value).toBe('Playera Básica')
    })

    it('debería mostrar variantes existentes', () => {
      const product = createMockProduct()
      render(<ProductCreatePage {...defaultProps} initial={product} />)
      const items = screen.getAllByText('PLA-BAS-NEG')
      expect(items.length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar botón de guardar cambios', () => {
      const product = createMockProduct()
      render(<ProductCreatePage {...defaultProps} initial={product} />)
      expect(screen.getByText('Guardar cambios')).toBeInTheDocument()
    })

    it('debería marcar checkbox de publicación si está publicado', () => {
      const product = createMockProduct({ published: true })
      render(<ProductCreatePage {...defaultProps} initial={product} />)
      const checkbox = screen.getByLabelText(
        'Mostrar en mi catálogo público',
      ) as HTMLInputElement
      expect(checkbox.checked).toBe(true)
    })
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
      const modal = screen.getByRole('dialog')
      const cancelBtn = Array.from(modal.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Cancelar'),
      )!
      await user.click(cancelBtn)
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

  describe('Opciones en modal', () => {
    it('debería mostrar selects de tipo y valor al agregar opción', async () => {
      const user = userEvent.setup()
      render(<ProductCreatePage {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Añadir variante' }))
      await user.click(screen.getByText('Agregar opción'))
      const typeSelect = screen.getByRole('button', { name: /tipo/i })
      const valueSelect = screen.getByRole('button', { name: /valor/i })
      expect(typeSelect).toBeInTheDocument()
      expect(valueSelect).toBeInTheDocument()
    })

    it('debería habilitar select de valor al elegir tipo', async () => {
      const user = userEvent.setup()
      render(<ProductCreatePage {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Añadir variante' }))
      await user.click(screen.getByText('Agregar opción'))

      const modal = screen.getByRole('dialog')
      const triggers = modal.querySelectorAll('.custom-select-trigger')
      const typeSelect = triggers[0] as HTMLButtonElement
      const valueSelect = triggers[1] as HTMLButtonElement

      // Value select should be disabled initially
      expect(valueSelect).toBeDisabled()

      // Select a type
      await user.click(typeSelect)
      await user.click(screen.getByRole('option', { name: 'Color' }))

      // Value select should now be enabled
      expect(valueSelect).not.toBeDisabled()
    })
  })

  describe('Vista previa', () => {
    it('debería mostrar "Sin imagen" cuando no hay URL', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByText('Sin imagen')).toBeInTheDocument()
    })

    it('debería mostrar categoría en vista previa', () => {
      render(<ProductCreatePage {...defaultProps} />)
      const items = screen.getAllByText('Sin categoría')
      expect(items.length).toBeGreaterThanOrEqual(1)
    })
  })
})
