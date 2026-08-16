import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useOrdersMutations } from './useOrdersMutations'
import type { User } from '@supabase/supabase-js'
import type { Client, Order, Product } from '../../types.ts'
import { qk } from '../../lib/queryKeys.ts'

vi.mock('../../lib/repository.ts', () => ({
  createOrder: vi.fn(),
  updateOrder: vi.fn(),
  cancelOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
  updateOrderPayment: vi.fn(),
  registerPayment: vi.fn(),
}))

const mockUser = { id: 'user-1' } as User

const mockClients: Client[] = [
  {
    id: 'c1',
    name: 'Juan Pérez',
    phone: '5512345678',
    zone: 'Centro',
    orders: 5,
    initials: 'JP',
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
        optionValues: [],
      },
    ],
  },
]

const mockOrders: Order[] = [
  {
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
    itemLines: [{ variantId: 'v1', quantity: 2 }],
  },
]

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  queryClient.setQueryData(qk.clients(mockUser), mockClients)
  queryClient.setQueryData(qk.products(mockUser), mockProducts)
  queryClient.setQueryData(qk.orders(mockUser), mockOrders)
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useOrdersMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('debería crear un pedido correctamente', async () => {
      const { createOrder } = await import('../../lib/repository.ts')
      vi.mocked(createOrder).mockResolvedValue('db-new')

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.create.mutateAsync({
          clientId: 'c1',
          items: [{ variantId: 'v1', quantity: 2 }],
          payment: 'paid',
        })
      })

      expect(createOrder).toHaveBeenCalledWith(
        'c1',
        [{ variantId: 'v1', quantity: 2 }],
        'paid',
        'Juan Pérez',
      )
    })

    it('debería actualizar el caché de pedidos al crear', async () => {
      const { createOrder } = await import('../../lib/repository.ts')
      vi.mocked(createOrder).mockResolvedValue('db-new')

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.create.mutateAsync({
          clientId: 'c1',
          items: [{ variantId: 'v1', quantity: 1 }],
          payment: 'paid',
        })
      })

      await waitFor(() => {
        expect(result.current.create.isSuccess).toBe(true)
      })
    })

    it('debería reducir el stock del variant al crear', async () => {
      const { createOrder } = await import('../../lib/repository.ts')
      vi.mocked(createOrder).mockResolvedValue('db-new')

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.products(mockUser), mockProducts)

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.create.mutateAsync({
          clientId: 'c1',
          items: [{ variantId: 'v1', quantity: 2 }],
          payment: 'paid',
        })
      })

      const updatedProducts = queryClient.getQueryData<Product[]>(
        qk.products(mockUser),
      )
      expect(updatedProducts?.[0].variants[0].stock).toBe(23)
    })

    it('debería incrementar el conteo de pedidos del cliente', async () => {
      const { createOrder } = await import('../../lib/repository.ts')
      vi.mocked(createOrder).mockResolvedValue('db-new')

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.clients(mockUser), mockClients)

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.create.mutateAsync({
          clientId: 'c1',
          items: [{ variantId: 'v1', quantity: 1 }],
          payment: 'paid',
        })
      })

      const updatedClients = queryClient.getQueryData<Client[]>(
        qk.clients(mockUser),
      )
      expect(updatedClients?.[0].orders).toBe(6)
    })

    it('debería funcionar en modo demo sin usuario', async () => {
      const { result } = renderHook(() => useOrdersMutations(null), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.create.mutateAsync({
          clientId: 'c1',
          items: [{ variantId: 'v1', quantity: 1 }],
          payment: 'pending',
        })
      })

      await waitFor(() => {
        expect(result.current.create.isSuccess).toBe(true)
      })
    })
  })

  describe('cancel', () => {
    it('debería cancelar un pedido con databaseId', async () => {
      const { cancelOrder } = await import('../../lib/repository.ts')
      vi.mocked(cancelOrder).mockResolvedValue(undefined)

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.cancel.mutateAsync(mockOrders[0])
      })

      expect(cancelOrder).toHaveBeenCalledWith('db-1')
    })

    it('debería actualizar el estado del pedido a Cancelado', async () => {
      const { cancelOrder } = await import('../../lib/repository.ts')
      vi.mocked(cancelOrder).mockResolvedValue(undefined)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.orders(mockUser), mockOrders)

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.cancel.mutateAsync(mockOrders[0])
      })

      const updatedOrders = queryClient.getQueryData<Order[]>(
        qk.orders(mockUser),
      )
      expect(updatedOrders?.[0].status).toBe('Cancelado')
    })

    it('debería reducir el conteo de pedidos del cliente', async () => {
      const { cancelOrder } = await import('../../lib/repository.ts')
      vi.mocked(cancelOrder).mockResolvedValue(undefined)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.clients(mockUser), mockClients)

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.cancel.mutateAsync(mockOrders[0])
      })

      const updatedClients = queryClient.getQueryData<Client[]>(
        qk.clients(mockUser),
      )
      expect(updatedClients?.[0].orders).toBe(4)
    })

    it('debería restaurar el stock al cancelar un pedido demo', async () => {
      const demoOrder: Order = {
        id: '#DEMO-001',
        clientId: 'c1',
        client: 'Juan Pérez',
        date: 'Ahora',
        items: 2,
        total: 300,
        paidAmount: 300,
        status: 'Pendiente',
        payment: 'Pagado',
        itemLines: [{ variantId: 'v1', quantity: 2 }],
      }

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.products(mockUser), mockProducts)

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.cancel.mutateAsync(demoOrder)
      })

      const updatedProducts = queryClient.getQueryData<Product[]>(
        qk.products(mockUser),
      )
      expect(updatedProducts?.[0].variants[0].stock).toBe(27)
    })
  })

  describe('updateStatus', () => {
    it('debería actualizar el estado del pedido a Entregado', async () => {
      const { updateOrderStatus } = await import('../../lib/repository.ts')
      vi.mocked(updateOrderStatus).mockResolvedValue(undefined)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.orders(mockUser), mockOrders)

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.updateStatus.mutateAsync({
          order: mockOrders[0],
          status: 'delivered',
        })
      })

      const updatedOrders = queryClient.getQueryData<Order[]>(
        qk.orders(mockUser),
      )
      expect(updatedOrders?.[0].status).toBe('Entregado')
    })

    it('debería actualizar el estado del pedido a Pendiente', async () => {
      const deliveredOrder: Order = {
        ...mockOrders[0],
        status: 'Entregado',
      }

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.orders(mockUser), [deliveredOrder])

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.updateStatus.mutateAsync({
          order: deliveredOrder,
          status: 'pending',
        })
      })

      const updatedOrders = queryClient.getQueryData<Order[]>(
        qk.orders(mockUser),
      )
      expect(updatedOrders?.[0].status).toBe('Pendiente')
    })

    it('debería llamar a updateOrderStatus para pedidos con databaseId', async () => {
      const { updateOrderStatus } = await import('../../lib/repository.ts')
      vi.mocked(updateOrderStatus).mockResolvedValue(undefined)

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.updateStatus.mutateAsync({
          order: mockOrders[0],
          status: 'delivered',
        })
      })

      expect(updateOrderStatus).toHaveBeenCalledWith('db-1', 'delivered')
    })

    it('no debería llamar a updateOrderStatus para pedidos demo', async () => {
      const { updateOrderStatus } = await import('../../lib/repository.ts')
      vi.mocked(updateOrderStatus).mockResolvedValue(undefined)

      const demoOrder: Order = {
        id: '#DEMO-001',
        clientId: 'c1',
        client: 'Juan Pérez',
        date: 'Ahora',
        items: 1,
        total: 150,
        paidAmount: 150,
        status: 'Pendiente',
        payment: 'Pagado',
        itemLines: [{ variantId: 'v1', quantity: 1 }],
      }

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.updateStatus.mutateAsync({
          order: demoOrder,
          status: 'delivered',
        })
      })

      expect(updateOrderStatus).not.toHaveBeenCalled()
    })
  })

  describe('updatePayment', () => {
    it('debería actualizar el estado de pago a Pagado', async () => {
      const { updateOrderPayment } = await import('../../lib/repository.ts')
      vi.mocked(updateOrderPayment).mockResolvedValue(undefined)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.orders(mockUser), mockOrders)

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.updatePayment.mutateAsync({
          order: mockOrders[0],
          payment: 'paid',
        })
      })

      const updatedOrders = queryClient.getQueryData<Order[]>(
        qk.orders(mockUser),
      )
      expect(updatedOrders?.[0].payment).toBe('Pagado')
    })

    it('debería actualizar el estado de pago a Pendiente', async () => {
      const paidOrder: Order = {
        ...mockOrders[0],
        payment: 'Pagado',
      }

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.orders(mockUser), [paidOrder])

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.updatePayment.mutateAsync({
          order: paidOrder,
          payment: 'pending',
        })
      })

      const updatedOrders = queryClient.getQueryData<Order[]>(
        qk.orders(mockUser),
      )
      expect(updatedOrders?.[0].payment).toBe('Pendiente')
    })

    it('debería llamar a updateOrderPayment para pedidos con databaseId', async () => {
      const { updateOrderPayment } = await import('../../lib/repository.ts')
      vi.mocked(updateOrderPayment).mockResolvedValue(undefined)

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.updatePayment.mutateAsync({
          order: mockOrders[0],
          payment: 'paid',
        })
      })

      expect(updateOrderPayment).toHaveBeenCalledWith('db-1', 'paid')
    })

    it('no debería llamar a updateOrderPayment para pedidos demo', async () => {
      const { updateOrderPayment } = await import('../../lib/repository.ts')
      vi.mocked(updateOrderPayment).mockResolvedValue(undefined)

      const demoOrder: Order = {
        id: '#DEMO-001',
        clientId: 'c1',
        client: 'Juan Pérez',
        date: 'Ahora',
        items: 1,
        total: 150,
        paidAmount: 150,
        status: 'Pendiente',
        payment: 'Pagado',
        itemLines: [{ variantId: 'v1', quantity: 1 }],
      }

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.updatePayment.mutateAsync({
          order: demoOrder,
          payment: 'pending',
        })
      })

      expect(updateOrderPayment).not.toHaveBeenCalled()
    })
  })

  describe('Cálculo de total en create', () => {
    it('debería calcular el total correctamente basado en precios de variantes', async () => {
      const { createOrder } = await import('../../lib/repository.ts')
      vi.mocked(createOrder).mockResolvedValue('db-new')

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.clients(mockUser), mockClients)
      queryClient.setQueryData(qk.products(mockUser), mockProducts)
      queryClient.setQueryData(qk.orders(mockUser), [])

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.create.mutateAsync({
          clientId: 'c1',
          items: [{ variantId: 'v1', quantity: 3 }],
          payment: 'paid',
        })
      })

      const orders = queryClient.getQueryData<Order[]>(qk.orders(mockUser))
      expect(orders![0].total).toBe(450) // 150 * 3
    })

    it('debería generar ID de pedido con formato correcto', async () => {
      const { createOrder } = await import('../../lib/repository.ts')
      vi.mocked(createOrder).mockResolvedValue('db-abc123')

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.clients(mockUser), mockClients)
      queryClient.setQueryData(qk.products(mockUser), mockProducts)
      queryClient.setQueryData(qk.orders(mockUser), [])

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.create.mutateAsync({
          clientId: 'c1',
          items: [{ variantId: 'v1', quantity: 1 }],
          payment: 'paid',
        })
      })

      const orders = queryClient.getQueryData<Order[]>(qk.orders(mockUser))
      expect(orders![0].id).toMatch(/^#DB-AB/)
    })
  })

  describe('registerPayment', () => {
    it('debería llamar a registerPayment del repository', async () => {
      const { registerPayment } = await import('../../lib/repository.ts')
      vi.mocked(registerPayment).mockResolvedValue({ id: 'pay-1' })

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.registerPayment.mutateAsync({
          orderId: 'db-1',
          amount: 50,
          paymentMethod: 'Efectivo',
        })
      })

      expect(registerPayment).toHaveBeenCalledWith(
        'db-1',
        50,
        'Efectivo',
        undefined,
        undefined,
      )
    })

    it('debería enviar reference y notes cuando se proporcionan', async () => {
      const { registerPayment } = await import('../../lib/repository.ts')
      vi.mocked(registerPayment).mockResolvedValue({ id: 'pay-1' })

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.registerPayment.mutateAsync({
          orderId: 'db-1',
          amount: 100,
          paymentMethod: 'Transferencia',
          reference: 'REF-123',
          notes: 'Primer abono',
        })
      })

      expect(registerPayment).toHaveBeenCalledWith(
        'db-1',
        100,
        'Transferencia',
        'REF-123',
        'Primer abono',
      )
    })

    it('debería invalidar el cache de pedidos y ventas después del registro', async () => {
      const { registerPayment } = await import('../../lib/repository.ts')
      vi.mocked(registerPayment).mockResolvedValue({ id: 'pay-1' })

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      queryClient.setQueryData(qk.orders(mockUser), mockOrders)

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.registerPayment.mutateAsync({
          orderId: 'db-1',
          amount: 50,
          paymentMethod: 'Efectivo',
        })
      })

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: qk.orders(mockUser),
        })
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: qk.sales(mockUser, '7d'),
        })
      })

      invalidateSpy.mockRestore()
    })

    it('debería registrar múltiples abonos secuencialmente', async () => {
      const { registerPayment } = await import('../../lib/repository.ts')
      vi.mocked(registerPayment)
        .mockResolvedValueOnce({ id: 'pay-1' })
        .mockResolvedValueOnce({ id: 'pay-2' })

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.registerPayment.mutateAsync({
          orderId: 'db-1',
          amount: 30,
          paymentMethod: 'Efectivo',
        })
      })

      await act(async () => {
        await result.current.registerPayment.mutateAsync({
          orderId: 'db-1',
          amount: 40,
          paymentMethod: 'Transferencia',
          reference: 'REF-789',
        })
      })

      expect(registerPayment).toHaveBeenCalledTimes(2)
      expect(registerPayment).toHaveBeenLastCalledWith(
        'db-1',
        40,
        'Transferencia',
        'REF-789',
        undefined,
      )
    })

    it('debería lanzar error cuando el repository falla', async () => {
      const { registerPayment } = await import('../../lib/repository.ts')
      vi.mocked(registerPayment).mockRejectedValue(
        new Error('Payment amount exceeds remaining balance'),
      )

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await expect(
        result.current.registerPayment.mutateAsync({
          orderId: 'db-1',
          amount: 500,
          paymentMethod: 'Efectivo',
        }),
      ).rejects.toThrow('Payment amount exceeds remaining balance')
    })
  })

  describe('Rollback en error', () => {
    it('debería revertir el estado de updateStatus cuando falla la API', async () => {
      const { updateOrderStatus } = await import('../../lib/repository.ts')
      vi.mocked(updateOrderStatus).mockRejectedValue(new Error('API error'))

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.orders(mockUser), mockOrders)

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        try {
          await result.current.updateStatus.mutateAsync({
            order: mockOrders[0],
            status: 'delivered',
          })
        } catch {
          // Expected error
        }
      })

      // After error, the status should be reverted by onError
      await waitFor(() => {
        const orders = queryClient.getQueryData<Order[]>(qk.orders(mockUser))
        expect(orders![0].status).toBe('Pendiente')
      })
    })

    it('debería revertir el estado de updatePayment cuando falla la API', async () => {
      const { updateOrderPayment } = await import('../../lib/repository.ts')
      vi.mocked(updateOrderPayment).mockRejectedValue(new Error('API error'))

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.orders(mockUser), mockOrders)

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        try {
          await result.current.updatePayment.mutateAsync({
            order: mockOrders[0],
            payment: 'pending',
          })
        } catch {
          // Expected error
        }
      })

      // After error, the payment should be reverted by onError
      await waitFor(() => {
        const orders = queryClient.getQueryData<Order[]>(qk.orders(mockUser))
        expect(orders![0].payment).toBe('Pagado')
      })
    })
  })

  describe('update', () => {
    it('debería ajustar stock para pedido demo (old restored, new deducted)', async () => {
      const demoOrder: Order = {
        id: '#DEMO-001',
        clientId: 'c1',
        client: 'Juan Pérez',
        date: 'Ahora',
        items: 2,
        total: 300,
        paidAmount: 300,
        status: 'Pendiente',
        payment: 'Pagado',
        itemLines: [{ variantId: 'v1', quantity: 2 }],
      }

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.clients(mockUser), mockClients)
      queryClient.setQueryData(qk.products(mockUser), mockProducts)
      queryClient.setQueryData(qk.orders(mockUser), [demoOrder])

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.update.mutateAsync({
          order: demoOrder,
          clientId: 'c1',
          items: [{ variantId: 'v1', quantity: 3 }],
          payment: 'paid',
        })
      })

      const products = queryClient.getQueryData<Product[]>(qk.products(mockUser))
      expect(products![0].variants[0].stock).toBe(24) // 25 - 3 + 2(old) = 24
    })

    it('debería transferir conteo de pedidos del cliente al cambiar clientId', async () => {
      const demoOrder: Order = {
        id: '#DEMO-001',
        clientId: 'c1',
        client: 'Juan Pérez',
        date: 'Ahora',
        items: 1,
        total: 150,
        paidAmount: 150,
        status: 'Pendiente',
        payment: 'Pagado',
        itemLines: [{ variantId: 'v1', quantity: 1 }],
      }

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.clients(mockUser), [
        { ...mockClients[0], orders: 5 },
        { id: 'c2', name: 'María', phone: '5598765432', zone: 'Norte', orders: 3, initials: 'MG' },
      ])
      queryClient.setQueryData(qk.products(mockUser), mockProducts)
      queryClient.setQueryData(qk.orders(mockUser), [demoOrder])

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.update.mutateAsync({
          order: demoOrder,
          clientId: 'c2',
          items: [{ variantId: 'v1', quantity: 1 }],
          payment: 'paid',
        })
      })

      const clients = queryClient.getQueryData<Client[]>(qk.clients(mockUser))
      expect(clients!.find((c) => c.id === 'c1')!.orders).toBe(4) // 5 - 1
      expect(clients!.find((c) => c.id === 'c2')!.orders).toBe(4) // 3 + 1
    })

    it('debería actualizar datos del pedido en caché para demo', async () => {
      const demoOrder: Order = {
        id: '#DEMO-001',
        clientId: 'c1',
        client: 'Juan Pérez',
        date: 'Ahora',
        items: 1,
        total: 150,
        paidAmount: 150,
        status: 'Pendiente',
        payment: 'Pagado',
        itemLines: [{ variantId: 'v1', quantity: 1 }],
      }

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.clients(mockUser), mockClients)
      queryClient.setQueryData(qk.products(mockUser), mockProducts)
      queryClient.setQueryData(qk.orders(mockUser), [demoOrder])

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.update.mutateAsync({
          order: demoOrder,
          clientId: 'c1',
          items: [{ variantId: 'v1', quantity: 5 }],
          payment: 'pending',
        })
      })

      const orders = queryClient.getQueryData<Order[]>(qk.orders(mockUser))
      expect(orders![0].items).toBe(5)
      expect(orders![0].total).toBe(750) // 150 * 5
      expect(orders![0].payment).toBe('Pendiente')
    })

    it('debería llamar a updateOrder para pedidos con databaseId', async () => {
      const { updateOrder } = await import('../../lib/repository.ts')
      vi.mocked(updateOrder).mockResolvedValue(undefined)

      const dbOrder: Order = {
        id: '#DB-001',
        databaseId: 'db-1',
        clientId: 'c1',
        client: 'Juan Pérez',
        date: '15 ene 2026',
        items: 2,
        total: 300,
        paidAmount: 300,
        status: 'Pendiente',
        payment: 'Pagado',
        itemLines: [{ variantId: 'v1', quantity: 2 }],
      }

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.update.mutateAsync({
          order: dbOrder,
          clientId: 'c1',
          items: [{ variantId: 'v1', quantity: 3 }],
          payment: 'pending',
        })
      })

      expect(updateOrder).toHaveBeenCalledWith(
        'db-1',
        'c1',
        [{ variantId: 'v1', quantity: 3 }],
        'pending',
        'Juan Pérez',
      )
    })

    it('debería invalidar queries después de actualizar pedidos DB', async () => {
      const { updateOrder } = await import('../../lib/repository.ts')
      vi.mocked(updateOrder).mockResolvedValue(undefined)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      queryClient.setQueryData(qk.clients(mockUser), mockClients)
      queryClient.setQueryData(qk.products(mockUser), mockProducts)
      queryClient.setQueryData(qk.orders(mockUser), [])

      const dbOrder: Order = {
        id: '#DB-001',
        databaseId: 'db-1',
        clientId: 'c1',
        client: 'Juan Pérez',
        date: '15 ene 2026',
        items: 2,
        total: 300,
        paidAmount: 300,
        status: 'Pendiente',
        payment: 'Pagado',
        itemLines: [{ variantId: 'v1', quantity: 2 }],
      }

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.update.mutateAsync({
          order: dbOrder,
          clientId: 'c1',
          items: [{ variantId: 'v1', quantity: 3 }],
          payment: 'paid',
        })
      })

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: qk.orders(mockUser),
        })
      })
    })

    it('debería propagar errores de updateOrder', async () => {
      const { updateOrder } = await import('../../lib/repository.ts')
      vi.mocked(updateOrder).mockRejectedValue(new Error('RPC failed'))

      const dbOrder: Order = {
        id: '#DB-001',
        databaseId: 'db-1',
        clientId: 'c1',
        client: 'Juan Pérez',
        date: '15 ene 2026',
        items: 2,
        total: 300,
        paidAmount: 300,
        status: 'Pendiente',
        payment: 'Pagado',
        itemLines: [{ variantId: 'v1', quantity: 2 }],
      }

      const { result } = renderHook(() => useOrdersMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        try {
          await result.current.update.mutateAsync({
            order: dbOrder,
            clientId: 'c1',
            items: [{ variantId: 'v1', quantity: 3 }],
            payment: 'paid',
          })
        } catch {
          // Expected
        }
      })

      expect(updateOrder).toHaveBeenCalled()
    })
  })
})
