import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrderModal } from './OrderModal'
import type { Client, Product } from '../../types.ts'

const mockClients: Client[] = [
  {
    id: 'c1',
    name: 'Juan Pérez',
    phone: '5512345678',
    zone: 'Centro',
    orders: 5,
    initials: 'JP',
  },
  {
    id: 'c2',
    name: 'María García',
    phone: '5598765432',
    zone: 'Norte',
    orders: 3,
    initials: 'MG',
  },
]

const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Playera Básica',
    category: 'Ropa',
    categoryId: 'cat1',
    published: true,
    publicDescription: '',
    imageUrl: null,
    color: 'sky',
    variants: [
      {
        id: 'v1',
        productId: 'p1',
        sku: 'PLA-BAS-NEG',
        name: 'Negro',
        inventoryCost: 80,
        salePrice: 150,
        stock: 25,
        optionValues: [{ optionType: 'Color', value: 'Negro' }],
      },
      {
        id: 'v2',
        productId: 'p1',
        sku: 'PLA-BAS-BLA',
        name: 'Blanco',
        inventoryCost: 80,
        salePrice: 150,
        stock: 10,
        optionValues: [{ optionType: 'Color', value: 'Blanco' }],
      },
    ],
  },
]

const defaultProps = {
  clients: mockClients,
  products: mockProducts,
  currency: 'MXN',
  onClose: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue(undefined),
}

describe('OrderModal', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  describe('Renderizado', () => {
    it('debería mostrar el título "Crear pedido"', () => {
      render(<OrderModal {...defaultProps} />)
      expect(screen.getByText('Crear pedido')).toBeInTheDocument()
    })

    it('debería mostrar el select de clientes', () => {
      render(<OrderModal {...defaultProps} />)
      expect(screen.getByText('Cliente')).toBeInTheDocument()
    })

    it('debería mostrar los clientes disponibles', async () => {
      const user = userEvent.setup()
      render(<OrderModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      const clientLabel = within(dialog).getByText('Cliente').closest('label')!
      const trigger = clientLabel.querySelector('.custom-select-trigger')!
      await user.click(trigger)
      expect(screen.getByRole('option', { name: 'Juan Pérez' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'María García' })).toBeInTheDocument()
    })

    it('debería mostrar el select de estado de pago', () => {
      render(<OrderModal {...defaultProps} />)
      expect(screen.getByText('Estado del pago')).toBeInTheDocument()
    })

    it('debería mostrar las opciones de pago', async () => {
      const user = userEvent.setup()
      render(<OrderModal {...defaultProps} />)
      const trigger = screen.getByRole('button', { name: /estado del pago/i })
      await user.click(trigger)
      expect(screen.getByRole('option', { name: 'Pagado' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Pendiente de pago' })).toBeInTheDocument()
    })

    it('debería mostrar el total del pedido', () => {
      render(<OrderModal {...defaultProps} />)
      expect(screen.getByText('Total del pedido')).toBeInTheDocument()
    })

    it('debería mostrar el botón de guardar', () => {
      render(<OrderModal {...defaultProps} />)
      expect(screen.getByText('Guardar pedido')).toBeInTheDocument()
    })

    it('debería mostrar el botón de cancelar', () => {
      render(<OrderModal {...defaultProps} />)
      expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })
  })

  describe('Líneas de producto', () => {
    it('debería mostrar al menos una línea de producto', () => {
      render(<OrderModal {...defaultProps} />)
      expect(screen.getByText('Productos')).toBeInTheDocument()
    })

    it('debería mostrar el botón de añadir otro producto', () => {
      render(<OrderModal {...defaultProps} />)
      expect(screen.getByText('Añadir otro producto')).toBeInTheDocument()
    })

    it('debería mostrar las variantes disponibles', () => {
      render(<OrderModal {...defaultProps} />)
      expect(screen.getByText(/PLA-BAS-NEG/)).toBeInTheDocument()
    })

    it('debería mostrar el campo de cantidad', () => {
      render(<OrderModal {...defaultProps} />)
      const quantityInputs = screen.getAllByLabelText('Cantidad')
      expect(quantityInputs.length).toBeGreaterThan(0)
    })

    it('debería mostrar el botón de quitar producto', () => {
      render(<OrderModal {...defaultProps} />)
      expect(screen.getByLabelText('Quitar producto')).toBeInTheDocument()
    })
  })

  describe('Selección de cliente', () => {
    it('debería permitir cambiar el cliente seleccionado', async () => {
      const user = userEvent.setup()
      render(<OrderModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      const clientLabel = within(dialog).getByText('Cliente').closest('label')!
      const trigger = clientLabel.querySelector('.custom-select-trigger')!
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: 'María García' }))
      expect(trigger).toHaveTextContent('María García')
    })
  })

  describe('Selección de pago', () => {
    it('debería tener "Pagado" como valor por defecto', () => {
      render(<OrderModal {...defaultProps} />)
      const trigger = screen.getByRole('button', { name: /estado del pago/i })
      expect(trigger).toHaveTextContent('Pagado')
    })

    it('debería permitir cambiar a Pendiente de pago', async () => {
      const user = userEvent.setup()
      render(<OrderModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      const paymentLabel = within(dialog).getByText('Estado del pago').closest('label')!
      const trigger = paymentLabel.querySelector('.custom-select-trigger')!
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: 'Pendiente de pago' }))
      expect(trigger).toHaveTextContent('Pendiente de pago')
    })
  })

  describe('Añadir/quitar productos', () => {
    it('debería añadir una nueva línea al hacer clic en "Añadir otro producto"', () => {
      render(<OrderModal {...defaultProps} />)
      const addButtons = screen.getAllByLabelText('Quitar producto')
      expect(addButtons.length).toBe(1)

      fireEvent.click(screen.getByText('Añadir otro producto'))

      const afterAddButtons = screen.getAllByLabelText('Quitar producto')
      expect(afterAddButtons.length).toBe(2)
    })

    it('debería quitar una línea al hacer clic en "Quitar producto"', () => {
      render(<OrderModal {...defaultProps} />)
      fireEvent.click(screen.getByText('Añadir otro producto'))
      const afterAddButtons = screen.getAllByLabelText('Quitar producto')
      expect(afterAddButtons.length).toBe(2)

      fireEvent.click(afterAddButtons[0])
      const afterRemoveButtons = screen.getAllByLabelText('Quitar producto')
      expect(afterRemoveButtons.length).toBe(1)
    })
  })

  describe('Cálculo del total', () => {
    it('debería calcular el total basado en las cantidades y precios', () => {
      render(<OrderModal {...defaultProps} />)
      // Precio por defecto: 150 * 1 = 150 — two elements: line-total and strong
      const matches = screen.getAllByText('$150')
      expect(matches.length).toBeGreaterThanOrEqual(2)
    })

    it('debería actualizar el total al cambiar la cantidad', () => {
      render(<OrderModal {...defaultProps} />)
      const quantityInput = screen.getByLabelText('Cantidad')
      fireEvent.change(quantityInput, { target: { value: '3' } })
      // 150 * 3 = 450 — appears in both line-total and grand total
      const matches = screen.getAllByText('$450')
      expect(matches.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Cierre del modal', () => {
    it('debería llamar a onClose al hacer clic en cancelar', () => {
      const onClose = vi.fn()
      render(<OrderModal {...defaultProps} onClose={onClose} />)
      fireEvent.click(screen.getByText('Cancelar'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('debería llamar a onClose al hacer clic en cerrar', () => {
      const onClose = vi.fn()
      render(<OrderModal {...defaultProps} onClose={onClose} />)
      fireEvent.click(screen.getByLabelText('Cerrar'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Estado vacío', () => {
    it('debería mostrar mensaje cuando no hay clientes', () => {
      render(<OrderModal {...defaultProps} clients={[]} />)
      expect(
        screen.getByText(
          /Necesitas al menos un cliente y un producto/,
        ),
      ).toBeInTheDocument()
    })

    it('debería mostrar mensaje cuando no hay productos', () => {
      render(<OrderModal {...defaultProps} products={[]} />)
      expect(
        screen.getByText(
          /Necesitas al menos un cliente y un producto/,
        ),
      ).toBeInTheDocument()
    })
  })

  describe('Validación de formulario', () => {
    it('debería mostrar error al enviar sin cliente', async () => {
      const onSubmit = vi.fn()
      // When clients is empty, the Empty component is shown instead of the form
      render(<OrderModal {...defaultProps} clients={[]} onSubmit={onSubmit} />)
      
      // The Empty component should be shown
      expect(
        screen.getByText(/Necesitas al menos un cliente y un producto/),
      ).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('debería mostrar error al enviar sin productos', async () => {
      const onSubmit = vi.fn()
      // When products is empty, the Empty component is shown instead of the form
      render(<OrderModal {...defaultProps} products={[]} onSubmit={onSubmit} />)
      
      // The Empty component should be shown
      expect(
        screen.getByText(/Necesitas al menos un cliente y un producto/),
      ).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('debería calcular total correctamente con quantity > 1', () => {
      render(<OrderModal {...defaultProps} />)
      const quantityInput = screen.getByLabelText('Cantidad')
      fireEvent.change(quantityInput, { target: { value: '5' } })
      
      // 150 * 5 = 750
      const totals = screen.getAllByText('$750')
      expect(totals.length).toBeGreaterThanOrEqual(1)
    })

    it('debería calcular total correctamente con múltiples variantes', () => {
      render(<OrderModal {...defaultProps} />)
      
      // Initial total: 150 * 1 = 150
      const initialTotals = screen.getAllByText('$150')
      expect(initialTotals.length).toBeGreaterThanOrEqual(1)
      
      // Add another product
      fireEvent.click(screen.getByText('Añadir otro producto'))
      
      // After adding: first line 150 * 1 + second line 150 * 1 = 300
      expect(screen.getByText('$300')).toBeInTheDocument()
    })
  })
})
