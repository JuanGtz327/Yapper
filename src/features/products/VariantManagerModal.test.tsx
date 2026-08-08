import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VariantManagerModal } from './VariantManagerModal'
import type { Variant } from '../../types.ts'

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
      { id: 'ov3', name: 'S' },
      { id: 'ov4', name: 'M' },
      { id: 'ov5', name: 'L' },
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

const defaultProps = {
  variant: null,
  optionTypes: mockOptionTypes,
  onClose: vi.fn(),
  onSave: vi.fn().mockResolvedValue(undefined),
}

describe('VariantManagerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado - Nueva variante', () => {
    it('debería mostrar título "Añadir variante" para nueva variante', () => {
      render(<VariantManagerModal {...defaultProps} />)
      expect(screen.getByRole('heading', { name: 'Añadir variante' })).toBeInTheDocument()
    })

    it('debería mostrar campo de SKU', () => {
      render(<VariantManagerModal {...defaultProps} />)
      expect(screen.getByLabelText('SKU')).toBeInTheDocument()
    })

    it('debería mostrar campo de nombre de variante', () => {
      render(<VariantManagerModal {...defaultProps} />)
      expect(screen.getByLabelText('Nombre de variante')).toBeInTheDocument()
    })

    it('debería mostrar campo de precio de venta', () => {
      render(<VariantManagerModal {...defaultProps} />)
      expect(screen.getByLabelText('Precio de venta')).toBeInTheDocument()
    })

    it('debería mostrar campo de costo de inventario', () => {
      render(<VariantManagerModal {...defaultProps} />)
      expect(screen.getByLabelText('Costo de inventario')).toBeInTheDocument()
    })

    it('debería mostrar campo de existencias', () => {
      render(<VariantManagerModal {...defaultProps} />)
      expect(screen.getByLabelText('Existencias')).toBeInTheDocument()
    })

    it('debería mostrar botón de guardar variante', () => {
      render(<VariantManagerModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /añadir variante/i })).toBeInTheDocument()
    })

    it('debería mostrar botón de cancelar', () => {
      render(<VariantManagerModal {...defaultProps} />)
      expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })
  })

  describe('Renderizado - Editar variante', () => {
    it('debería mostrar título "Editar variante" para variante existente', () => {
      const variant = createMockVariant()
      render(<VariantManagerModal {...defaultProps} variant={variant} />)
      expect(screen.getByText('Editar variante')).toBeInTheDocument()
    })

    it('debería poblar el campo SKU con el valor existente', () => {
      const variant = createMockVariant()
      render(<VariantManagerModal {...defaultProps} variant={variant} />)
      const input = screen.getByLabelText('SKU') as HTMLInputElement
      expect(input.value).toBe('PLA-BAS-NEG')
    })

    it('debería poblar el campo nombre con el valor existente', () => {
      const variant = createMockVariant()
      render(<VariantManagerModal {...defaultProps} variant={variant} />)
      const input = screen.getByLabelText('Nombre de variante') as HTMLInputElement
      expect(input.value).toBe('Negro')
    })

    it('debería poblar el campo precio con el valor existente', () => {
      const variant = createMockVariant()
      render(<VariantManagerModal {...defaultProps} variant={variant} />)
      const input = screen.getByLabelText('Precio de venta') as HTMLInputElement
      expect(input.value).toBe('150')
    })

    it('debería poblar el campo existencias con el valor existente', () => {
      const variant = createMockVariant()
      render(<VariantManagerModal {...defaultProps} variant={variant} />)
      const input = screen.getByLabelText('Existencias') as HTMLInputElement
      expect(input.value).toBe('25')
    })
  })

  describe('Opciones de producto', () => {
    it('debería mostrar las opciones de producto cuando hay optionTypes', () => {
      render(<VariantManagerModal {...defaultProps} />)
      expect(screen.getByText('Opciones')).toBeInTheDocument()
    })

    it('debería mostrar los tipos de opción disponibles', () => {
      render(<VariantManagerModal {...defaultProps} />)
      expect(screen.getByText('Color')).toBeInTheDocument()
      expect(screen.getByText('Talla')).toBeInTheDocument()
    })

    it('debería mostrar los valores para cada tipo de opción', () => {
      render(<VariantManagerModal {...defaultProps} />)
      expect(screen.getByText('Negro')).toBeInTheDocument()
      expect(screen.getByText('Blanco')).toBeInTheDocument()
      expect(screen.getByText('S')).toBeInTheDocument()
      expect(screen.getByText('M')).toBeInTheDocument()
      expect(screen.getByText('L')).toBeInTheDocument()
    })

    it('debería incluir opción "Sin selección" para cada tipo', () => {
      render(<VariantManagerModal {...defaultProps} />)
      const sinSeleccion = screen.getAllByText('Sin selección')
      expect(sinSeleccion.length).toBe(2) // Un option por cada tipo
    })

    it('debería cambiar la selección de opción', () => {
      render(<VariantManagerModal {...defaultProps} />)
      const selects = screen.getAllByRole('combobox')
      const colorSelect = selects[0] // Primer select es Color
      fireEvent.change(colorSelect, { target: { value: 'ov1' } })
      expect((colorSelect as HTMLSelectElement).value).toBe('ov1')
    })
  })

  describe('Formulario - Envío', () => {
    it('debería llamar a onSave con los datos correctos al enviar', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      render(<VariantManagerModal {...defaultProps} onSave={onSave} />)

      fireEvent.change(screen.getByLabelText('SKU'), {
        target: { value: 'NUE-VAR-001' },
      })
      fireEvent.change(screen.getByLabelText('Precio de venta'), {
        target: { value: '200' },
      })
      fireEvent.change(screen.getByLabelText('Existencias'), {
        target: { value: '50' },
      })

      fireEvent.click(screen.getByRole('button', { name: /añadir variante/i }))

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith({
          sku: 'NUE-VAR-001',
          name: '',
          inventoryCost: 0,
          salePrice: 200,
          stock: 50,
          optionValueIds: [],
        })
      })
    })

    it('debería incluir optionValueIds seleccionados al enviar', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      render(<VariantManagerModal {...defaultProps} onSave={onSave} />)

      fireEvent.change(screen.getByLabelText('SKU'), {
        target: { value: 'NUE-VAR-001' },
      })
      fireEvent.change(screen.getByLabelText('Precio de venta'), {
        target: { value: '200' },
      })
      fireEvent.change(screen.getByLabelText('Existencias'), {
        target: { value: '50' },
      })

      // Seleccionar Color: Negro
      const selects = screen.getAllByRole('combobox')
      fireEvent.change(selects[0], { target: { value: 'ov1' } })

      fireEvent.click(screen.getByRole('button', { name: /añadir variante/i }))

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            optionValueIds: ['ov1'],
          }),
        )
      })
    })

    it('debería mostrar "Guardando..." durante el envío', async () => {
      const onSave = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      )
      render(<VariantManagerModal {...defaultProps} onSave={onSave} />)

      fireEvent.change(screen.getByLabelText('SKU'), {
        target: { value: 'NUE-VAR-001' },
      })
      fireEvent.change(screen.getByLabelText('Precio de venta'), {
        target: { value: '200' },
      })
      fireEvent.change(screen.getByLabelText('Existencias'), {
        target: { value: '50' },
      })

      fireEvent.click(screen.getByRole('button', { name: /añadir variante/i }))

      await waitFor(() => {
        expect(screen.getByText('Guardando...')).toBeInTheDocument()
      })
    })

    it('debería deshabilitar el botón durante el envío', async () => {
      const onSave = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      )
      render(<VariantManagerModal {...defaultProps} onSave={onSave} />)

      fireEvent.change(screen.getByLabelText('SKU'), {
        target: { value: 'NUE-VAR-001' },
      })
      fireEvent.change(screen.getByLabelText('Precio de venta'), {
        target: { value: '200' },
      })
      fireEvent.change(screen.getByLabelText('Existencias'), {
        target: { value: '50' },
      })

      const submitButton = screen.getByRole('button', { name: /añadir variante/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Validación', () => {
    it('debería requerir SKU', async () => {
      const onSave = vi.fn()
      render(<VariantManagerModal {...defaultProps} onSave={onSave} />)

      fireEvent.change(screen.getByLabelText('Precio de venta'), {
        target: { value: '200' },
      })
      fireEvent.change(screen.getByLabelText('Existencias'), {
        target: { value: '50' },
      })

      fireEvent.click(screen.getByRole('button', { name: /añadir variante/i }))

      await waitFor(() => {
        expect(onSave).not.toHaveBeenCalled()
      })
    })

    it('debería requerir precio de venta válido', async () => {
      const onSave = vi.fn()
      render(<VariantManagerModal {...defaultProps} onSave={onSave} />)

      fireEvent.change(screen.getByLabelText('SKU'), {
        target: { value: 'NUE-VAR-001' },
      })
      fireEvent.change(screen.getByLabelText('Precio de venta'), {
        target: { value: '-10' },
      })
      fireEvent.change(screen.getByLabelText('Existencias'), {
        target: { value: '50' },
      })

      fireEvent.click(screen.getByRole('button', { name: /añadir variante/i }))

      await waitFor(() => {
        expect(onSave).not.toHaveBeenCalled()
      })
    })

    it('debería requerir existencias no negativas', async () => {
      const onSave = vi.fn()
      render(<VariantManagerModal {...defaultProps} onSave={onSave} />)

      fireEvent.change(screen.getByLabelText('SKU'), {
        target: { value: 'NUE-VAR-001' },
      })
      fireEvent.change(screen.getByLabelText('Precio de venta'), {
        target: { value: '200' },
      })
      fireEvent.change(screen.getByLabelText('Existencias'), {
        target: { value: '-5' },
      })

      fireEvent.click(screen.getByRole('button', { name: /añadir variante/i }))

      await waitFor(() => {
        expect(onSave).not.toHaveBeenCalled()
      })
    })
  })

  describe('Cierre del modal', () => {
    it('debería llamar a onClose al hacer clic en cancelar', () => {
      const onClose = vi.fn()
      render(<VariantManagerModal {...defaultProps} onClose={onClose} />)
      fireEvent.click(screen.getByText('Cancelar'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('debería llamar a onClose al hacer clic en el botón de cerrar del modal', () => {
      const onClose = vi.fn()
      render(<VariantManagerModal {...defaultProps} onClose={onClose} />)
      const closeButton = screen.getByLabelText('Cerrar')
      fireEvent.click(closeButton)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Manejo de errores', () => {
    it('debería mostrar error cuando onSave falla', async () => {
      const onSave = vi.fn().mockRejectedValue(new Error('Error de prueba'))
      render(<VariantManagerModal {...defaultProps} onSave={onSave} />)

      fireEvent.change(screen.getByLabelText('SKU'), {
        target: { value: 'NUE-VAR-001' },
      })
      fireEvent.change(screen.getByLabelText('Precio de venta'), {
        target: { value: '200' },
      })
      fireEvent.change(screen.getByLabelText('Existencias'), {
        target: { value: '50' },
      })

      fireEvent.click(screen.getByRole('button', { name: /añadir variante/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Error de prueba')
      })
    })

    it('debería mostrar error genérico cuando el error no es una instancia de Error', async () => {
      const onSave = vi.fn().mockRejectedValue('Error string')
      render(<VariantManagerModal {...defaultProps} onSave={onSave} />)

      fireEvent.change(screen.getByLabelText('SKU'), {
        target: { value: 'NUE-VAR-001' },
      })
      fireEvent.change(screen.getByLabelText('Precio de venta'), {
        target: { value: '200' },
      })
      fireEvent.change(screen.getByLabelText('Existencias'), {
        target: { value: '50' },
      })

      fireEvent.click(screen.getByRole('button', { name: /añadir variante/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'No pudimos guardar la variante.',
        )
      })
    })

    it('debería restaurar el botón después de un error', async () => {
      const onSave = vi.fn().mockRejectedValue(new Error('Error'))
      render(<VariantManagerModal {...defaultProps} onSave={onSave} />)

      fireEvent.change(screen.getByLabelText('SKU'), {
        target: { value: 'NUE-VAR-001' },
      })
      fireEvent.change(screen.getByLabelText('Precio de venta'), {
        target: { value: '200' },
      })
      fireEvent.change(screen.getByLabelText('Existencias'), {
        target: { value: '50' },
      })

      const submitButton = screen.getByRole('button', { name: /añadir variante/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })
  })
})
