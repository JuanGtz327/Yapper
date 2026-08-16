import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OptionTypeManagerModal } from './OptionTypeManagerModal'
import * as repository from '../../lib/repository.ts'

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()

vi.mock('../../hooks/useToast.ts', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
  toastMessages: {
    optionType: {
      created: 'Tipo de opción creado.',
      deleted: 'Tipo de opción eliminado.',
    },
    optionValue: {
      created: 'Valor agregado.',
      deleted: 'Valor eliminado.',
    },
  },
}))

vi.mock('../../lib/repository.ts', () => ({
  createOptionType: vi.fn(),
  createOptionValue: vi.fn(),
  deleteOptionType: vi.fn(),
  deleteOptionValue: vi.fn(),
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
    ],
  },
]

const defaultProps = {
  optionTypes: mockOptionTypes,
  onRefresh: vi.fn(),
  onClose: vi.fn(),
}

describe('OptionTypeManagerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Estado vacío', () => {
    it('debería mostrar mensaje cuando no hay tipos de opción', () => {
      render(<OptionTypeManagerModal {...defaultProps} optionTypes={[]} />)
      expect(
        screen.getByText('No hay tipos de opción todavía'),
      ).toBeInTheDocument()
    })
  })

  describe('Creación de tipo de opción', () => {
    it('debería llamar a createOptionType al enviar el formulario', async () => {
      const createOptionType = vi.fn().mockResolvedValue('new-ot-id')
      vi.mocked(repository.createOptionType).mockImplementation(
        createOptionType,
      )

      render(<OptionTypeManagerModal {...defaultProps} />)

      const input = screen.getByPlaceholderText(
        'Nuevo tipo (ej. Color, Talla)...',
      )
      fireEvent.change(input, { target: { value: 'Nuevo tipo' } })

      fireEvent.click(screen.getByText('Añadir'))

      await waitFor(() => {
        expect(createOptionType).toHaveBeenCalledWith('Nuevo tipo')
      })
    })

    it('debería llamar a onRefresh después de crear', async () => {
      const createOptionType = vi.fn().mockResolvedValue('new-ot-id')
      vi.mocked(repository.createOptionType).mockImplementation(
        createOptionType,
      )
      const onRefresh = vi.fn()

      render(<OptionTypeManagerModal {...defaultProps} onRefresh={onRefresh} />)

      const input = screen.getByPlaceholderText(
        'Nuevo tipo (ej. Color, Talla)...',
      )
      fireEvent.change(input, { target: { value: 'Nuevo tipo' } })

      fireEvent.click(screen.getByText('Añadir'))

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledTimes(1)
      })
    })

    it('debería limpiar el campo después de crear exitosamente', async () => {
      const createOptionType = vi.fn().mockResolvedValue('new-ot-id')
      vi.mocked(repository.createOptionType).mockImplementation(
        createOptionType,
      )

      render(<OptionTypeManagerModal {...defaultProps} />)

      const input = screen.getByPlaceholderText(
        'Nuevo tipo (ej. Color, Talla)...',
      )
      fireEvent.change(input, { target: { value: 'Nuevo tipo' } })

      fireEvent.click(screen.getByText('Añadir'))

      await waitFor(() => {
        expect((input as HTMLInputElement).value).toBe('')
      })
    })

    it('debería mostrar error cuando createOptionType falla', async () => {
      const createOptionType = vi.fn().mockRejectedValue(new Error('DB error'))
      vi.mocked(repository.createOptionType).mockImplementation(
        createOptionType,
      )

      render(<OptionTypeManagerModal {...defaultProps} />)

      const input = screen.getByPlaceholderText(
        'Nuevo tipo (ej. Color, Talla)...',
      )
      fireEvent.change(input, { target: { value: 'Nuevo tipo' } })

      fireEvent.click(screen.getByText('Añadir'))

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          'No pudimos crear el tipo de opción.',
        )
      })
    })

    it('debería deshabilitar el botón cuando el nombre está vacío', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)

      const button = screen.getByText('Añadir')
      expect(button).toBeDisabled()
    })

    it('debería habilitar el botón cuando hay un nombre', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)

      const input = screen.getByPlaceholderText(
        'Nuevo tipo (ej. Color, Talla)...',
      )
      fireEvent.change(input, { target: { value: 'Nuevo' } })

      const button = screen.getByText('Añadir')
      expect(button).not.toBeDisabled()
    })
  })

  describe('Eliminación de tipo de opción', () => {
    it('debería llamar a deleteOptionType al hacer clic en eliminar', async () => {
      const deleteOptionType = vi.fn().mockResolvedValue(undefined)
      vi.mocked(repository.deleteOptionType).mockImplementation(
        deleteOptionType,
      )

      render(<OptionTypeManagerModal {...defaultProps} />)

      fireEvent.click(screen.getByLabelText('Eliminar Color'))

      fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

      await waitFor(() => {
        expect(deleteOptionType).toHaveBeenCalledWith('ot1')
      })
    })

    it('debería llamar a onRefresh después de eliminar', async () => {
      const deleteOptionType = vi.fn().mockResolvedValue(undefined)
      vi.mocked(repository.deleteOptionType).mockImplementation(
        deleteOptionType,
      )
      const onRefresh = vi.fn()

      render(<OptionTypeManagerModal {...defaultProps} onRefresh={onRefresh} />)

      fireEvent.click(screen.getByLabelText('Eliminar Color'))

      fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledTimes(1)
      })
    })

    it('debería mostrar error cuando deleteOptionType falla', async () => {
      const deleteOptionType = vi.fn().mockRejectedValue(new Error('DB error'))
      vi.mocked(repository.deleteOptionType).mockImplementation(
        deleteOptionType,
      )

      render(<OptionTypeManagerModal {...defaultProps} />)

      fireEvent.click(screen.getByLabelText('Eliminar Color'))

      fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          'No pudimos eliminar el tipo de opción.',
        )
      })
    })
  })

  describe('Gestión de valores', () => {
    it('debería llamar a createOptionValue al agregar un valor', async () => {
      const createOptionValue = vi.fn().mockResolvedValue('new-ov-id')
      vi.mocked(repository.createOptionValue).mockImplementation(
        createOptionValue,
      )

      render(<OptionTypeManagerModal {...defaultProps} />)

      fireEvent.click(screen.getByText('Color'))

      const input = screen.getByPlaceholderText('Nuevo valor...')
      fireEvent.change(input, { target: { value: 'Rojo' } })

      fireEvent.click(
        screen.getByText('', { selector: 'button[type="submit"]' }),
      )

      await waitFor(() => {
        expect(createOptionValue).toHaveBeenCalledWith('ot1', 'Rojo')
      })
    })

    it('debería llamar a onRefresh después de agregar un valor', async () => {
      const createOptionValue = vi.fn().mockResolvedValue('new-ov-id')
      vi.mocked(repository.createOptionValue).mockImplementation(
        createOptionValue,
      )
      const onRefresh = vi.fn()

      render(<OptionTypeManagerModal {...defaultProps} onRefresh={onRefresh} />)

      fireEvent.click(screen.getByText('Color'))

      const input = screen.getByPlaceholderText('Nuevo valor...')
      fireEvent.change(input, { target: { value: 'Rojo' } })

      fireEvent.click(
        screen.getByText('', { selector: 'button[type="submit"]' }),
      )

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledTimes(1)
      })
    })

    it('debería llamar a deleteOptionValue al eliminar un valor', async () => {
      const deleteOptionValue = vi.fn().mockResolvedValue(undefined)
      vi.mocked(repository.deleteOptionValue).mockImplementation(
        deleteOptionValue,
      )

      render(<OptionTypeManagerModal {...defaultProps} />)

      fireEvent.click(screen.getByText('Color'))

      fireEvent.click(screen.getByLabelText('Eliminar Negro'))

      fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

      await waitFor(() => {
        expect(deleteOptionValue).toHaveBeenCalledWith('ov1')
      })
    })

    it('debería llamar a onRefresh después de eliminar un valor', async () => {
      const deleteOptionValue = vi.fn().mockResolvedValue(undefined)
      vi.mocked(repository.deleteOptionValue).mockImplementation(
        deleteOptionValue,
      )
      const onRefresh = vi.fn()

      render(<OptionTypeManagerModal {...defaultProps} onRefresh={onRefresh} />)

      fireEvent.click(screen.getByText('Color'))

      fireEvent.click(screen.getByLabelText('Eliminar Negro'))

      fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledTimes(1)
      })
    })

    it('debería mostrar "Sin valores aún" cuando el tipo no tiene valores', () => {
      const optionTypes = [
        {
          id: 'ot1',
          name: 'Color',
          values: [],
        },
      ]
      render(
        <OptionTypeManagerModal {...defaultProps} optionTypes={optionTypes} />,
      )

      fireEvent.click(screen.getByText('Color'))

      expect(screen.getByText('Sin valores aún')).toBeInTheDocument()
    })
  })

  describe('Cierre del modal', () => {
    it('debería llamar a onClose al hacer clic en cerrar', () => {
      const onClose = vi.fn()
      render(<OptionTypeManagerModal {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByLabelText('Cerrar'))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})
