import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Client } from '../../types.ts'
import { ClientModal } from './ClientModal.tsx'

// ─── Datos de prueba ─────────────────────────────────────────

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
})
