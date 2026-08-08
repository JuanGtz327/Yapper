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
]

const createMockVariant = (overrides = {}) => ({
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
  onSubmit: vi.fn().mockResolvedValue(true),
}

describe('ProductCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    it('debería mostrar sección de catálogo público', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByText('Catálogo público')).toBeInTheDocument()
    })

    it('debería mostrar checkbox de publicación', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(
        screen.getByLabelText('Mostrar en mi catálogo público'),
      ).toBeInTheDocument()
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

    it('debería mostrar resumen de variantes', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByText('RESUMEN')).toBeInTheDocument()
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

    it('debería poblar descripción pública existente', () => {
      const product = createMockProduct({
        publicDescription: 'Descripción de prueba',
      })
      render(<ProductCreatePage {...defaultProps} initial={product} />)
      const textarea = screen.getByLabelText(
        'Descripción pública',
      ) as HTMLTextAreaElement
      expect(textarea.value).toBe('Descripción de prueba')
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
    it('debería llamar a onClose al hacer clic en cancelar', () => {
      const onClose = vi.fn()
      render(<ProductCreatePage {...defaultProps} onClose={onClose} />)
      fireEvent.click(screen.getByText('Cancelar'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('debería llamar a onClose al hacer clic en volver', () => {
      const onClose = vi.fn()
      render(<ProductCreatePage {...defaultProps} onClose={onClose} />)
      fireEvent.click(screen.getByText('Volver'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Formulario - Creación', () => {
    it('debería enviar el draft al onSubmit', async () => {
      const onSubmit = vi.fn().mockResolvedValue(true)
      render(<ProductCreatePage {...defaultProps} onSubmit={onSubmit} />)

      const nameInput = screen.getByLabelText('Nombre del producto')
      fireEvent.change(nameInput, { target: { value: 'Nueva Playera' } })

      // Fill in variant SKU (required)
      fireEvent.click(screen.getByLabelText('Editar variante 1'))
      await waitFor(() => {
        expect(screen.getByLabelText('SKU')).toBeInTheDocument()
      })

      const skuInput = screen.getByLabelText('SKU')
      fireEvent.change(skuInput, { target: { value: 'NUE-PLA-001' } })

      const priceInput = screen.getByLabelText('Precio de venta')
      fireEvent.change(priceInput, { target: { value: '200' } })

      const stockInput = screen.getByLabelText('Existencias')
      fireEvent.change(stockInput, { target: { value: '50' } })

      // Click "Listo" to close variant editor
      fireEvent.click(screen.getByText('Listo'))

      // Submit
      fireEvent.click(screen.getByText('Crear producto'))

      // onSubmit should have been called
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Editor de variantes', () => {
    it('debería expandir variante al hacer clic en editar', async () => {
      render(<ProductCreatePage {...defaultProps} />)
      fireEvent.click(screen.getByLabelText('Editar variante 1'))
      await waitFor(() => {
        expect(screen.getByLabelText('SKU')).toBeInTheDocument()
      })
    })

    it('debería añadir una nueva variante', async () => {
      const user = userEvent.setup()
      render(<ProductCreatePage {...defaultProps} />)
      // Initially there should be one variant item
      const initialItems = screen.getAllByLabelText(/Editar variante/)
      expect(initialItems).toHaveLength(1)
      // Click the secondary-button that contains "Añadir variante"
      const addBtns = screen.getAllByRole('button', { name: /Añadir variante/ })
      await user.click(addBtns[0])
      // Now there should be two variant items
      const updatedItems = screen.getAllByLabelText(/Editar variante/)
      expect(updatedItems).toHaveLength(2)
    })

    it('debería cerrar editor de variante al hacer clic en Listo', async () => {
      render(<ProductCreatePage {...defaultProps} />)
      fireEvent.click(screen.getByLabelText('Editar variante 1'))
      await waitFor(() => {
        expect(screen.getByLabelText('SKU')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Listo'))
      await waitFor(() => {
        expect(
          screen.queryByLabelText('Nombre de la variante'),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Selección de categoría', () => {
    it('debería mostrar las categorías en el select', () => {
      render(<ProductCreatePage {...defaultProps} />)
      const select = screen.getByLabelText('Categoría') as HTMLSelectElement
      expect(select.options.length).toBe(3) // Sin categoría + 2
    })

    it('debería incluir opción "Sin categoría"', () => {
      render(<ProductCreatePage {...defaultProps} />)
      const items = screen.getAllByText('Sin categoría')
      expect(items.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Vista previa', () => {
    it('debería mostrar nombre del producto en vista previa', () => {
      render(<ProductCreatePage {...defaultProps} />)
      const items = screen.getAllByText('Nombre del producto')
      expect(items.length).toBeGreaterThanOrEqual(2) // label + preview
    })

    it('debería actualizar vista previa con nombre ingresado', () => {
      render(<ProductCreatePage {...defaultProps} />)
      const nameInput = screen.getByLabelText('Nombre del producto')
      fireEvent.change(nameInput, { target: { value: 'Mi Producto' } })
      expect(screen.getByText('Mi Producto')).toBeInTheDocument()
    })

    it('debería mostrar "Sin imagen" cuando no hay URL', () => {
      render(<ProductCreatePage {...defaultProps} />)
      expect(screen.getByText('Sin imagen')).toBeInTheDocument()
    })

    it('debería mostrar categoría en vista previa', () => {
      render(<ProductCreatePage {...defaultProps} />)
      const items = screen.getAllByText('Sin categoría')
      expect(items.length).toBeGreaterThanOrEqual(2) // select option + preview
    })
  })
})
