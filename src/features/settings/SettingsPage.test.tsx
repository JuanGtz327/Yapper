import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SettingsPage } from './SettingsPage'
import type { BusinessSettings } from '../../types.ts'

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()

vi.mock('../../hooks/useToast.ts', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
  toastMessages: {
    settings: { saved: 'Configuración guardada.' },
  },
}))

const defaultSettings: BusinessSettings = {
  businessName: 'Mi Negocio',
  currency: 'MXN',
  lowStockThreshold: 5,
  publicCatalogEnabled: true,
  publicSlug: 'mi-negocio',
  whatsappNumber: '55 1234 5678',
  publicIntro: 'Productos para ti',
}

const defaultProps = {
  settings: defaultSettings,
  onSave: vi.fn().mockResolvedValue(undefined),
  onSignOut: vi.fn().mockResolvedValue(undefined),
  onOpenOptionTypes: vi.fn(),
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Element.prototype.scrollIntoView = vi.fn()
  })

  describe('Renderizado', () => {
    it('debería renderizar el título de la página', () => {
      render(<SettingsPage {...defaultProps} />)
      expect(screen.getByText('Tu negocio')).toBeInTheDocument()
    })

    it('debería renderizar la sección de preferencias del negocio', () => {
      render(<SettingsPage {...defaultProps} />)
      expect(screen.getByText('Preferencias del negocio')).toBeInTheDocument()
    })

    it('debería renderizar la sección de cuenta', () => {
      render(<SettingsPage {...defaultProps} />)
      expect(screen.getByText('Sesión actual')).toBeInTheDocument()
    })

    it('debería renderizar la sección de inventario/opciones', () => {
      render(<SettingsPage {...defaultProps} />)
      expect(screen.getByText('Opciones de producto')).toBeInTheDocument()
    })

    it('debería mostrar el botón de guardar', () => {
      render(<SettingsPage {...defaultProps} />)
      expect(screen.getByText('Guardar cambios')).toBeInTheDocument()
    })

    it('debería mostrar el botón de cerrar sesión', () => {
      render(<SettingsPage {...defaultProps} />)
      expect(screen.getByText('Cerrar sesión')).toBeInTheDocument()
    })

    it('debería mostrar el botón de gestionar opciones', () => {
      render(<SettingsPage {...defaultProps} />)
      expect(screen.getByText('Gestionar opciones')).toBeInTheDocument()
    })
  })

  describe('Campos del formulario', () => {
    it('debería mostrar el nombre del negocio actual', () => {
      render(<SettingsPage {...defaultProps} />)
      const input = screen.getByLabelText('Nombre del negocio')
      expect(input).toHaveValue('Mi Negocio')
    })

    it('debería mostrar la moneda actual', () => {
      render(<SettingsPage {...defaultProps} />)
      const trigger = screen.getByRole('button', { name: /moneda predeterminada/i })
      expect(trigger).toHaveTextContent('Peso mexicano (MXN)')
    })

    it('debería mostrar el umbral de stock bajo', () => {
      render(<SettingsPage {...defaultProps} />)
      const input = screen.getByRole('spinbutton', { name: /umbral de stock bajo/i })
      expect(input).toHaveValue(5)
    })

    it('debería mostrar el checkbox de catálogo público', () => {
      render(<SettingsPage {...defaultProps} />)
      const checkbox = screen.getByLabelText('Activar mi tienda pública')
      expect(checkbox).toBeChecked()
    })

    it('debería mostrar el slug público', () => {
      render(<SettingsPage {...defaultProps} />)
      const input = screen.getByRole('textbox', { name: /slug único/i })
      expect(input).toHaveValue('mi-negocio')
    })

    it('debería mostrar el WhatsApp', () => {
      render(<SettingsPage {...defaultProps} />)
      const input = screen.getByRole('textbox', { name: /whatsapp de contacto/i })
      expect(input).toHaveValue('55 1234 5678')
    })

    it('debería mostrar la introducción pública', () => {
      render(<SettingsPage {...defaultProps} />)
      const textarea = screen.getByLabelText('Presentación pública')
      expect(textarea).toHaveValue('Productos para ti')
    })

    it('debería mostrar el enlace del catálogo cuando está habilitado', () => {
      render(<SettingsPage {...defaultProps} />)
      expect(
        screen.getByText(/Tu enlace:.*\/tienda\/mi-negocio/),
      ).toBeInTheDocument()
    })
  })

  describe('Interacciones', () => {
    it('debería actualizar el nombre del negocio al escribir', async () => {
      const user = userEvent.setup()
      render(<SettingsPage {...defaultProps} />)
      const input = screen.getByLabelText('Nombre del negocio')
      await user.clear(input)
      await user.type(input, 'Nuevo Nombre')
      expect(input).toHaveValue('Nuevo Nombre')
    })

    it('debería actualizar la moneda al cambiar', async () => {
      const user = userEvent.setup()
      render(<SettingsPage {...defaultProps} />)
      const trigger = screen.getByRole('button', { name: /moneda predeterminada/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: 'Dólar estadounidense (USD)' }))
      expect(trigger).toHaveTextContent('Dólar estadounidense (USD)')
    })

    it('debería actualizar el umbral de stock', async () => {
      const user = userEvent.setup()
      render(<SettingsPage {...defaultProps} />)
      const input = screen.getByRole('spinbutton', { name: /umbral de stock bajo/i })
      await user.clear(input)
      await user.type(input, '10')
      expect(input).toHaveValue(10)
    })

    it('debería actualizar el checkbox de catálogo', async () => {
      const user = userEvent.setup()
      render(<SettingsPage {...defaultProps} />)
      const checkbox = screen.getByLabelText('Activar mi tienda pública')
      await user.click(checkbox)
      expect(checkbox).not.toBeChecked()
    })

    it('debería actualizar el slug', async () => {
      const user = userEvent.setup()
      render(<SettingsPage {...defaultProps} />)
      const input = screen.getByRole('textbox', { name: /slug único/i })
      await user.clear(input)
      await user.type(input, 'nuevo-slug')
      expect(input).toHaveValue('nuevo-slug')
    })

    it('debería actualizar el WhatsApp', async () => {
      const user = userEvent.setup()
      render(<SettingsPage {...defaultProps} />)
      const input = screen.getByRole('textbox', { name: /whatsapp de contacto/i })
      await user.clear(input)
      await user.type(input, '33 9876 5432')
      expect(input).toHaveValue('33 9876 5432')
    })

    it('debería actualizar la introducción pública', async () => {
      const user = userEvent.setup()
      render(<SettingsPage {...defaultProps} />)
      const textarea = screen.getByLabelText('Presentación pública')
      await user.clear(textarea)
      await user.type(textarea, 'Nueva intro')
      expect(textarea).toHaveValue('Nueva intro')
    })
  })

  describe('Validación', () => {
    it('debería mostrar error si el nombre es muy corto', async () => {
      const user = userEvent.setup()
      render(<SettingsPage {...defaultProps} />)
      const input = screen.getByLabelText('Nombre del negocio')
      await user.clear(input)
      await user.type(input, 'A')
      await user.click(screen.getByText('Guardar cambios'))
      expect(mockToastError).toHaveBeenCalledWith(
        'El nombre debe tener entre 2 y 120 caracteres.',
      )
    })

    it('debería mostrar error si el nombre es muy largo', async () => {
      render(<SettingsPage {...defaultProps} />)
      const input = screen.getByLabelText('Nombre del negocio')
      fireEvent.change(input, { target: { value: 'A'.repeat(121) } })
      await screen.findByText('Guardar cambios')
      fireEvent.click(screen.getByText('Guardar cambios'))
      expect(mockToastError).toHaveBeenCalledWith(
        'El nombre debe tener entre 2 y 120 caracteres.',
      )
    })

    it('debería mostrar error si el umbral es negativo', async () => {
      render(<SettingsPage {...defaultProps} />)
      const input = screen.getByRole('spinbutton', { name: /umbral de stock bajo/i })
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )!.set!
      nativeInputValueSetter.call(input, '-1')
      fireEvent.change(input, { target: { value: '-1' } })
      fireEvent.submit(input.closest('form')!)
      expect(mockToastError).toHaveBeenCalledWith(
        'El umbral debe ser un entero entre 0 y 10,000.',
      )
    })

    it('debería mostrar error si el umbral supera 10000', async () => {
      render(<SettingsPage {...defaultProps} />)
      const input = screen.getByRole('spinbutton', { name: /umbral de stock bajo/i })
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )!.set!
      nativeInputValueSetter.call(input, '10001')
      fireEvent.change(input, { target: { value: '10001' } })
      fireEvent.submit(input.closest('form')!)
      expect(mockToastError).toHaveBeenCalledWith(
        'El umbral debe ser un entero entre 0 y 10,000.',
      )
    })
  })

  describe('Envío del formulario', () => {
    it('debería llamar onSave con los datos actualizados', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn().mockResolvedValue(undefined)
      render(<SettingsPage {...defaultProps} onSave={onSave} />)
      const input = screen.getByLabelText('Nombre del negocio')
      await user.clear(input)
      await user.type(input, 'Negocio Actualizado')
      await user.click(screen.getByText('Guardar cambios'))
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          businessName: 'Negocio Actualizado',
          currency: 'MXN',
        }),
      )
    })

    it('debería llamar onSignOut al hacer clic en cerrar sesión', async () => {
      const user = userEvent.setup()
      const onSignOut = vi.fn().mockResolvedValue(undefined)
      render(<SettingsPage {...defaultProps} onSignOut={onSignOut} />)
      await user.click(screen.getByText('Cerrar sesión'))
      expect(onSignOut).toHaveBeenCalled()
    })

    it('debería llamar onOpenOptionTypes al hacer clic en gestionar opciones', async () => {
      const user = userEvent.setup()
      const onOpenOptionTypes = vi.fn()
      render(
        <SettingsPage {...defaultProps} onOpenOptionTypes={onOpenOptionTypes} />,
      )
      await user.click(screen.getByText('Gestionar opciones'))
      expect(onOpenOptionTypes).toHaveBeenCalled()
    })
  })
})
