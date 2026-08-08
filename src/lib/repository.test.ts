import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import type { Client } from '../types.ts'

// ─── Mock de Supabase ────────────────────────────────────────

const mockRpc = vi.fn()
const supabaseFromMock = vi.fn()

vi.mock('./supabase.ts', () => ({
  supabase: {
    from: (...args: unknown[]) => supabaseFromMock(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}))

// ─── Datos de prueba ─────────────────────────────────────────

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
}

const mockClientInput: Omit<Client, 'id'> = {
  name: 'Mariana González',
  phone: '55 1234 5678',
  zone: 'Coyoacán',
  orders: 0,
  initials: 'MG',
}

const mockClientRow = {
  id: 'client-abc',
  name: 'Mariana González',
  phone: '55 1234 5678',
  address: 'Coyoacán',
}

const mockUpdatedClient: Client = {
  id: 'client-abc',
  name: 'Mariana González Updated',
  phone: '55 9876 5432',
  zone: 'Roma Norte',
  orders: 3,
  initials: 'MG',
}

// ─── Tests ───────────────────────────────────────────────────

describe('Repositorio de clientes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ data: null, error: null })
  })

  describe('createClient', () => {
    it('debería crear un cliente y devolverlo con id generado', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: mockClientRow, error: null })
      const singleMock = vi.fn().mockResolvedValue({ data: mockClientRow, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock, eq: eqMock })

      supabaseFromMock.mockReturnValue({
        insert: insertMock,
      })

      const { createClient } = await import('./repository.ts')
      const result = await createClient(mockUser, mockClientInput)

      expect(result).toEqual({
        id: 'client-abc',
        name: 'Mariana González',
        phone: '55 1234 5678',
        zone: 'Coyoacán',
        orders: 0,
        initials: 'MG',
      })
    })

    it('debería llamar a supabase.from con la tabla correcta', async () => {
      const singleMock = vi.fn().mockResolvedValue({ data: mockClientRow, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      supabaseFromMock.mockReturnValue({
        insert: insertMock,
      })

      const { createClient } = await import('./repository.ts')
      await createClient(mockUser, mockClientInput)

      expect(supabaseFromMock).toHaveBeenCalledWith('clients')
    })

    it('debería insertar los datos correctos del cliente', async () => {
      const singleMock = vi.fn().mockResolvedValue({ data: mockClientRow, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      supabaseFromMock.mockReturnValue({
        insert: insertMock,
      })

      const { createClient } = await import('./repository.ts')
      await createClient(mockUser, mockClientInput)

      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'user-123',
        name: 'Mariana González',
        phone: '55 1234 5678',
        address: 'Coyoacán',
      })
    })

    it('debería usar "Sin zona" cuando address es vacío', async () => {
      const rowWithEmptyAddress = { ...mockClientRow, address: '' }
      const singleMock = vi.fn().mockResolvedValue({ data: rowWithEmptyAddress, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      supabaseFromMock.mockReturnValue({
        insert: insertMock,
      })

      const { createClient } = await import('./repository.ts')
      const result = await createClient(mockUser, { ...mockClientInput, zone: '' })

      expect(result.zone).toBe('Sin zona')
    })

    it('debería generar iniciales a partir del nombre', async () => {
      const rowWithName = { ...mockClientRow, name: 'Carlos Alberto Pérez' }
      const singleMock = vi.fn().mockResolvedValue({ data: rowWithName, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      supabaseFromMock.mockReturnValue({
        insert: insertMock,
      })

      const { createClient } = await import('./repository.ts')
      const result = await createClient(mockUser, {
        ...mockClientInput,
        name: 'Carlos Alberto Pérez',
      })

      expect(result.initials).toBe('CA')
    })

    it('debería lanzar error cuando supabase devuelve error', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Duplicate key error' },
      })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      supabaseFromMock.mockReturnValue({
        insert: insertMock,
      })

      const { createClient } = await import('./repository.ts')
      await expect(createClient(mockUser, mockClientInput)).rejects.toThrow(
        'Duplicate key error',
      )
    })
  })

  describe('updateClient', () => {
    it('debería actualizar el cliente en supabase', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseFromMock.mockReturnValue({
        update: updateMock,
      })

      const { updateClient } = await import('./repository.ts')
      await updateClient(mockUpdatedClient)

      expect(updateMock).toHaveBeenCalledWith({
        name: 'Mariana González Updated',
        phone: '55 9876 5432',
        address: 'Roma Norte',
      })
      expect(eqMock).toHaveBeenCalledWith('id', 'client-abc')
    })

    it('debería llamar a supabase.from con la tabla clients', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseFromMock.mockReturnValue({
        update: updateMock,
      })

      const { updateClient } = await import('./repository.ts')
      await updateClient(mockUpdatedClient)

      expect(supabaseFromMock).toHaveBeenCalledWith('clients')
    })

    it('debería lanzar error cuando la actualización falla', async () => {
      const eqMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Row not found' },
      })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseFromMock.mockReturnValue({
        update: updateMock,
      })

      const { updateClient } = await import('./repository.ts')
      await expect(updateClient(mockUpdatedClient)).rejects.toThrow(
        'Row not found',
      )
    })
  })

  describe('deleteClient', () => {
    it('debería eliminar el cliente por id', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseFromMock.mockReturnValue({
        delete: deleteMock,
      })

      const { deleteClient } = await import('./repository.ts')
      await deleteClient('client-abc')

      expect(eqMock).toHaveBeenCalledWith('id', 'client-abc')
    })

    it('debería llamar a supabase.from con la tabla clients', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseFromMock.mockReturnValue({
        delete: deleteMock,
      })

      const { deleteClient } = await import('./repository.ts')
      await deleteClient('client-abc')

      expect(supabaseFromMock).toHaveBeenCalledWith('clients')
    })

    it('debería usar el método delete en la cadena', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseFromMock.mockReturnValue({
        delete: deleteMock,
      })

      const { deleteClient } = await import('./repository.ts')
      await deleteClient('client-abc')

      expect(deleteMock).toHaveBeenCalled()
    })

    it('debería lanzar error cuando la eliminación falla', async () => {
      const eqMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Foreign key violation' },
      })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseFromMock.mockReturnValue({
        delete: deleteMock,
      })

      const { deleteClient } = await import('./repository.ts')
      await expect(deleteClient('client-abc')).rejects.toThrow(
        'Foreign key violation',
      )
    })
  })
})

describe('Repositorio de productos', () => {
  describe('loadProducts', () => {
    it('debería cargar productos con variantes y option values', async () => {
      const mockProducts = [
        { id: 'p1', name: 'Playera', category_id: 'cat1', published: true, public_description: '', image_url: null },
      ]
      const mockVariants = [
        { id: 'v1', product_id: 'p1', sku: 'PLA-001', name: 'Negro', inventory_cost: 80, sale_price: 150, stock: 25 },
      ]
      const mockOptionValues = [
        { variant_id: 'v1', option_values: { name: 'Negro', option_types: { name: 'Color' } } },
      ]
      const mockCategories = [
        { id: 'cat1', name: 'Ropa' },
      ]

      const selectFn1 = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }) }) })
      const selectFn2 = vi.fn().mockReturnValue({ in: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: mockVariants, error: null }) }) }) })
      const selectFn3 = vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ data: mockOptionValues, error: null }) })
      const selectFn4 = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: mockCategories, error: null }) })

      const fns = [selectFn1, selectFn2, selectFn3, selectFn4]
      let i = 0
      supabaseFromMock.mockReset()
      supabaseFromMock.mockImplementation(() => ({ select: fns[i++] }))

      const { loadProducts } = await import('./repository.ts')
      const result = await loadProducts(mockUser)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Playera')
      expect(result[0].category).toBe('Ropa')
      expect(result[0].variants).toHaveLength(1)
      expect(result[0].variants[0].sku).toBe('PLA-001')
      expect(result[0].variants[0].optionValues).toEqual([{ optionType: 'Color', value: 'Negro' }])
    })

    it('debería devolver array vacío cuando no hay productos', async () => {
      supabaseFromMock.mockReset()
      supabaseFromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      const { loadProducts } = await import('./repository.ts')
      const result = await loadProducts(mockUser)

      expect(result).toEqual([])
    })

    it('debería usar "General" cuando category_id es null', async () => {
      const mockProducts = [
        { id: 'p1', name: 'Playera', category_id: null, published: true, public_description: '', image_url: null },
      ]

      const selectFn1 = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }) }) })
      const selectFn2 = vi.fn().mockReturnValue({ in: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) })
      // variantIds is empty → 3rd from() (variant_option_values) is skipped, so 3rd fn is categories
      const selectFn3 = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) })

      const fns = [selectFn1, selectFn2, selectFn3]
      let i = 0
      supabaseFromMock.mockReset()
      supabaseFromMock.mockImplementation(() => ({ select: fns[i++] }))

      const { loadProducts } = await import('./repository.ts')
      const result = await loadProducts(mockUser)

      expect(result[0].category).toBe('General')
    })

    it('debería lanzar error cuando supabase falla', async () => {
      supabaseFromMock.mockReset()
      supabaseFromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      })

      const { loadProducts } = await import('./repository.ts')
      await expect(loadProducts(mockUser)).rejects.toThrow('DB error')
    })
  })
})

describe('Repositorio de pedidos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createOrder', () => {
    it('debería llamar a create_order RPC con los datos correctos', async () => {
      mockRpc.mockResolvedValue({ data: 'order-123', error: null })
      const { createOrder } = await import('./repository.ts')

      const items = [
        { variantId: 'v1', quantity: 2 },
        { variantId: 'v2', quantity: 1 },
      ]

      const result = await createOrder('client-1', items, 'paid')

      expect(mockRpc).toHaveBeenCalledWith('create_order', {
        p_client_id: 'client-1',
        p_items: [
          { variant_id: 'v1', quantity: 2 },
          { variant_id: 'v2', quantity: 1 },
        ],
        p_payment_status: 'paid',
      })
      expect(result).toBe('order-123')
    })

    it('debería lanzar error cuando el RPC falla', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'Insufficient stock' } })
      const { createOrder } = await import('./repository.ts')

      await expect(
        createOrder('client-1', [{ variantId: 'v1', quantity: 1 }], 'paid'),
      ).rejects.toThrow('Insufficient stock')
    })
  })

  describe('loadOrders', () => {
    it('debería cargar pedidos con item lines', async () => {
      const mockOrders = [
        { id: 'ord-1', client_id: 'c1', status: 'pending', payment_status: 'paid', total: 300, created_at: '2026-01-15T10:30:00Z', order_number: 'PED-001' },
      ]
      const mockItems = [
        { order_id: 'ord-1', variant_id: 'v1', quantity: 2, sku_snapshot: 'PLA-001', product_name_snapshot: 'Playera', variant_label_snapshot: 'Negro', unit_price: 150, unit_cost_snapshot: 80, line_total: 300 },
      ]

      supabaseFromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: mockItems, error: null }),
          }),
        })

      const { loadOrders } = await import('./repository.ts')
      const result = await loadOrders(mockUser)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('PED-001')
      expect(result[0].status).toBe('Pendiente')
      expect(result[0].payment).toBe('Pagado')
      expect(result[0].items).toBe(2)
      expect(result[0].itemLines).toHaveLength(1)
      expect(result[0].itemLines![0].variantId).toBe('v1')
    })

    it('debería mapear status delivered a Entregado', async () => {
      const mockOrders = [
        { id: 'ord-1', client_id: 'c1', status: 'delivered', payment_status: 'paid', total: 300, created_at: '2026-01-15T10:30:00Z', order_number: 'PED-001' },
      ]

      supabaseFromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        })

      const { loadOrders } = await import('./repository.ts')
      const result = await loadOrders(mockUser)

      expect(result[0].status).toBe('Entregado')
    })

    it('debería mapear status cancelled a Cancelado', async () => {
      const mockOrders = [
        { id: 'ord-1', client_id: 'c1', status: 'cancelled', payment_status: 'pending', total: 300, created_at: '2026-01-15T10:30:00Z', order_number: 'PED-001' },
      ]

      supabaseFromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        })

      const { loadOrders } = await import('./repository.ts')
      const result = await loadOrders(mockUser)

      expect(result[0].status).toBe('Cancelado')
      expect(result[0].payment).toBe('Pendiente')
    })

    it('debería generar ID cuando order_number es null', async () => {
      const mockOrders = [
        { id: 'ord-123456', client_id: 'c1', status: 'pending', payment_status: 'paid', total: 300, created_at: '2026-01-15T10:30:00Z', order_number: null },
      ]

      supabaseFromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        })

      const { loadOrders } = await import('./repository.ts')
      const result = await loadOrders(mockUser)

      expect(result[0].id).toBe('#ORD-12')
    })

    it('debería devolver array vacío cuando no hay pedidos', async () => {
      supabaseFromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      const { loadOrders } = await import('./repository.ts')
      const result = await loadOrders(mockUser)

      expect(result).toEqual([])
    })
  })
})
