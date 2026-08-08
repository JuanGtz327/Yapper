import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { OrdersPage } from './OrdersPage'
import type { Order, Product } from '../../types.ts'

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
  ],
  ...overrides,
})

const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
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
      optionValues: [],
    },
  ],
  ...overrides,
})

const defaultProps = {
  orders: [createMockOrder()],
  products: [createMockProduct()],
  currency: 'MXN',
  onAdd: vi.fn(),
  onStatusChange: vi.fn(),
  onPaymentChange: vi.fn(),
  onCancel: vi.fn(),
}

describe('OrdersPage', () => {
  describe('Renderizado', () => {
    it('debería renderizar el título de la página', () => {
      render(<OrdersPage {...defaultProps} />)
      expect(screen.getByText('Pedidos')).toBeInTheDocument()
    })

    it('debería renderizar el subtítulo', () => {
      render(<OrdersPage {...defaultProps} />)
      expect(
        screen.getByText('Consulta y da seguimiento a tus pedidos.'),
      ).toBeInTheDocument()
    })

    it('debería mostrar el botón de crear pedido', () => {
      render(<OrdersPage {...defaultProps} />)
      expect(screen.getByText('Crear pedido')).toBeInTheDocument()
    })
  })

  describe('Resumen de pedidos', () => {
    it('debería mostrar el total del mes', () => {
      render(<OrdersPage {...defaultProps} />)
      expect(screen.getByText('Este mes')).toBeInTheDocument()
    })

    it('debería mostrar pedidos pendientes', () => {
      render(<OrdersPage {...defaultProps} />)
      expect(screen.getByText('Pendientes')).toBeInTheDocument()
    })

    it('debería mostrar por cobrar', () => {
      render(<OrdersPage {...defaultProps} />)
      expect(screen.getByText('Por cobrar')).toBeInTheDocument()
    })

    it('debería calcular el total correctamente', () => {
      const orders = [
        createMockOrder({ id: '#PED-001', total: 300 }),
        createMockOrder({ id: '#PED-002', total: 500 }),
      ]
      render(<OrdersPage {...defaultProps} orders={orders} />)
      // Total = 300 + 500 = 800
      expect(screen.getByText('$800')).toBeInTheDocument()
    })

    it('debería contar pedidos pendientes correctamente', () => {
      const orders = [
        createMockOrder({ id: '#PED-001', status: 'Pendiente' }),
        createMockOrder({ id: '#PED-002', status: 'Entregado' }),
        createMockOrder({ id: '#PED-003', status: 'Pendiente' }),
      ]
      render(<OrdersPage {...defaultProps} orders={orders} />)
      // 2 pendientes
      const pendientes = screen.getByText('Pendientes').parentElement
      expect(pendientes?.querySelector('strong')).toHaveTextContent('2')
    })
  })

  describe('Tabla de pedidos', () => {
    it('debería mostrar el ID del pedido', () => {
      render(<OrdersPage {...defaultProps} />)
      const ids = screen.getAllByText('#PED-001')
      expect(ids.length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar el nombre del cliente', () => {
      render(<OrdersPage {...defaultProps} />)
      const names = screen.getAllByText('Juan Pérez')
      expect(names.length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar la fecha', () => {
      render(<OrdersPage {...defaultProps} />)
      const dates = screen.getAllByText('15 ene 2026, 10:30')
      expect(dates.length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar el total', () => {
      render(<OrdersPage {...defaultProps} />)
      const totals = screen.getAllByText('$300')
      expect(totals.length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar la cantidad de productos', () => {
      render(<OrdersPage {...defaultProps} />)
      const productCounts = screen.getAllByText(/productos/)
      expect(productCounts.length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar el badge de estado Pendiente', () => {
      render(<OrdersPage {...defaultProps} />)
      const badges = screen.getAllByText('Pendiente')
      expect(badges.length).toBeGreaterThan(0)
    })

    it('debería mostrar el badge de estado Entregado', () => {
      const order = createMockOrder({ status: 'Entregado' })
      render(<OrdersPage {...defaultProps} orders={[order]} />)
      const badges = screen.getAllByText('Entregado')
      expect(badges.length).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar el badge de estado Cancelado', () => {
      const order = createMockOrder({ status: 'Cancelado' })
      render(<OrdersPage {...defaultProps} orders={[order]} />)
      const badges = screen.getAllByText('Cancelado')
      expect(badges.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Acciones', () => {
    it('debería llamar a onAdd al hacer clic en "Crear pedido"', () => {
      const onAdd = vi.fn()
      render(<OrdersPage {...defaultProps} onAdd={onAdd} />)
      fireEvent.click(screen.getByText('Crear pedido'))
      expect(onAdd).toHaveBeenCalledTimes(1)
    })

    it('debería llamar a onStatusChange al cambiar el estado de entrega', () => {
      const onStatusChange = vi.fn()
      render(<OrdersPage {...defaultProps} onStatusChange={onStatusChange} />)
      const selects = screen.getAllByLabelText('Entrega de #PED-001')
      fireEvent.change(selects[0], { target: { value: 'delivered' } })
      expect(onStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: '#PED-001' }),
        'delivered',
      )
    })

    it('debería llamar a onPaymentChange al cambiar el estado de pago', () => {
      const onPaymentChange = vi.fn()
      render(<OrdersPage {...defaultProps} onPaymentChange={onPaymentChange} />)
      const selects = screen.getAllByLabelText('Pago de #PED-001')
      fireEvent.change(selects[0], { target: { value: 'pending' } })
      expect(onPaymentChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: '#PED-001' }),
        'pending',
      )
    })

    it('debería llamar a onCancel al hacer clic en cancelar', () => {
      const onCancel = vi.fn()
      render(<OrdersPage {...defaultProps} onCancel={onCancel} />)
      const cancelButtons = screen.getAllByLabelText('Cancelar #PED-001')
      fireEvent.click(cancelButtons[0])
      expect(onCancel).toHaveBeenCalledWith(
        expect.objectContaining({ id: '#PED-001' }),
      )
    })

    it('no debería mostrar botón de cancelar para pedidos cancelados', () => {
      const order = createMockOrder({ status: 'Cancelado' })
      render(<OrdersPage {...defaultProps} orders={[order]} />)
      expect(
        screen.queryByLabelText('Cancelar #PED-001'),
      ).not.toBeInTheDocument()
    })
  })

  describe('Selección de pedido', () => {
    it('debería abrir el modal de detalles al hacer clic en un pedido', () => {
      render(<OrdersPage {...defaultProps} />)
      const orderIds = screen.getAllByText('#PED-001')
      fireEvent.click(orderIds[0])
      expect(
        screen.getAllByText('Detalles del pedido #PED-001').length,
      ).toBeGreaterThanOrEqual(1)
    })

    it('debería mostrar los detalles del pedido en el modal', () => {
      render(<OrdersPage {...defaultProps} />)
      const orderIds = screen.getAllByText('#PED-001')
      fireEvent.click(orderIds[0])
      const clienteLabels = screen.getAllByText('Cliente')
      expect(clienteLabels.length).toBeGreaterThanOrEqual(2)
      const clientNames = screen.getAllByText('Juan Pérez')
      expect(clientNames.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Tarjetas de pedidos (móvil)', () => {
    it('debería renderizar las tarjetas de pedidos', () => {
      render(<OrdersPage {...defaultProps} />)
      const cardsContainer = screen.getByLabelText('Pedidos')
      expect(cardsContainer).toBeInTheDocument()
    })

    it('debería mostrar el ID del pedido en la tarjeta', () => {
      render(<OrdersPage {...defaultProps} />)
      const cards = screen.getAllByText('#PED-001')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  describe('Pedidos cancelados', () => {
    it('debería deshabilitar el select de pago para pedidos cancelados', () => {
      const order = createMockOrder({ status: 'Cancelado' })
      render(<OrdersPage {...defaultProps} orders={[order]} />)
      const selects = screen.getAllByLabelText('Pago de #PED-001')
      expect(selects[0]).toBeDisabled()
    })

    it('debería mostrar badge de Cancelado en la tarjeta', () => {
      const order = createMockOrder({ status: 'Cancelado' })
      render(<OrdersPage {...defaultProps} orders={[order]} />)
      const badges = screen.getAllByText('Cancelado')
      expect(badges.length).toBeGreaterThan(0)
    })
  })

  describe('Estado vacío', () => {
    it('debería renderizar correctamente sin pedidos', () => {
      render(<OrdersPage {...defaultProps} orders={[]} />)
      expect(screen.getByText('Pedidos')).toBeInTheDocument()
    })
  })
})
