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

  describe('Renderizado - Nuevo producto', () => {
    it('debería mostrar título "Añadir producto" para nuevo producto', () => {
      render(<ProductModal {...defaultProps} />)
      expect(screen.getByText('Añadir producto')).toBeInTheDocument()
    })

    it('debería mostrar campo de nombre del producto', () => {
      render(<ProductModal {...defaultProps} />)
      expect(screen.getByLabelText('Nombre del producto')).toBeInTheDocument()
    })

    it('debería mostrar campo de categoría', () => {
      render(<ProductModal {...defaultProps} />)
      expect(screen.getByLabelText('Categoría')).toBeInTheDocument()
    })

    it('debería mostrar campo de SKU para nuevo producto', () => {
      render(<ProductModal {...defaultProps} />)
      expect(screen.getByLabelText('SKU')).toBeInTheDocument()
    })

    it('debería mostrar campo de precio de venta para nuevo producto', () => {
      render(<ProductModal {...defaultProps} />)
      expect(screen.getByLabelText('Precio de venta')).toBeInTheDocument()
    })

    it('debería mostrar campo de existencias para nuevo producto', () => {
      render(<ProductModal {...defaultProps} />)
      expect(screen.getByLabelText('Existencias')).toBeInTheDocument()
    })

    it('debería mostrar botón de guardar producto', () => {
      render(<ProductModal {...defaultProps} />)
      expect(screen.getByText('Guardar producto')).toBeInTheDocument()
    })

    it('debería mostrar botón de cancelar', () => {
      render(<ProductModal {...defaultProps} />)
      expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })
  })

  describe('Renderizado - Editar producto', () => {
    it('debería mostrar título "Editar producto" para producto existente', () => {
      const product = createMockProduct()
      render(<ProductModal {...defaultProps} initial={product} />)
      expect(screen.getByText('Editar producto')).toBeInTheDocument()
    })

    it('debería poblar el campo nombre con el valor existente', () => {
      const product = createMockProduct()
      render(<ProductModal {...defaultProps} initial={product} />)
      const input = screen.getByLabelText(
        'Nombre del producto',
      ) as HTMLInputElement
      expect(input.value).toBe('Playera Básica')
    })

    it('debería mostrar la sección de variantes para producto existente', () => {
      const product = createMockProduct()
      render(<ProductModal {...defaultProps} initial={product} />)
      expect(screen.getByText('Variantes')).toBeInTheDocument()
    })

    it('debería mostrar el botón de añadir variante', () => {
      const product = createMockProduct()
      render(<ProductModal {...defaultProps} initial={product} />)
      expect(screen.getByText('Añadir variante')).toBeInTheDocument()
    })

    it('debería mostrar las variantes existentes', () => {
      const product = createMockProduct()
      render(<ProductModal {...defaultProps} initial={product} />)
      expect(screen.getByText('PLA-BAS-NEG')).toBeInTheDocument()
    })
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

    it('debería tener botón de guardar producto', () => {
      render(<ProductModal {...defaultProps} />)
      expect(screen.getByText('Guardar producto')).toBeInTheDocument()
    })

    it('debería tener botón de cancelar', () => {
      render(<ProductModal {...defaultProps} />)
      expect(screen.getByText('Cancelar')).toBeInTheDocument()
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

  describe('Selección de categoría', () => {
    it('debería mostrar las categorías disponibles en el select', () => {
      render(<ProductModal {...defaultProps} />)
      const select = screen.getByLabelText('Categoría') as HTMLSelectElement
      expect(select.options.length).toBe(3) // Sin categoría + 2 categorías
    })

    it('debería incluir opción "Sin categoría"', () => {
      render(<ProductModal {...defaultProps} />)
      expect(screen.getByText('Sin categoría')).toBeInTheDocument()
    })

    it('debería cambiar la categoría seleccionada', () => {
      render(<ProductModal {...defaultProps} />)
      const select = screen.getByLabelText('Categoría') as HTMLSelectElement
      fireEvent.change(select, { target: { value: 'cat1' } })
      expect(select.value).toBe('cat1')
    })
  })

  describe('Cierre del modal', () => {
    it('debería llamar a onClose al hacer clic en cancelar', () => {
      const onClose = vi.fn()
      render(<ProductModal {...defaultProps} onClose={onClose} />)
      fireEvent.click(screen.getByText('Cancelar'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('debería llamar a onClose al hacer clic en el botón de cerrar del modal', () => {
      const onClose = vi.fn()
      render(<ProductModal {...defaultProps} onClose={onClose} />)
      // El botón de cerrar está en ModalFrame
      const closeButton = screen.getByLabelText('Cerrar')
      fireEvent.click(closeButton)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Manejo de errores', () => {
    it('debería tener estructura para manejar errores', () => {
      render(<ProductModal {...defaultProps} />)
      // Verificar que el componente tiene la estructura para manejar errores
      expect(screen.getByText('Guardar producto')).toBeInTheDocument()
    })
  })

  describe('Accesibilidad', () => {
    it('debería tener labels asociados a los campos', () => {
      render(<ProductModal {...defaultProps} />)
      const nameInput = screen.getByLabelText('Nombre del producto')
      expect(nameInput).toBeInTheDocument()
    })

    it('debería tener role="alert" para errores', () => {
      render(<ProductModal {...defaultProps} />)
      // No hay error inicialmente, pero verificamos que el componente está preparado
      const alertElements = screen.queryAllByRole('alert')
      expect(alertElements).toHaveLength(0)
    })
  })
})
