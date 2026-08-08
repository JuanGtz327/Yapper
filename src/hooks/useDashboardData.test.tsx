import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboardData } from './useDashboardData'
import type { User } from '@supabase/supabase-js'
import type { Product, Client, Order } from '../types.ts'

vi.mock('../lib/security.ts', () => ({
  isSafeImageUrl: (v: string | null | undefined) => {
    if (!v) return false
    try { return new URL(v).protocol === 'https:' } catch { return false }
  },
}))

vi.mock('../lib/whatsapp.ts', () => ({
  normalizeMexicanWhatsApp: (v: string) => {
    const digits = v.replace(/\D/g, '').replace(/^00/, '')
    if (/^521\d{10}$/.test(digits)) return `52${digits.slice(3)}`
    if (/^52\d{10}$/.test(digits)) return digits
    if (/^\d{10}$/.test(digits)) return `52${digits}`
    return null
  },
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('react-toastify', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

const mockCreateProduct = vi.fn()
const mockUpdateProduct = vi.fn()
const mockRemoveProduct = vi.fn()
const mockCreateClient = vi.fn()
const mockUpdateClient = vi.fn()
const mockRemoveClient = vi.fn()
const mockCreateOrder = vi.fn()
const mockCancelOrder = vi.fn()
const mockUpdateOrderStatus = vi.fn()
const mockUpdateOrderPayment = vi.fn()
const mockUpdateSettings = vi.fn()

let mockProductsQueryError = false

vi.mock('./queries/useProducts.ts', () => ({
  useProductsQuery: () => ({
    data: mockProductsData,
    isLoading: false,
    isError: mockProductsQueryError,
  }),
}))

vi.mock('./queries/useClients.ts', () => ({
  useClientsQuery: () => ({
    data: mockClientsData,
    isLoading: false,
    isError: false,
  }),
}))

vi.mock('./queries/useOrders.ts', () => ({
  useOrdersQuery: () => ({
    data: mockOrdersData,
    isLoading: false,
    isError: false,
  }),
}))

vi.mock('./queries/useSettings.ts', () => ({
  useSettingsQuery: () => ({
    data: {
      businessName: 'Mi negocio',
      currency: 'MXN',
      lowStockThreshold: 5,
      publicCatalogEnabled: false,
      publicSlug: '',
      whatsappNumber: '',
      publicIntro: '',
    },
    isLoading: false,
    isError: false,
  }),
}))

vi.mock('./queries/useSales.ts', () => ({
  useSalesQuery: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
}))

vi.mock('./queries/useCategories.ts', () => ({
  useCategoriesQuery: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
}))

vi.mock('./queries/useOptionTypes.ts', () => ({
  useOptionTypesQuery: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
}))

vi.mock('./queries/useProductsMutations.ts', () => ({
  useProductsMutations: () => ({
    create: { mutateAsync: mockCreateProduct },
    update: { mutateAsync: mockUpdateProduct },
    remove: { mutateAsync: mockRemoveProduct },
  }),
}))

vi.mock('./queries/useClientsMutations.ts', () => ({
  useClientsMutations: () => ({
    create: { mutateAsync: mockCreateClient },
    update: { mutateAsync: mockUpdateClient },
    remove: { mutateAsync: mockRemoveClient },
  }),
}))

vi.mock('./queries/useOrdersMutations.ts', () => ({
  useOrdersMutations: () => ({
    create: { mutateAsync: mockCreateOrder },
    cancel: { mutateAsync: mockCancelOrder },
    updateStatus: { mutateAsync: mockUpdateOrderStatus },
    updatePayment: { mutateAsync: mockUpdateOrderPayment },
  }),
}))

vi.mock('./queries/useSettingsMutation.ts', () => ({
  useSettingsMutation: () => ({
    mutateAsync: mockUpdateSettings,
  }),
}))

let mockProductsData: Product[] = []
let mockClientsData: Client[] = []
let mockOrdersData: Order[] = []

const mockUser = { id: 'user-1' } as User

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function createFormEvent(data: Record<string, string>) {
  const form = document.createElement('form')
  for (const [key, value] of Object.entries(data)) {
    const input = document.createElement('input')
    input.name = key
    input.value = value
    form.appendChild(input)
  }
  return { preventDefault: vi.fn(), currentTarget: form } as unknown as React.FormEvent<HTMLFormElement>
}

describe('useDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProductsData = [
      {
        id: 'p1', name: 'Playera', category: 'Ropa', categoryId: 'cat1',
        published: true, publicDescription: '', imageUrl: null, color: 'sky',
        variants: [{ id: 'v1', productId: 'p1', sku: 'PLA-001', name: 'Negro', inventoryCost: 80, salePrice: 150, stock: 25, optionValues: [] }],
      },
    ]
    mockClientsData = [
      { id: 'c1', name: 'Juan Pérez', phone: '5512345678', zone: 'Centro', orders: 5, initials: 'JP' },
    ]
    mockOrdersData = [
      {
        id: '#PED-001', databaseId: 'db-1', clientId: 'c1', client: 'Juan Pérez',
        date: '15 ene 2026', items: 2, total: 300, status: 'Pendiente', payment: 'Pagado',
        itemLines: [{ variantId: 'v1', quantity: 2 }],
      },
    ]
  })

  describe('addProduct — validación', () => {
    it('debería rechazar nombre con menos de 2 caracteres', async () => {
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })
      const event = createFormEvent({ name: 'A', sku: 'SKU-001', salePrice: '100', stock: '10' })

      let returned: boolean | undefined
      await act(async () => { returned = await result.current.addProduct(event, null) })

      expect(returned).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith('El nombre debe tener entre 2 y 120 caracteres.', expect.anything())
      expect(mockCreateProduct).not.toHaveBeenCalled()
    })

    it('debería rechazar nombre con más de 120 caracteres', async () => {
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })
      const event = createFormEvent({ name: 'A'.repeat(121), sku: 'SKU-001', salePrice: '100', stock: '10' })

      let returned: boolean | undefined
      await act(async () => { returned = await result.current.addProduct(event, null) })

      expect(returned).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith('El nombre debe tener entre 2 y 120 caracteres.', expect.anything())
    })

    it('debería rechazar SKU vacío al crear', async () => {
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })
      const event = createFormEvent({ name: 'Playera', sku: '', salePrice: '100', stock: '10' })

      let returned: boolean | undefined
      await act(async () => { returned = await result.current.addProduct(event, null) })

      expect(returned).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith('El SKU es obligatorio.', expect.anything())
    })

    it('debería rechazar precio negativo al crear', async () => {
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })
      const event = createFormEvent({ name: 'Playera', sku: 'SKU-001', salePrice: '-50', stock: '10' })

      let returned: boolean | undefined
      await act(async () => { returned = await result.current.addProduct(event, null) })

      expect(returned).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('precio'), expect.anything())
    })

    it('debería rechazar stock no entero al crear', async () => {
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })
      const event = createFormEvent({ name: 'Playera', sku: 'SKU-001', salePrice: '100', stock: '3.5' })

      let returned: boolean | undefined
      await act(async () => { returned = await result.current.addProduct(event, null) })

      expect(returned).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('existencias'), expect.anything())
    })

    it('debería rechazar stock negativo al crear', async () => {
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })
      const event = createFormEvent({ name: 'Playera', sku: 'SKU-001', salePrice: '100', stock: '-5' })

      let returned: boolean | undefined
      await act(async () => { returned = await result.current.addProduct(event, null) })

      expect(returned).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('existencias'), expect.anything())
    })

    it('debería rechazar imagen HTTP', async () => {
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })
      const event = createFormEvent({
        name: 'Playera', sku: 'SKU-001', salePrice: '100', stock: '10',
        imageUrl: 'http://insegura.com/img.jpg',
      })

      let returned: boolean | undefined
      await act(async () => { returned = await result.current.addProduct(event, null) })

      expect(returned).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('HTTPS'), expect.anything())
    })

    it('debería crear producto válido', async () => {
      mockCreateProduct.mockResolvedValue(undefined)
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })
      const event = createFormEvent({
        name: 'Playera', sku: 'SKU-001', salePrice: '150', stock: '25',
        imageUrl: 'https://example.com/img.jpg',
      })

      let returned: boolean | undefined
      await act(async () => { returned = await result.current.addProduct(event, null) })

      expect(returned).toBe(true)
      expect(mockCreateProduct).toHaveBeenCalled()
      expect(mockToastSuccess).toHaveBeenCalled()
    })

    it('debería permitir imagen vacía (null)', async () => {
      mockCreateProduct.mockResolvedValue(undefined)
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })
      const event = createFormEvent({ name: 'Playera', sku: 'SKU-001', salePrice: '100', stock: '10' })

      let returned: boolean | undefined
      await act(async () => { returned = await result.current.addProduct(event, null) })

      expect(returned).toBe(true)
    })

    it('debería manejar error al crear producto', async () => {
      mockCreateProduct.mockRejectedValue(new Error('DB error'))
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })
      const event = createFormEvent({ name: 'Playera', sku: 'SKU-001', salePrice: '100', stock: '10' })

      let returned: boolean | undefined
      await act(async () => { returned = await result.current.addProduct(event, null) })

      expect(returned).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('guardar el producto'), expect.anything())
    })
  })

  describe('addProduct — edición', () => {
    it('debería actualizar producto existente sin validar SKU/precio/stock', async () => {
      mockUpdateProduct.mockResolvedValue(undefined)
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })
      const editing = mockProductsData[0]
      const event = createFormEvent({ name: 'Playera V2' })

      let returned: boolean | undefined
      await act(async () => { returned = await result.current.addProduct(event, editing) })

      expect(returned).toBe(true)
      expect(mockUpdateProduct).toHaveBeenCalled()
      expect(mockCreateProduct).not.toHaveBeenCalled()
    })
  })

  describe('addClient — validación', () => {
    it('debería rechazar nombre con menos de 2 caracteres', async () => {
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })
      const event = createFormEvent({ name: 'X' })

      let returned: boolean | undefined
      await act(async () => { returned = await result.current.addClient(event, null) })

      expect(returned).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith('El nombre debe tener entre 2 y 120 caracteres.', expect.anything())
    })

    it('debería crear cliente válido', async () => {
      mockCreateClient.mockResolvedValue(undefined)
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })
      const event = createFormEvent({ name: 'María López', phone: '5512345678', zone: 'Roma' })

      let returned: boolean | undefined
      await act(async () => { returned = await result.current.addClient(event, null) })

      expect(returned).toBe(true)
      expect(mockCreateClient).toHaveBeenCalled()
      expect(mockToastSuccess).toHaveBeenCalled()
    })

    it('debería manejar error al crear cliente', async () => {
      mockCreateClient.mockRejectedValue(new Error('DB error'))
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })
      const event = createFormEvent({ name: 'María López' })

      let returned: boolean | undefined
      await act(async () => { returned = await result.current.addClient(event, null) })

      expect(returned).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('guardar el cliente'), expect.anything())
    })
  })

  describe('removeProduct / removeClient', () => {
    it('debería eliminar producto', async () => {
      mockRemoveProduct.mockResolvedValue(undefined)
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => { await result.current.removeProduct('p1') })

      expect(result.current.confirmState).not.toBeNull()

      await act(async () => { await result.current.confirmState!.onConfirm() })

      expect(mockRemoveProduct).toHaveBeenCalledWith('p1')
      expect(mockToastSuccess).toHaveBeenCalled()
    })

    it('debería manejar error al eliminar producto', async () => {
      mockRemoveProduct.mockRejectedValue(new Error('FK violation'))
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => { await result.current.removeProduct('p1') })

      expect(result.current.confirmState).not.toBeNull()

      await act(async () => { await result.current.confirmState!.onConfirm() })

      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('eliminar el producto'), expect.anything())
    })

    it('debería eliminar cliente', async () => {
      mockRemoveClient.mockResolvedValue(undefined)
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => { await result.current.removeClient('c1') })

      expect(result.current.confirmState).not.toBeNull()

      await act(async () => { await result.current.confirmState!.onConfirm() })

      expect(mockRemoveClient).toHaveBeenCalledWith('c1')
      expect(mockToastSuccess).toHaveBeenCalled()
    })

    it('debería manejar error al eliminar cliente', async () => {
      mockRemoveClient.mockRejectedValue(new Error('FK violation'))
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => { await result.current.removeClient('c1') })

      expect(result.current.confirmState).not.toBeNull()

      await act(async () => { await result.current.confirmState!.onConfirm() })

      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('eliminar el cliente'), expect.anything())
    })
  })

  describe('addOrder', () => {
    it('debería crear pedido correctamente', async () => {
      mockCreateOrder.mockResolvedValue(undefined)
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      let returned: boolean | undefined
      await act(async () => {
        returned = await result.current.addOrder('c1', [{ variantId: 'v1', quantity: 2 }], 'paid')
      })

      expect(returned).toBe(true)
      expect(mockCreateOrder).toHaveBeenCalledWith({
        clientId: 'c1',
        items: [{ variantId: 'v1', quantity: 2 }],
        payment: 'paid',
      })
      expect(mockToastSuccess).toHaveBeenCalled()
    })

    it('debería lanzar error si el cliente no existe', async () => {
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await expect(
        result.current.addOrder('c-no-existe', [{ variantId: 'v1', quantity: 1 }], 'paid'),
      ).rejects.toThrow('Selecciona un cliente')
    })

    it('debería manejar error al crear pedido', async () => {
      mockCreateOrder.mockRejectedValue(new Error('Stock insuficiente'))
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      let returned: boolean | undefined
      await act(async () => {
        returned = await result.current.addOrder('c1', [{ variantId: 'v1', quantity: 1 }], 'paid')
      })

      expect(returned).toBe(false)
      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('crear el pedido'), expect.anything())
    })
  })

  describe('cancelExistingOrder', () => {
    it('debería saltarse cancelación si el pedido ya está cancelado', async () => {
      const cancelledOrder: Order = { ...mockOrdersData[0], status: 'Cancelado' }
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => { await result.current.changeOrderStatus(cancelledOrder, 'cancelled') })

      expect(mockCancelOrder).not.toHaveBeenCalled()
    })

    it('debería abrir confirmación al cancelar pedido', async () => {
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => { await result.current.changeOrderStatus(mockOrdersData[0], 'cancelled') })

      expect(result.current.confirmState).not.toBeNull()
      expect(result.current.confirmState?.title).toBe('Cancelar pedido')
    })
  })

  describe('changeOrderStatus', () => {
    it('debería actualizar estado a Entregado', async () => {
      mockUpdateOrderStatus.mockResolvedValue(undefined)
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => { await result.current.changeOrderStatus(mockOrdersData[0], 'delivered') })

      expect(mockUpdateOrderStatus).toHaveBeenCalledWith({ order: mockOrdersData[0], status: 'delivered' })
      expect(mockToastSuccess).toHaveBeenCalled()
    })

    it('debería manejar error al actualizar estado', async () => {
      mockUpdateOrderStatus.mockRejectedValue(new Error('Error'))
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => { await result.current.changeOrderStatus(mockOrdersData[0], 'delivered') })

      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('actualizar el estado'), expect.anything())
    })
  })

  describe('changeOrderPayment', () => {
    it('debería actualizar pago a Pagado', async () => {
      mockUpdateOrderPayment.mockResolvedValue(undefined)
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => { await result.current.changeOrderPayment(mockOrdersData[0], 'paid') })

      expect(mockUpdateOrderPayment).toHaveBeenCalledWith({ order: mockOrdersData[0], payment: 'paid' })
      expect(mockToastSuccess).toHaveBeenCalled()
    })

    it('debería manejar error al actualizar pago', async () => {
      mockUpdateOrderPayment.mockRejectedValue(new Error('Error'))
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => { await result.current.changeOrderPayment(mockOrdersData[0], 'paid') })

      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('actualizar el estado del pago'), expect.anything())
    })
  })

  describe('updateBusinessSettings — validación', () => {
    it('debería rechazar nombre con menos de 2 caracteres', async () => {
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.updateBusinessSettings({
          businessName: 'A', currency: 'MXN', lowStockThreshold: 5,
          publicCatalogEnabled: false, publicSlug: '', whatsappNumber: '', publicIntro: '',
        })
      })

      expect(mockToastError).toHaveBeenCalledWith('El nombre debe tener entre 2 y 120 caracteres.', expect.anything())
      expect(mockUpdateSettings).not.toHaveBeenCalled()
    })

    it('debería rechazar umbral negativo', async () => {
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.updateBusinessSettings({
          businessName: 'Mi negocio', currency: 'MXN', lowStockThreshold: -1,
          publicCatalogEnabled: false, publicSlug: '', whatsappNumber: '', publicIntro: '',
        })
      })

      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('umbral'), expect.anything())
    })

    it('debería rechazar umbral mayor a 10000', async () => {
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.updateBusinessSettings({
          businessName: 'Mi negocio', currency: 'MXN', lowStockThreshold: 10001,
          publicCatalogEnabled: false, publicSlug: '', whatsappNumber: '', publicIntro: '',
        })
      })

      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('umbral'), expect.anything())
    })

    it('debería rechazar slug inválido cuando catálogo público está habilitado', async () => {
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.updateBusinessSettings({
          businessName: 'Mi negocio', currency: 'MXN', lowStockThreshold: 5,
          publicCatalogEnabled: true, publicSlug: 'Slug Inválido!',
          whatsappNumber: '5512345678', publicIntro: '',
        })
      })

      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('slug'), expect.anything())
    })

    it('debería rechazar WhatsApp inválido cuando catálico público está habilitado', async () => {
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.updateBusinessSettings({
          businessName: 'Mi negocio', currency: 'MXN', lowStockThreshold: 5,
          publicCatalogEnabled: true, publicSlug: 'mi-tienda',
          whatsappNumber: '123', publicIntro: '',
        })
      })

      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('WhatsApp'), expect.anything())
    })

    it('debería guardar configuración válida', async () => {
      mockUpdateSettings.mockResolvedValue(undefined)
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.updateBusinessSettings({
          businessName: 'Mi negocio', currency: 'MXN', lowStockThreshold: 10,
          publicCatalogEnabled: true, publicSlug: 'mi-tienda',
          whatsappNumber: '5512345678', publicIntro: 'Hola',
        })
      })

      expect(mockUpdateSettings).toHaveBeenCalled()
      expect(mockToastSuccess).toHaveBeenCalled()
    })

    it('debería manejar error al guardar configuración', async () => {
      mockUpdateSettings.mockRejectedValue(new Error('DB error'))
      const { result } = renderHook(() => useDashboardData(mockUser), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.updateBusinessSettings({
          businessName: 'Mi negocio', currency: 'MXN', lowStockThreshold: 5,
          publicCatalogEnabled: false, publicSlug: '', whatsappNumber: '', publicIntro: '',
        })
      })

      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('guardar la configuración'), expect.anything())
    })
  })
})
