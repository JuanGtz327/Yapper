import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { OrderTicketModal } from './OrderTicketModal'
import type { Order, Product } from '../../types.ts'

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
  {
    id: 'p2',
    name: 'Tazón de Cerámica',
    category: 'Hogar',
    categoryId: 'cat2',
    published: true,
    publicDescription: '',
    imageUrl: null,
    color: 'amber',
    variants: [
      {
        id: 'v3',
        productId: 'p2',
        sku: 'TAZ-CER-MED',
        name: 'Mediano',
        inventoryCost: 120,
        salePrice: 250,
        stock: 15,
        optionValues: [{ optionType: 'Tamaño', value: 'Mediano' }],
      },
    ],
  },
]

const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: '#PED-001',
  databaseId: 'db-1',
  clientId: 'c1',
  client: 'Juan Pérez',
  date: '15 ene 2026, 10:30',
  items: 2,
  total: 300,
  status: 'Pendiente',
  payment: 'Pagado',
  itemLines: [
    { variantId: 'v1', quantity: 2 },
    { variantId: 'v3', quantity: 1 },
  ],
  ...overrides,
})

const defaultProps = {
  order: createMockOrder(),
  products: mockProducts,
  currency: 'MXN',
  onClose: vi.fn(),
  onEdit: vi.fn(),
  onStatusChange: vi.fn(),
  onPaymentChange: vi.fn(),
  onCancel: vi.fn(),
}

describe('OrderTicketModal', () => {
  describe('Renderizado', () => {
    it('debería mostrar el título con el ID del pedido', () => {
      render(<OrderTicketModal {...defaultProps} />)
      expect(
        screen.getByText('Detalles del pedido #PED-001'),
      ).toBeInTheDocument()
    })

    it('debería mostrar el nombre del cliente', () => {
      render(<OrderTicketModal {...defaultProps} />)
      expect(screen.getByText('Cliente')).toBeInTheDocument()
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    it('debería mostrar la fecha', () => {
      render(<OrderTicketModal {...defaultProps} />)
      expect(screen.getByText('Fecha')).toBeInTheDocument()
      expect(screen.getByText('15 ene 2026, 10:30')).toBeInTheDocument()
    })

    it('debería mostrar el estado de entrega', () => {
      render(<OrderTicketModal {...defaultProps} />)
      expect(screen.getByText('Entrega')).toBeInTheDocument()
      expect(screen.getAllByText('Pendiente').length).toBeGreaterThan(0)
    })

    it('debería mostrar el estado de pago', () => {
      render(<OrderTicketModal {...defaultProps} />)
      expect(screen.getByText('Pago')).toBeInTheDocument()
      expect(screen.getAllByText('Pagado').length).toBeGreaterThan(0)
    })
  })

  describe('Tabla de productos', () => {
    it('debería mostrar la sección de productos', () => {
      render(<OrderTicketModal {...defaultProps} />)
      expect(screen.getByText('Productos')).toBeInTheDocument()
    })

    it('debería mostrar las columnas de la tabla', () => {
      render(<OrderTicketModal {...defaultProps} />)
      expect(screen.getByText('Producto')).toBeInTheDocument()
      expect(screen.getByText('Cant.')).toBeInTheDocument()
      expect(screen.getByText('Precio')).toBeInTheDocument()
      expect(screen.getByText('Total')).toBeInTheDocument()
    })

    it('debería mostrar los nombres de los productos', () => {
      render(<OrderTicketModal {...defaultProps} />)
      expect(screen.getByText('Playera Básica')).toBeInTheDocument()
      expect(screen.getByText('Tazón de Cerámica')).toBeInTheDocument()
    })

    it('debería mostrar las cantidades', () => {
      render(<OrderTicketModal {...defaultProps} />)
      const quantities = screen.getAllByText('2')
      expect(quantities.length).toBeGreaterThan(0)
    })

    it('debería mostrar el precio unitario', () => {
      render(<OrderTicketModal {...defaultProps} />)
      expect(screen.getByText('$150.00 por unidad')).toBeInTheDocument()
      expect(screen.getByText('$250.00 por unidad')).toBeInTheDocument()
    })

    it('debería mostrar el total de cada línea', () => {
      render(<OrderTicketModal {...defaultProps} />)
      // 150 * 2 = 300 — may appear in line and elsewhere
      const totals300 = screen.getAllByText('$300.00')
      expect(totals300.length).toBeGreaterThanOrEqual(1)
      // 250 * 1 = 250 — appears in ticket line and elsewhere
      const totals250 = screen.getAllByText('$250.00')
      expect(totals250.length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar el total general', () => {
      render(<OrderTicketModal {...defaultProps} />)
      expect(screen.getByText('Total del pedido')).toBeInTheDocument()
      // 300 + 250 = 550
      expect(screen.getByText('$550.00')).toBeInTheDocument()
    })
  })

  describe('Productos con snapshot', () => {
    it('debería usar datos del snapshot cuando están disponibles', () => {
      const orderWithSnapshot = createMockOrder({
        itemLines: [
          {
            variantId: 'v1',
            quantity: 1,
            productNameSnapshot: 'Playera Vintage',
            skuSnapshot: 'PLA-VIN-001',
            variantLabelSnapshot: 'Talla M',
            unitPrice: 200,
            unitCostSnapshot: 100,
            lineTotal: 200,
          },
        ],
      })
      render(<OrderTicketModal {...defaultProps} order={orderWithSnapshot} />)
      expect(screen.getByText('Playera Vintage')).toBeInTheDocument()
      expect(screen.getByText('Talla M')).toBeInTheDocument()
      expect(screen.getByText('$200.00 por unidad')).toBeInTheDocument()
    })

    it('debería calcular total desde snapshot cuando lineTotal no existe', () => {
      const orderWithSnapshot = createMockOrder({
        itemLines: [
          {
            variantId: 'v1',
            quantity: 3,
            productNameSnapshot: 'Playera Vintage',
            unitPrice: 100,
          },
        ],
      })
      render(<OrderTicketModal {...defaultProps} order={orderWithSnapshot} />)
      // 100 * 3 = 300
      const totals = screen.getAllByText('$300.00')
      expect(totals.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Productos sin snapshot', () => {
    it('debería buscar el producto en la lista de productos', () => {
      render(<OrderTicketModal {...defaultProps} />)
      expect(screen.getByText('Playera Básica')).toBeInTheDocument()
    })

    it('debería mostrar "Producto no disponible" si el producto no existe', () => {
      const orderWithMissingProduct = createMockOrder({
        itemLines: [{ variantId: 'v999', quantity: 1 }],
      })
      render(
        <OrderTicketModal {...defaultProps} order={orderWithMissingProduct} />,
      )
      expect(screen.getByText('Producto no disponible')).toBeInTheDocument()
    })

    it('debería mostrar la etiqueta de variante con SKU y opciones', () => {
      render(<OrderTicketModal {...defaultProps} />)
      expect(screen.getByText(/PLA-BAS-NEG/)).toBeInTheDocument()
    })
  })

  describe('Badges de estado', () => {
    it('debería mostrar badge success para Entregado', () => {
      const order = createMockOrder({ status: 'Entregado' })
      render(<OrderTicketModal {...defaultProps} order={order} />)
      const badges = screen.getAllByText('Entregado')
      expect(badges.some((b) => b.classList.contains('success'))).toBe(true)
    })

    it('debería mostrar badge warning para Pendiente', () => {
      render(<OrderTicketModal {...defaultProps} />)
      const badges = screen.getAllByText('Pendiente')
      expect(badges.some((b) => b.classList.contains('warning'))).toBe(true)
    })

    it('debería mostrar badge success para Pagado', () => {
      render(<OrderTicketModal {...defaultProps} />)
      const badges = screen.getAllByText('Pagado')
      expect(badges.some((b) => b.classList.contains('success'))).toBe(true)
    })

    it('debería mostrar badge warning para Pendiente de pago', () => {
      const order = createMockOrder({ payment: 'Pendiente' })
      render(<OrderTicketModal {...defaultProps} order={order} />)
      const badges = screen.getAllByText('Pendiente')
      expect(badges.some((b) => b.classList.contains('warning'))).toBe(true)
    })
  })

  describe('Cancelación de pedido', () => {
    it('debería mostrar botón de cancelar para pedidos no cancelados', () => {
      render(<OrderTicketModal {...defaultProps} />)
      expect(screen.getByText('Cancelar pedido')).toBeInTheDocument()
    })

    it('debería llamar a onCancel al hacer clic en cancelar', () => {
      const onCancel = vi.fn()
      const onClose = vi.fn()
      render(
        <OrderTicketModal
          {...defaultProps}
          onCancel={onCancel}
          onClose={onClose}
        />,
      )
      fireEvent.click(screen.getByText('Cancelar pedido'))
      expect(onCancel).toHaveBeenCalledWith(
        expect.objectContaining({ id: '#PED-001' }),
      )
    })

    it('debería llamar a onClose después de cancelar', () => {
      const onCancel = vi.fn()
      const onClose = vi.fn()
      render(
        <OrderTicketModal
          {...defaultProps}
          onCancel={onCancel}
          onClose={onClose}
        />,
      )
      fireEvent.click(screen.getByText('Cancelar pedido'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('no debería mostrar botón de cancelar para pedidos cancelados', () => {
      const order = createMockOrder({ status: 'Cancelado' })
      render(<OrderTicketModal {...defaultProps} order={order} />)
      expect(screen.queryByText('Cancelar pedido')).not.toBeInTheDocument()
    })
  })

  describe('Acciones del detalle', () => {
    it('debería ofrecer editar pedido desde el detalle', () => {
      const onEdit = vi.fn()
      render(<OrderTicketModal {...defaultProps} onEdit={onEdit} />)
      fireEvent.click(screen.getByText('Editar pedido'))
      expect(onEdit).toHaveBeenCalledWith(
        expect.objectContaining({ id: '#PED-001' }),
      )
    })

    it('debería actualizar estados usando controles segmentados', () => {
      const onStatusChange = vi.fn()
      const onPaymentChange = vi.fn()
      render(
        <OrderTicketModal
          {...defaultProps}
          onStatusChange={onStatusChange}
          onPaymentChange={onPaymentChange}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Entregado' }))
      const pendingButtons = screen.getAllByRole('button', {
        name: 'Pendiente',
      })
      fireEvent.click(pendingButtons[pendingButtons.length - 1])
      expect(onStatusChange).toHaveBeenCalledWith(
        defaultProps.order,
        'delivered',
      )
      expect(onPaymentChange).toHaveBeenCalledWith(
        defaultProps.order,
        'pending',
      )
    })
  })

  describe('Pedido sin líneas', () => {
    it('debería mostrar mensaje cuando no hay productos detallados', () => {
      const orderWithoutLines = createMockOrder({ itemLines: [] })
      render(<OrderTicketModal {...defaultProps} order={orderWithoutLines} />)
      expect(
        screen.getByText('No hay productos detallados para este pedido.'),
      ).toBeInTheDocument()
    })

    it('debería usar el total del pedido cuando no hay líneas', () => {
      const orderWithoutLines = createMockOrder({
        itemLines: [],
        total: 1000,
      })
      render(<OrderTicketModal {...defaultProps} order={orderWithoutLines} />)
      expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    })
  })

  describe('Cierre del modal', () => {
    it('debería llamar a onClose al hacer clic en cerrar', () => {
      const onClose = vi.fn()
      render(<OrderTicketModal {...defaultProps} onClose={onClose} />)
      fireEvent.click(screen.getByLabelText('Cerrar'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})
