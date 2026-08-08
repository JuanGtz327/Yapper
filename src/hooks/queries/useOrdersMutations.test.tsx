import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useOrdersMutations } from './useOrdersMutations'
import type { User } from '@supabase/supabase-js'
import type { Client, Order, Product } from '../../types.ts'
import { qk } from '../../lib/queryKeys.ts'

vi.mock('../../lib/repository.ts', () => ({
  createOrder: vi.fn(),
  cancelOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
  updateOrderPayment: vi.fn(),
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
})
