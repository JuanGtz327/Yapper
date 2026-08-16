import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VariantManagerModal } from './VariantManagerModal'

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()

vi.mock('../../hooks/useToast.ts', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
  toastMessages: {
    variant: {
      created: 'Variante guardada exitosamente.',
      updated: 'Variante actualizada exitosamente.',
      deleted: 'Variante eliminada.',
    },
  },
}))

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
      const onSave = vi
        .fn()
        .mockImplementation(
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
      const onSave = vi
        .fn()
        .mockImplementation(
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

      const submitButton = screen.getByRole('button', {
        name: /añadir variante/i,
      })
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
        expect(mockToastError).toHaveBeenCalledWith('Error de prueba')
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
        expect(mockToastError).toHaveBeenCalledWith(
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

      const submitButton = screen.getByRole('button', {
        name: /añadir variante/i,
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })
  })
})
