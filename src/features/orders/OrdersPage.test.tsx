import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrdersPage } from './OrdersPage'
import type { Order } from '../../types.ts'

vi.mock('../../hooks/queries/useOrderPayments.ts', () => ({
  useOrderPaymentsQuery: vi
    .fn()
    .mockReturnValue({ data: [], isLoading: false }),
}))

const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: '#PED-001',
  databaseId: 'db-1',
  clientId: 'c1',
  client: 'Juan Pérez',
  date: '15 ago 2026, 10:30',
  createdAt: '2026-08-15T10:30:00Z',
  items: 2,
  total: 300,
  paidAmount: 300,
  status: 'Pendiente',
  payment: 'Pagado',
  itemLines: [{ variantId: 'v1', quantity: 2 }],
  ...overrides,
})

const defaultProps = {
  orders: [createMockOrder()],
  currency: 'MXN',
  onAdd: vi.fn(),
  onSelectOrder: vi.fn(),
}

describe('OrdersPage', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  describe('Renderizado', () => {
    it('debería mostrar el botón de crear pedido', () => {
      render(<OrdersPage {...defaultProps} />)
      expect(screen.getByText('Crear pedido')).toBeInTheDocument()
    })
  })

  describe('Resumen de pedidos', () => {
    it('debería calcular el total correctamente', () => {
      const orders = [
        createMockOrder({ id: '#PED-001', total: 300 }),
        createMockOrder({ id: '#PED-002', total: 500 }),
      ]
      render(<OrdersPage {...defaultProps} orders={orders} />)
      // Total = 300 + 500 = 800
      expect(screen.getByText('$800.00')).toBeInTheDocument()
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

    it('debería calcular el resumen usando todos los pedidos, no solo la página actual', () => {
      const currentPage = [createMockOrder({ id: '#PED-001', total: 300 })]
      const allOrders = [
        ...currentPage,
        createMockOrder({ id: '#PED-002', total: 500 }),
      ]
      render(
        <OrdersPage
          {...defaultProps}
          orders={currentPage}
          summaryOrders={allOrders}
        />,
      )
      const summary = screen.getByText('Este mes').parentElement
      expect(summary?.querySelector('strong')).toHaveTextContent('$800.00')
    })

    it('debería excluir órdenes de meses anteriores del total "Este mes"', () => {
      const orders = [
        createMockOrder({
          id: '#PED-001',
          total: 300,
          createdAt: '2026-08-15T10:00:00Z',
        }),
        createMockOrder({
          id: '#PED-002',
          total: 500,
          createdAt: '2026-01-10T10:00:00Z',
        }),
      ]
      render(<OrdersPage {...defaultProps} orders={orders} />)
      const summary = screen.getByText('Este mes').parentElement
      expect(summary?.querySelector('strong')).toHaveTextContent('$300.00')
    })

    it('debería incluir todas las órdenes cuando createdAt es undefined', () => {
      const orders = [
        createMockOrder({ id: '#PED-001', total: 300, createdAt: undefined }),
        createMockOrder({ id: '#PED-002', total: 500, createdAt: undefined }),
      ]
      render(<OrdersPage {...defaultProps} orders={orders} />)
      const summary = screen.getByText('Este mes').parentElement
      expect(summary?.querySelector('strong')).toHaveTextContent('$800.00')
    })
  })

  describe('Acciones', () => {
    it('debería llamar a onAdd al hacer clic en "Crear pedido"', () => {
      const onAdd = vi.fn()
      render(<OrdersPage {...defaultProps} onAdd={onAdd} />)
      fireEvent.click(screen.getByText('Crear pedido'))
      expect(onAdd).toHaveBeenCalledTimes(1)
    })

    it('no debería incluir una columna de acciones en la tabla', () => {
      render(<OrdersPage {...defaultProps} />)
      expect(
        screen.queryByRole('columnheader', { name: 'Acciones' }),
      ).not.toBeInTheDocument()
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
    it('debería llamar a onSelectOrder al hacer clic en un pedido de la tabla', () => {
      const onSelectOrder = vi.fn()
      render(<OrdersPage {...defaultProps} onSelectOrder={onSelectOrder} />)
      const orderIds = screen.getAllByText('#PED-001')
      fireEvent.click(orderIds[0])
      expect(onSelectOrder).toHaveBeenCalledWith(
        expect.objectContaining({ id: '#PED-001' }),
      )
    })

    it('debería llamar a onSelectOrder al hacer clic en una tarjeta', () => {
      const onSelectOrder = vi.fn()
      render(<OrdersPage {...defaultProps} onSelectOrder={onSelectOrder} />)
      const cards = screen.getAllByText('#PED-001')
      fireEvent.click(cards[cards.length - 1])
      expect(onSelectOrder).toHaveBeenCalledWith(
        expect.objectContaining({ id: '#PED-001' }),
      )
    })
  })

  describe('Filtros', () => {
    it('debería buscar pedidos por número', () => {
      const orders = [
        createMockOrder({ id: '#PED-001' }),
        createMockOrder({ id: '#PED-002' }),
      ]
      render(<OrdersPage {...defaultProps} orders={orders} />)

      fireEvent.change(screen.getByLabelText('Buscar por número de pedido'), {
        target: { value: '002' },
      })

      expect(screen.getAllByText('#PED-002').length).toBeGreaterThan(0)
      expect(screen.queryByText('#PED-001')).not.toBeInTheDocument()
    })

    it('debería filtrar pedidos por estado de entrega', async () => {
      const user = userEvent.setup()
      const orders = [
        createMockOrder({ id: '#PED-001', status: 'Pendiente' }),
        createMockOrder({ id: '#PED-002', status: 'Entregado' }),
      ]
      render(<OrdersPage {...defaultProps} orders={orders} />)

      await user.click(
        screen.getByRole('button', { name: 'Filtrar por entrega' }),
      )
      await user.click(screen.getByRole('option', { name: 'Entregados' }))

      expect(screen.getAllByText('#PED-002').length).toBeGreaterThan(0)
      expect(screen.queryByText('#PED-001')).not.toBeInTheDocument()
    })

    it('no debería incluir cancelados en los filtros de pago', async () => {
      const user = userEvent.setup()
      const orders = [
        createMockOrder({
          id: '#PED-001',
          status: 'Cancelado',
          payment: 'Pagado',
        }),
        createMockOrder({
          id: '#PED-002',
          status: 'Pendiente',
          payment: 'Pagado',
        }),
      ]
      render(<OrdersPage {...defaultProps} orders={orders} />)

      await user.click(screen.getByRole('button', { name: 'Filtrar por pago' }))
      await user.click(screen.getByRole('option', { name: 'Pagados' }))

      expect(screen.getAllByText('#PED-002').length).toBeGreaterThan(0)
      expect(screen.queryByText('#PED-001')).not.toBeInTheDocument()
    })
  })

  describe('Pedidos cancelados', () => {
    it('no debería mostrar el select de pago para pedidos cancelados', () => {
      const order = createMockOrder({ status: 'Cancelado' })
      render(<OrdersPage {...defaultProps} orders={[order]} />)
      expect(
        screen.queryByLabelText('Pago de #PED-001'),
      ).not.toBeInTheDocument()
    })

    it('no debería contar pedidos cancelados como pendientes en el resumen', () => {
      const orders = [
        createMockOrder({ id: '#PED-001', status: 'Pendiente' }),
        createMockOrder({ id: '#PED-002', status: 'Cancelado' }),
        createMockOrder({ id: '#PED-003', status: 'Pendiente' }),
      ]
      render(<OrdersPage {...defaultProps} orders={orders} />)
      const pendientes = screen.getByText('Pendientes').parentElement
      expect(pendientes?.querySelector('strong')).toHaveTextContent('2')
    })

    it('no debería mostrar el select de pago en la tarjeta para pedidos cancelados', () => {
      const order = createMockOrder({ status: 'Cancelado' })
      render(<OrdersPage {...defaultProps} orders={[order]} />)
      const cardSelects = screen.queryAllByLabelText('Pago de #PED-001')
      expect(cardSelects).toHaveLength(0)
    })

    it('no debería mostrar el select de entrega en la tarjeta para pedidos cancelados', () => {
      const order = createMockOrder({ status: 'Cancelado' })
      render(<OrdersPage {...defaultProps} orders={[order]} />)
      const cardSelects = screen.queryAllByLabelText('Entrega de #PED-001')
      expect(cardSelects).toHaveLength(0)
    })
  })
})
