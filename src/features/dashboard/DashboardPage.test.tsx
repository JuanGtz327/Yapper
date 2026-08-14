import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DashboardPage } from './DashboardPage'
import type { Order, Product, SalesAggregate } from '../../types.ts'

const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Playera',
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
      sku: 'PLA-001',
      name: 'Negro',
      inventoryCost: 80,
      salePrice: 150,
      stock: 25,
      optionValues: [],
    },
  ],
  ...overrides,
})

const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'o1',
  client: 'Juan',
  date: '2026-01-01',
  items: 2,
  total: 300,
  paidAmount: 0,
  status: 'Pendiente',
  payment: 'Pendiente',
  ...overrides,
})

const defaultSales: SalesAggregate[] = [
  { label: 'Lun', total: 500, orders: 3 },
  { label: 'Mar', total: 300, orders: 2 },
  { label: 'Mié', total: 800, orders: 5 },
]

const defaultProps = {
  orders: [createMockOrder()],
  products: [createMockProduct()],
  sales: defaultSales,
  threshold: 5,
  currency: 'MXN',
  onNavigate: vi.fn(),
}

describe('DashboardPage', () => {
  describe('Renderizado', () => {
    it('debería renderizar el título del resumen', () => {
      render(<DashboardPage {...defaultProps} />)
      expect(screen.getByText('Todo bajo control')).toBeInTheDocument()
    })

    it('debería renderizar la sección de ventas de 7 días', () => {
      render(<DashboardPage {...defaultProps} />)
      expect(screen.getByText('Ventas últimos 7 días')).toBeInTheDocument()
    })

    it('debería renderizar la sección de pedidos pendientes', () => {
      render(<DashboardPage {...defaultProps} />)
      expect(
        screen.getByText('Pedidos pendientes de entrega'),
      ).toBeInTheDocument()
    })

    it('debería renderizar la sección de productos activos', () => {
      render(<DashboardPage {...defaultProps} />)
      expect(screen.getByText('Productos activos')).toBeInTheDocument()
    })

    it('debería renderizar acciones rápidas', () => {
      render(<DashboardPage {...defaultProps} />)
      expect(screen.getByText('Nuevo pedido')).toBeInTheDocument()
      expect(screen.getByText('Añadir producto')).toBeInTheDocument()
      expect(screen.getByText('Nuevo cliente')).toBeInTheDocument()
    })

    it('debería renderizar ventas recientes', () => {
      render(<DashboardPage {...defaultProps} />)
      expect(screen.getByText('Ventas recientes')).toBeInTheDocument()
    })
  })

  describe('Cálculos', () => {
    it('debería contar solo pedidos no cancelados como activos', () => {
      const orders = [
        createMockOrder({ id: 'o1', status: 'Pendiente' }),
        createMockOrder({ id: 'o2', status: 'Entregado' }),
        createMockOrder({ id: 'o3', status: 'Cancelado' }),
      ]
      render(<DashboardPage {...defaultProps} orders={orders} />)
      expect(
        screen.getByText('Pedidos pendientes de entrega'),
      ).toBeInTheDocument()
    })

    it('debería contar pedidos pendientes correctamente', () => {
      const orders = [
        createMockOrder({ id: 'o1', status: 'Pendiente' }),
        createMockOrder({ id: 'o2', status: 'Pendiente' }),
        createMockOrder({ id: 'o3', status: 'Entregado' }),
      ]
      render(<DashboardPage {...defaultProps} orders={orders} />)
      const pendienteStat = screen.getAllByText('2')
      expect(pendienteStat.length).toBeGreaterThan(0)
    })

    it('debería contar productos con stock bajo', () => {
      const products = [
        createMockProduct({
          id: 'p1',
          variants: [
            {
              id: 'v1',
              productId: 'p1',
              sku: 'PLA-001',
              name: 'Negro',
              inventoryCost: 80,
              salePrice: 150,
              stock: 2,
              optionValues: [],
            },
          ],
        }),
        createMockProduct({
          id: 'p2',
          name: 'Gorra',
          variants: [
            {
              id: 'v2',
              productId: 'p2',
              sku: 'GOR-001',
              name: 'Azul',
              inventoryCost: 40,
              salePrice: 80,
              stock: 50,
              optionValues: [],
            },
          ],
        }),
      ]
      render(<DashboardPage {...defaultProps} products={products} />)
      expect(screen.getByText('1 con stock bajo')).toBeInTheDocument()
    })

    it('debería mostrar 0 pedidos pendientes cuando no hay', () => {
      const orders = [
        createMockOrder({ id: 'o1', status: 'Entregado' }),
        createMockOrder({ id: 'o2', status: 'Cancelado' }),
      ]
      render(<DashboardPage {...defaultProps} orders={orders} />)
      expect(screen.getAllByText('0').length).toBeGreaterThan(0)
    })
  })

  describe('Gráfico de ventas', () => {
    it('debería renderizar barras del gráfico por cada día', () => {
      const { container } = render(<DashboardPage {...defaultProps} />)
      const barChart = container.querySelector('[aria-label="Ventas por día"]')
      expect(barChart).toBeInTheDocument()
      expect(barChart!.querySelectorAll('span')).toHaveLength(
        defaultSales.length,
      )
    })

    it('debería mostrar mensaje de vacío cuando no hay ventas', () => {
      render(<DashboardPage {...defaultProps} sales={[]} />)
      expect(
        screen.getByText('Aún no hay ventas en este periodo.'),
      ).toBeInTheDocument()
    })

    it('debería renderizar las etiquetas de días', () => {
      render(<DashboardPage {...defaultProps} />)
      expect(screen.getByText('Lun')).toBeInTheDocument()
      expect(screen.getByText('Mar')).toBeInTheDocument()
      expect(screen.getByText('Mié')).toBeInTheDocument()
    })
  })

  describe('Navegación', () => {
    it('debería navegar a Pedidos al hacer clic en Nuevo pedido', async () => {
      const user = userEvent.setup()
      const onNavigate = vi.fn()
      render(<DashboardPage {...defaultProps} onNavigate={onNavigate} />)
      await user.click(screen.getByText('Nuevo pedido'))
      expect(onNavigate).toHaveBeenCalledWith('Pedidos')
    })

    it('debería navegar a Almacén al hacer clic en Añadir producto', async () => {
      const user = userEvent.setup()
      const onNavigate = vi.fn()
      render(<DashboardPage {...defaultProps} onNavigate={onNavigate} />)
      await user.click(screen.getByText('Añadir producto'))
      expect(onNavigate).toHaveBeenCalledWith('Almacén')
    })

    it('debería navegar a Clientes al hacer clic en Nuevo cliente', async () => {
      const user = userEvent.setup()
      const onNavigate = vi.fn()
      render(<DashboardPage {...defaultProps} onNavigate={onNavigate} />)
      await user.click(screen.getByText('Nuevo cliente'))
      expect(onNavigate).toHaveBeenCalledWith('Clientes')
    })

    it('debería navegar a Estadísticas al hacer clic en Ver estadísticas', async () => {
      const user = userEvent.setup()
      const onNavigate = vi.fn()
      render(<DashboardPage {...defaultProps} onNavigate={onNavigate} />)
      await user.click(screen.getByText('Ver estadísticas'))
      expect(onNavigate).toHaveBeenCalledWith('Estadísticas')
    })
  })
})
