import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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
      render(<ClientModal {...defaultProps} />)
      expect(screen.getByText('Nuevo cliente')).toBeInTheDocument()
    })

    it('debería mostrar el título "Editar cliente" cuando se edita un cliente existente', () => {
      render(<ClientModal {...defaultProps} initial={mockClient} />)
      expect(screen.getByText('Editar cliente')).toBeInTheDocument()
    })

    it('debería mostrar los campos del formulario', () => {
      render(<ClientModal {...defaultProps} />)
      expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument()
      expect(screen.getByLabelText('Teléfono')).toBeInTheDocument()
      expect(screen.getByLabelText('Zona o colonia')).toBeInTheDocument()
    })

    it('debería mostrar el botón de guardar', () => {
      render(<ClientModal {...defaultProps} />)
      expect(
        screen.getByRole('button', { name: /guardar cliente/i }),
      ).toBeInTheDocument()
    })

    it('debería mostrar el botón de cancelar', () => {
      render(<ClientModal {...defaultProps} />)
      expect(
        screen.getByRole('button', { name: /cancelar/i }),
      ).toBeInTheDocument()
    })
  })

  describe('población de campos al editar', () => {
    it('debería rellenar el nombre con el valor del cliente', () => {
      render(<ClientModal {...defaultProps} initial={mockClient} />)
      const nameInput = screen.getByLabelText('Nombre completo')
      expect(nameInput).toHaveValue('Mariana González')
    })

    it('debería rellenar el teléfono con el valor del cliente', () => {
      render(<ClientModal {...defaultProps} initial={mockClient} />)
      const phoneInput = screen.getByLabelText('Teléfono')
      expect(phoneInput).toHaveValue('55 1234 5678')
    })

    it('debería rellenar la zona con el valor del cliente', () => {
      render(<ClientModal {...defaultProps} initial={mockClient} />)
      const zoneInput = screen.getByLabelText('Zona o colonia')
      expect(zoneInput).toHaveValue('Coyoacán')
    })

    it('debería dejar los campos vacíos cuando se crea un cliente nuevo', () => {
      render(<ClientModal {...defaultProps} />)
      expect(screen.getByLabelText('Nombre completo')).toHaveValue('')
      expect(screen.getByLabelText('Teléfono')).toHaveValue('')
      expect(screen.getByLabelText('Zona o colonia')).toHaveValue('')
    })
  })

  describe('validación del formulario', () => {
    it('debería tener el atributo required en el campo de nombre', () => {
      render(<ClientModal {...defaultProps} />)
      const nameInput = screen.getByLabelText('Nombre completo')
      expect(nameInput).toBeRequired()
    })

    it('debería tener un placeholder descriptivo en el campo de nombre', () => {
      render(<ClientModal {...defaultProps} />)
      const nameInput = screen.getByLabelText('Nombre completo')
      expect(nameInput).toHaveAttribute('placeholder', 'Ej. Mariana González')
    })
  })

  describe('cierre del modal', () => {
    it('debería llamar a onClose al hacer clic en el botón de cerrar del modal', () => {
      const onClose = vi.fn()
      render(<ClientModal {...defaultProps} onClose={onClose} />)
      fireEvent.click(screen.getByRole('button', { name: /cerrar/i }))
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('envío del formulario', () => {
    it('debería llamar a onSubmit al enviar el formulario', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      render(<ClientModal {...defaultProps} onSubmit={onSubmit} />)
      const form = document.querySelector('form')!

      fireEvent.submit(form)

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1)
      })
    })

    it('debería pasar el evento del formulario a onSubmit', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      render(<ClientModal {...defaultProps} onSubmit={onSubmit} />)
      const form = document.querySelector('form')!

      fireEvent.submit(form)

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'submit' }),
        )
      })
    })

    it('debería mostrar "Guardando..." durante el envío', async () => {
      let resolveSubmit: () => void
      const slowSubmit = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSubmit = resolve
          }),
      )
      render(<ClientModal {...defaultProps} onSubmit={slowSubmit} />)
      const form = document.querySelector('form')!

      await act(async () => {
        fireEvent.submit(form)
      })

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /guardando/i }),
        ).toBeInTheDocument()
      })

      resolveSubmit!()
    })

    it('debería deshabilitar el botón de guardar durante el envío', async () => {
      let resolveSubmit: () => void
      const slowSubmit = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSubmit = resolve
          }),
      )
      render(<ClientModal {...defaultProps} onSubmit={slowSubmit} />)
      const form = document.querySelector('form')!

      await act(async () => {
        fireEvent.submit(form)
      })

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /guardando/i }),
        ).toBeDisabled()
      })

      resolveSubmit!()
    })

    it('debería restaurar el botón después de completar el envío', async () => {
      const quickSubmit = vi.fn().mockResolvedValue(undefined)
      render(<ClientModal {...defaultProps} onSubmit={quickSubmit} />)
      const form = document.querySelector('form')!

      fireEvent.submit(form)

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

  describe('accesibilidad', () => {
    it('debería tener labels asociados a cada campo de entrada', () => {
      render(<ClientModal {...defaultProps} />)
      expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument()
      expect(screen.getByLabelText('Teléfono')).toBeInTheDocument()
      expect(screen.getByLabelText('Zona o colonia')).toBeInTheDocument()
    })

    it('debería tener el atributo aria-hidden en el ícono del botón guardar', () => {
      render(<ClientModal {...defaultProps} />)
      const icon = screen
        .getByRole('button', { name: /guardar cliente/i })
        .querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
