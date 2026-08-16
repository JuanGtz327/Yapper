import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { OrderTicketModal } from './OrderTicketModal'
import type { Order, Product } from '../../types.ts'

vi.mock('../../hooks/queries/useOrderPayments.ts', () => ({
  useOrderPaymentsQuery: vi
    .fn()
    .mockReturnValue({ data: [], isLoading: false }),
}))

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
  paidAmount: 300,
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
  isSubmittingPayment: false,
  onClose: vi.fn(),
  onEdit: vi.fn(),
  onStatusChange: vi.fn(),
  onPaymentChange: vi.fn(),
  onRegisterPayment: vi.fn(),
  onCancel: vi.fn(),
}

describe('OrderTicketModal', () => {
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
      expect(screen.getByText('Negro')).toBeInTheDocument()
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

    it('debería complementar un snapshot sin variante con SKU y opciones actuales', () => {
      const orderWithSnapshot = createMockOrder({
        itemLines: [
          {
            variantId: 'v1',
            quantity: 1,
            productNameSnapshot: 'Playera Vintage',
            unitPrice: 200,
          },
        ],
      })
      render(<OrderTicketModal {...defaultProps} order={orderWithSnapshot} />)

      expect(screen.getByText('Negro')).toBeInTheDocument()
    })
  })

  describe('Productos sin snapshot', () => {
    it('debería mostrar "Producto no disponible" si el producto no existe', () => {
      const orderWithMissingProduct = createMockOrder({
        itemLines: [{ variantId: 'v999', quantity: 1 }],
      })
      render(
        <OrderTicketModal {...defaultProps} order={orderWithMissingProduct} />,
      )
      expect(screen.getByText('Producto no disponible')).toBeInTheDocument()
    })

    it('debería ordenar productos y opciones alfabéticamente', () => {
      const products = [
        {
          ...defaultProps.products[0],
          name: 'Zeta',
          variants: [
            {
              ...defaultProps.products[0].variants[0],
              id: 'z1',
              optionValues: [
                { optionType: 'Talla', value: 'Mediana' },
                { optionType: 'Color', value: 'Azul' },
              ],
            },
          ],
        },
        {
          ...defaultProps.products[0],
          id: 'p2',
          name: 'Alfa',
          variants: [
            {
              ...defaultProps.products[0].variants[0],
              id: 'a1',
              optionValues: [],
            },
          ],
        },
      ]
      const order = createMockOrder({
        itemLines: [
          { variantId: 'z1', quantity: 1 },
          { variantId: 'a1', quantity: 1 },
        ],
      })
      render(
        <OrderTicketModal
          {...defaultProps}
          products={products}
          order={order}
        />,
      )

      const productNames = screen
        .getAllByRole('listitem')
        .map(
          (item) => item.querySelector('.ticket-product strong')?.textContent,
        )
      expect(productNames).toEqual(['Alfa', 'Zeta'])
      expect(screen.getByText('Azul - Mediana')).toBeInTheDocument()
    })
  })

  describe('Cancelación de pedido', () => {
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
      expect(screen.getAllByText('$1,000.00').length).toBeGreaterThan(0)
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
