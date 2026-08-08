import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Client } from '../../types.ts'
import { ClientModal } from './ClientModal.tsx'

// ─── Datos de prueba ─────────────────────────────────────────

const mockClient: Client = {
  id: 'client-abc',
  name: 'Mariana González',
  phone: '55 1234 5678',
  zone: 'Coyoacán',
  orders: 3,
  initials: 'MG',
}

// ─── Tests ───────────────────────────────────────────────────

describe('ClientModal', () => {
  const defaultProps = {
    initial: null as Client | null,
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('renderizado', () => {
    it('debería mostrar el título "Nuevo cliente" cuando no hay datos iniciales', () => {
      // Arrange & Act
      render(<ClientModal {...defaultProps} />)

      // Assert
      expect(screen.getByText('Nuevo cliente')).toBeInTheDocument()
    })

    it('debería mostrar el título "Editar cliente" cuando se edita un cliente existente', () => {
      // Arrange & Act
      render(<ClientModal {...defaultProps} initial={mockClient} />)

      // Assert
      expect(screen.getByText('Editar cliente')).toBeInTheDocument()
    })

    it('debería mostrar los campos del formulario', () => {
      // Arrange & Act
      render(<ClientModal {...defaultProps} />)

      // Assert
      expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument()
      expect(screen.getByLabelText('Teléfono')).toBeInTheDocument()
      expect(screen.getByLabelText('Zona o colonia')).toBeInTheDocument()
    })

    it('debería mostrar el botón de guardar', () => {
      // Arrange & Act
      render(<ClientModal {...defaultProps} />)

      // Assert
      expect(
        screen.getByRole('button', { name: /guardar cliente/i }),
      ).toBeInTheDocument()
    })

    it('debería mostrar el botón de cancelar', () => {
      // Arrange & Act
      render(<ClientModal {...defaultProps} />)

      // Assert
      expect(
        screen.getByRole('button', { name: /cancelar/i }),
      ).toBeInTheDocument()
    })
  })

  describe('población de campos al editar', () => {
    it('debería rellenar el nombre con el valor del cliente', () => {
      // Arrange & Act
      render(<ClientModal {...defaultProps} initial={mockClient} />)

      // Assert
      const nameInput = screen.getByLabelText('Nombre completo')
      expect(nameInput).toHaveValue('Mariana González')
    })

    it('debería rellenar el teléfono con el valor del cliente', () => {
      // Arrange & Act
      render(<ClientModal {...defaultProps} initial={mockClient} />)

      // Assert
      const phoneInput = screen.getByLabelText('Teléfono')
      expect(phoneInput).toHaveValue('55 1234 5678')
    })

    it('debería rellenar la zona con el valor del cliente', () => {
      // Arrange & Act
      render(<ClientModal {...defaultProps} initial={mockClient} />)

      // Assert
      const zoneInput = screen.getByLabelText('Zona o colonia')
      expect(zoneInput).toHaveValue('Coyoacán')
    })

    it('debería dejar los campos vacíos cuando se crea un cliente nuevo', () => {
      // Arrange & Act
      render(<ClientModal {...defaultProps} />)

      // Assert
      expect(screen.getByLabelText('Nombre completo')).toHaveValue('')
      expect(screen.getByLabelText('Teléfono')).toHaveValue('')
      expect(screen.getByLabelText('Zona o colonia')).toHaveValue('')
    })
  })

  describe('validación del formulario', () => {
    it('debería tener el atributo required en el campo de nombre', () => {
      // Arrange & Act
      render(<ClientModal {...defaultProps} />)

      // Assert
      const nameInput = screen.getByLabelText('Nombre completo')
      expect(nameInput).toBeRequired()
    })

    it('debería tener un placeholder descriptivo en el campo de nombre', () => {
      // Arrange & Act
      render(<ClientModal {...defaultProps} />)

      // Assert
      const nameInput = screen.getByLabelText('Nombre completo')
      expect(nameInput).toHaveAttribute(
        'placeholder',
        'Ej. Mariana González',
      )
    })
  })

  describe('cierre del modal', () => {
    it('debería llamar a onClose al hacer clic en cancelar', () => {
      // Arrange
      const onClose = vi.fn()
      render(<ClientModal {...defaultProps} onClose={onClose} />)

      // Act
      fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

      // Assert
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('debería llamar a onClose al hacer clic en el botón de cerrar del modal', () => {
      // Arrange
      const onClose = vi.fn()
      render(<ClientModal {...defaultProps} onClose={onClose} />)

      // Act
      fireEvent.click(screen.getByRole('button', { name: /cerrar/i }))

      // Assert
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('envío del formulario', () => {
    it('debería llamar a onSubmit al enviar el formulario', async () => {
      // Arrange
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      render(<ClientModal {...defaultProps} onSubmit={onSubmit} />)
      const form = document.querySelector('form')!

      // Act
      fireEvent.submit(form)

      // Assert
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1)
      })
    })

    it('debería pasar el evento del formulario a onSubmit', async () => {
      // Arrange
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      render(<ClientModal {...defaultProps} onSubmit={onSubmit} />)
      const form = document.querySelector('form')!

      // Act
      fireEvent.submit(form)

      // Assert
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'submit' }),
        )
      })
    })

    it('debería mostrar "Guardando..." durante el envío', async () => {
      // Arrange
      let resolveSubmit: () => void
      const slowSubmit = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSubmit = resolve
          }),
      )
      render(<ClientModal {...defaultProps} onSubmit={slowSubmit} />)
      const form = document.querySelector('form')!

      // Act
      await act(async () => {
        fireEvent.submit(form)
      })

      // Assert
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /guardando/i }),
        ).toBeInTheDocument()
      })

      // Cleanup
      resolveSubmit!()
    })

    it('debería deshabilitar el botón de guardar durante el envío', async () => {
      // Arrange
      let resolveSubmit: () => void
      const slowSubmit = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSubmit = resolve
          }),
      )
      render(<ClientModal {...defaultProps} onSubmit={slowSubmit} />)
      const form = document.querySelector('form')!

      // Act
      await act(async () => {
        fireEvent.submit(form)
      })

      // Assert
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /guardando/i }),
        ).toBeDisabled()
      })

      // Cleanup
      resolveSubmit!()
    })

    it('debería restaurar el botón después de completar el envío', async () => {
      // Arrange
      const quickSubmit = vi.fn().mockResolvedValue(undefined)
      render(<ClientModal {...defaultProps} onSubmit={quickSubmit} />)
      const form = document.querySelector('form')!

      // Act
      fireEvent.submit(form)

      // Assert
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /guardar cliente/i }),
        ).toBeInTheDocument()
      })
      expect(
        screen.queryByRole('button', { name: /guardando/i }),
      ).not.toBeInTheDocument()
    })
  })

  describe('manejo de errores', () => {
    it('debería mostrar el mensaje de error cuando onSubmit falla con un Error', async () => {
      // Arrange
      const onSubmit = vi
        .fn()
        .mockRejectedValue(new Error('Nombre demasiado corto'))
      render(<ClientModal {...defaultProps} onSubmit={onSubmit} />)
      const form = document.querySelector('form')!

      // Act
      fireEvent.submit(form)

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Nombre demasiado corto',
        )
      })
    })

    it('debería mostrar mensaje predeterminado cuando onSubmit falla con un error no-Error', async () => {
      // Arrange
      const onSubmit = vi.fn().mockRejectedValue('error desconocido')
      render(<ClientModal {...defaultProps} onSubmit={onSubmit} />)
      const form = document.querySelector('form')!

      // Act
      fireEvent.submit(form)

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'No pudimos guardar el cliente.',
        )
      })
    })

    it('debería ocultar el error anterior al enviar exitosamente después de un error', async () => {
      // Arrange
      const onSubmit = vi
        .fn()
        .mockRejectedValueOnce(new Error('Primer error'))
        .mockResolvedValueOnce(undefined)
      render(<ClientModal {...defaultProps} onSubmit={onSubmit} />)
      const form = document.querySelector('form')!

      // Act - Primer envío con error
      fireEvent.submit(form)
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Act - Segundo envío exitoso
      fireEvent.submit(form)
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })

    it('debería restaurar el botón después de un error', async () => {
      // Arrange
      const onSubmit = vi.fn().mockRejectedValue(new Error('Falló'))
      render(<ClientModal {...defaultProps} onSubmit={onSubmit} />)
      const form = document.querySelector('form')!

      // Act
      fireEvent.submit(form)

      // Assert
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /guardar cliente/i }),
        ).toBeInTheDocument()
      })
      expect(
        screen.queryByRole('button', { name: /guardando/i }),
      ).not.toBeInTheDocument()
    })

    it('debería limpiar el error al iniciar un nuevo envío', async () => {
      // Arrange
      const onSubmit = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce(undefined)
      render(<ClientModal {...defaultProps} onSubmit={onSubmit} />)
      const form = document.querySelector('form')!

      // Act - Primer envío con error
      fireEvent.submit(form)
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Act - Segundo envío
      fireEvent.submit(form)

      // Assert - El error desaparece inmediatamente al iniciar
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('accesibilidad', () => {
    it('debería tener un campo de entrada con role alert para errores', async () => {
      // Arrange
      const onSubmit = vi.fn().mockRejectedValue(new Error('Error'))
      render(<ClientModal {...defaultProps} onSubmit={onSubmit} />)
      const form = document.querySelector('form')!

      // Act
      fireEvent.submit(form)

      // Assert
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
      })
    })

    it('debería tener labels asociados a cada campo de entrada', () => {
      // Arrange & Act
      render(<ClientModal {...defaultProps} />)

      // Assert
      expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument()
      expect(screen.getByLabelText('Teléfono')).toBeInTheDocument()
      expect(screen.getByLabelText('Zona o colonia')).toBeInTheDocument()
    })

    it('debería tener el atributo aria-hidden en el ícono del botón guardar', () => {
      // Arrange & Act
      render(<ClientModal {...defaultProps} />)

      // Assert
      const icon = screen.getByRole('button', { name: /guardar cliente/i })
        .querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
