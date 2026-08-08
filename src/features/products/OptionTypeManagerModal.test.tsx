import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OptionTypeManagerModal } from './OptionTypeManagerModal'
import * as repository from '../../lib/repository.ts'

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

  describe('Renderizado', () => {
    it('debería mostrar el título "Opciones de producto"', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)
      expect(screen.getByText('Opciones de producto')).toBeInTheDocument()
    })

    it('debería mostrar la descripción', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)
      expect(
        screen.getByText(/Crea tipos como Color, Talla o Capacidad/),
      ).toBeInTheDocument()
    })

    it('debería mostrar el campo de entrada para nuevo tipo', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)
      expect(
        screen.getByPlaceholderText('Nuevo tipo (ej. Color, Talla)...'),
      ).toBeInTheDocument()
    })

    it('debería mostrar el botón de añadir tipo', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)
      expect(screen.getByText('Añadir')).toBeInTheDocument()
    })

    it('debería mostrar la lista de tipos de opción', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)
      expect(screen.getByText('Color')).toBeInTheDocument()
      expect(screen.getByText('Talla')).toBeInTheDocument()
    })

    it('debería mostrar la cantidad de valores por tipo', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)
      // Color tiene 2 valores, Talla tiene 2 valores
      const valores = screen.getAllByText(/valores/)
      expect(valores.length).toBeGreaterThan(0)
    })
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
      vi.mocked(repository.createOptionType).mockImplementation(createOptionType)

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
      vi.mocked(repository.createOptionType).mockImplementation(createOptionType)
      const onRefresh = vi.fn()

      render(
        <OptionTypeManagerModal {...defaultProps} onRefresh={onRefresh} />,
      )

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
      vi.mocked(repository.createOptionType).mockImplementation(createOptionType)

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
      vi.mocked(repository.createOptionType).mockImplementation(createOptionType)

      render(<OptionTypeManagerModal {...defaultProps} />)

      const input = screen.getByPlaceholderText(
        'Nuevo tipo (ej. Color, Talla)...',
      )
      fireEvent.change(input, { target: { value: 'Nuevo tipo' } })

      fireEvent.click(screen.getByText('Añadir'))

      await waitFor(() => {
        expect(
          screen.getByText('No pudimos crear el tipo de opción.'),
        ).toBeInTheDocument()
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
      vi.mocked(repository.deleteOptionType).mockImplementation(deleteOptionType)

      render(<OptionTypeManagerModal {...defaultProps} />)

      fireEvent.click(screen.getByLabelText('Eliminar Color'))

      await waitFor(() => {
        expect(deleteOptionType).toHaveBeenCalledWith('ot1')
      })
    })

    it('debería llamar a onRefresh después de eliminar', async () => {
      const deleteOptionType = vi.fn().mockResolvedValue(undefined)
      vi.mocked(repository.deleteOptionType).mockImplementation(deleteOptionType)
      const onRefresh = vi.fn()

      render(
        <OptionTypeManagerModal {...defaultProps} onRefresh={onRefresh} />,
      )

      fireEvent.click(screen.getByLabelText('Eliminar Color'))

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledTimes(1)
      })
    })

    it('debería mostrar error cuando deleteOptionType falla', async () => {
      const deleteOptionType = vi.fn().mockRejectedValue(new Error('DB error'))
      vi.mocked(repository.deleteOptionType).mockImplementation(deleteOptionType)

      render(<OptionTypeManagerModal {...defaultProps} />)

      fireEvent.click(screen.getByLabelText('Eliminar Color'))

      await waitFor(() => {
        expect(
          screen.getByText('No pudimos eliminar el tipo de opción.'),
        ).toBeInTheDocument()
      })
    })
  })

  describe('Gestión de valores', () => {
    it('debería expandir el tipo de opción al hacer clic', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)

      fireEvent.click(screen.getByText('Color'))

      expect(screen.getByText('Negro')).toBeInTheDocument()
      expect(screen.getByText('Blanco')).toBeInTheDocument()
    })

    it('debería colapsar el tipo de opción al hacer clic nuevamente', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)

      fireEvent.click(screen.getByText('Color'))
      expect(screen.getByText('Negro')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Color'))
      expect(screen.queryByText('Negro')).not.toBeInTheDocument()
    })

    it('debería mostrar campo de entrada de valor cuando está expandido', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)

      fireEvent.click(screen.getByText('Color'))

      expect(
        screen.getByPlaceholderText('Nuevo valor...'),
      ).toBeInTheDocument()
    })

    it('debería llamar a createOptionValue al agregar un valor', async () => {
      const createOptionValue = vi.fn().mockResolvedValue('new-ov-id')
      vi.mocked(repository.createOptionValue).mockImplementation(createOptionValue)

      render(<OptionTypeManagerModal {...defaultProps} />)

      fireEvent.click(screen.getByText('Color'))

      const input = screen.getByPlaceholderText('Nuevo valor...')
      fireEvent.change(input, { target: { value: 'Rojo' } })

      fireEvent.click(screen.getByText('', { selector: 'button[type="submit"]' }))

      await waitFor(() => {
        expect(createOptionValue).toHaveBeenCalledWith('ot1', 'Rojo')
      })
    })

    it('debería llamar a onRefresh después de agregar un valor', async () => {
      const createOptionValue = vi.fn().mockResolvedValue('new-ov-id')
      vi.mocked(repository.createOptionValue).mockImplementation(createOptionValue)
      const onRefresh = vi.fn()

      render(
        <OptionTypeManagerModal {...defaultProps} onRefresh={onRefresh} />,
      )

      fireEvent.click(screen.getByText('Color'))

      const input = screen.getByPlaceholderText('Nuevo valor...')
      fireEvent.change(input, { target: { value: 'Rojo' } })

      fireEvent.click(screen.getByText('', { selector: 'button[type="submit"]' }))

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledTimes(1)
      })
    })

    it('debería llamar a deleteOptionValue al eliminar un valor', async () => {
      const deleteOptionValue = vi.fn().mockResolvedValue(undefined)
      vi.mocked(repository.deleteOptionValue).mockImplementation(deleteOptionValue)

      render(<OptionTypeManagerModal {...defaultProps} />)

      fireEvent.click(screen.getByText('Color'))

      fireEvent.click(screen.getByLabelText('Eliminar Negro'))

      await waitFor(() => {
        expect(deleteOptionValue).toHaveBeenCalledWith('ov1')
      })
    })

    it('debería llamar a onRefresh después de eliminar un valor', async () => {
      const deleteOptionValue = vi.fn().mockResolvedValue(undefined)
      vi.mocked(repository.deleteOptionValue).mockImplementation(deleteOptionValue)
      const onRefresh = vi.fn()

      render(
        <OptionTypeManagerModal {...defaultProps} onRefresh={onRefresh} />,
      )

      fireEvent.click(screen.getByText('Color'))

      fireEvent.click(screen.getByLabelText('Eliminar Negro'))

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

  describe('Accesibilidad', () => {
    it('debería tener aria-label en el campo de entrada de tipo', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)
      expect(
        screen.getByLabelText('Nombre del tipo de opción'),
      ).toBeInTheDocument()
    })

    it('debería tener aria-expanded en el botón de tipo', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)

      const button = screen.getByText('Color').closest('button')
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('debería cambiar aria-expanded al expandir', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)

      const button = screen.getByText('Color').closest('button')
      fireEvent.click(button!)

      expect(button).toHaveAttribute('aria-expanded', 'true')
    })

    it('debería tener aria-label en botones de eliminar tipo', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)
      expect(screen.getByLabelText('Eliminar Color')).toBeInTheDocument()
      expect(screen.getByLabelText('Eliminar Talla')).toBeInTheDocument()
    })

    it('debería tener aria-label en botones de eliminar valor', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)

      fireEvent.click(screen.getByText('Color'))

      expect(screen.getByLabelText('Eliminar Negro')).toBeInTheDocument()
      expect(screen.getByLabelText('Eliminar Blanco')).toBeInTheDocument()
    })

    it('debería tener aria-label en campo de entrada de valor', () => {
      render(<OptionTypeManagerModal {...defaultProps} />)

      fireEvent.click(screen.getByText('Color'))

      expect(
        screen.getByLabelText('Nuevo valor para Color'),
      ).toBeInTheDocument()
    })
  })
})
