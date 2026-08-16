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
      const eqMock = vi
        .fn()
        .mockResolvedValue({ data: mockClientRow, error: null })
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: mockClientRow, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi
        .fn()
        .mockReturnValue({ select: selectMock, eq: eqMock })

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
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: mockClientRow, error: null })
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
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: mockClientRow, error: null })
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
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: rowWithEmptyAddress, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      supabaseFromMock.mockReturnValue({
        insert: insertMock,
      })

      const { createClient } = await import('./repository.ts')
      const result = await createClient(mockUser, {
        ...mockClientInput,
        zone: '',
      })

      expect(result.zone).toBe('Sin zona')
    })

    it('debería generar iniciales a partir del nombre', async () => {
      const rowWithName = { ...mockClientRow, name: 'Carlos Alberto Pérez' }
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: rowWithName, error: null })
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

  describe('loadClients', () => {
    it('debería cargar clientes con order counts e iniciales', async () => {
      const mockClientRows = [
        {
          id: 'c1',
          name: 'Juan Pérez',
          phone: '5512345678',
          address: 'Centro',
        },
      ]
      const mockOrderRows = [
        { client_id: 'c1' },
        { client_id: 'c1' },
        { client_id: 'c2' },
      ]

      const orderMock = vi
        .fn()
        .mockResolvedValue({ data: mockClientRows, error: null })
      const eqUserClient = vi.fn().mockReturnValue({ order: orderMock })
      const selectClient = vi.fn().mockReturnValue({ eq: eqUserClient })

      const neqMock = vi
        .fn()
        .mockResolvedValue({ data: mockOrderRows, error: null })
      const eqUserOrder = vi.fn().mockReturnValue({ neq: neqMock })
      const selectOrder = vi.fn().mockReturnValue({ eq: eqUserOrder })

      supabaseFromMock.mockReset()
      supabaseFromMock.mockImplementation((table: string) => {
        if (table === 'clients') return { select: selectClient }
        return { select: selectOrder }
      })

      const { loadClients } = await import('./repository.ts')
      const result = await loadClients(mockUser)

      expect(result).toHaveLength(1)
      expect(result[0].zone).toBe('Centro')
      expect(result[0].orders).toBe(2)
      expect(result[0].initials).toBe('JP')
    })

    it('debería usar "Sin zona" cuando address es vacío', async () => {
      const mockClientRows = [
        { id: 'c1', name: 'Juan', phone: '5512345678', address: '' },
      ]

      const orderMock = vi
        .fn()
        .mockResolvedValue({ data: mockClientRows, error: null })
      const eqUserClient = vi.fn().mockReturnValue({ order: orderMock })
      const selectClient = vi.fn().mockReturnValue({ eq: eqUserClient })

      const neqMock = vi.fn().mockResolvedValue({ data: [], error: null })
      const eqUserOrder = vi.fn().mockReturnValue({ neq: neqMock })
      const selectOrder = vi.fn().mockReturnValue({ eq: eqUserOrder })

      supabaseFromMock.mockReset()
      supabaseFromMock.mockImplementation((table: string) => {
        if (table === 'clients') return { select: selectClient }
        return { select: selectOrder }
      })

      const { loadClients } = await import('./repository.ts')
      const result = await loadClients(mockUser)

      expect(result[0].zone).toBe('Sin zona')
    })

    it('debería propagar errores de la consulta', async () => {
      const eqUserClient = vi.fn().mockReturnValue({
        order: vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      })
      const selectClient = vi.fn().mockReturnValue({ eq: eqUserClient })

      supabaseFromMock.mockReset()
      supabaseFromMock.mockReturnValue({ select: selectClient })

      const { loadClients } = await import('./repository.ts')
      await expect(loadClients(mockUser)).rejects.toThrow('DB error')
    })
  })

  describe('loadClientsPage', () => {
    it('debería paginar resultados correctamente', async () => {
      const mockClientRows = [
        { id: 'c1', name: 'Juan', phone: '5512345678', address: 'Centro' },
      ]

      const rangeMock = vi
        .fn()
        .mockResolvedValue({ data: mockClientRows, count: 1, error: null })
      const orderMock = vi.fn().mockReturnValue({ range: rangeMock })
      const eqUserMock = vi.fn().mockReturnValue({ order: orderMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock })

      supabaseFromMock.mockReset()
      supabaseFromMock
        .mockReturnValueOnce({ select: selectMock })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        })

      const { loadClientsPage } = await import('./repository.ts')
      const result = await loadClientsPage(mockUser, { page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
    })

    it('debería propagar errores de la consulta', async () => {
      const rangeMock = vi
        .fn()
        .mockResolvedValue({
          data: null,
          count: 0,
          error: { message: 'DB error' },
        })
      const orderMock = vi.fn().mockReturnValue({ range: rangeMock })
      const eqUserMock = vi.fn().mockReturnValue({ order: orderMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock })

      supabaseFromMock.mockReset()
      supabaseFromMock.mockReturnValue({ select: selectMock })

      const { loadClientsPage } = await import('./repository.ts')
      await expect(
        loadClientsPage(mockUser, { page: 1, pageSize: 25 }),
      ).rejects.toThrow('DB error')
    })
  })
})

describe('Repositorio de productos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ data: null, error: null })
  })

  describe('createProduct', () => {
    it('debería crear un producto con defaultVariant y llamar RPC create_variant', async () => {
      const productRow = {
        id: 'p-new',
        name: 'Playera',
        category_id: 'cat1',
        published: true,
        public_description: '',
        image_url: null,
      }
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: productRow, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      supabaseFromMock.mockReturnValue({ insert: insertMock })
      mockRpc.mockResolvedValue({ data: 'v-new', error: null })

      const { createProduct } = await import('./repository.ts')
      const result = await createProduct(
        mockUser,
        {
          name: 'Playera',
          category: 'Ropa',
          categoryId: 'cat1',
          published: true,
          publicDescription: '',
          imageUrl: null,
          color: 'sky',
          variants: [],
        },
        {
          sku: 'PLA-001',
          inventoryCost: 80,
          salePrice: 150,
          stock: 25,
          optionValueIds: [],
        },
      )

      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'user-123',
        name: 'Playera',
        category_id: 'cat1',
        published: true,
        public_description: '',
        image_url: null,
      })
      expect(mockRpc).toHaveBeenCalledWith('create_variant', {
        p_product_id: 'p-new',
        p_sku: 'PLA-001',
        p_variant_name: '',
        p_inventory_cost: 80,
        p_sale_price: 150,
        p_stock: 25,
        p_option_value_ids: [],
      })
      expect(result.id).toBe('p-new')
      expect(result.variants).toHaveLength(1)
      expect(result.variants[0].sku).toBe('PLA-001')
    })

    it('debería crear un producto sin defaultVariant', async () => {
      const productRow = {
        id: 'p-new',
        name: 'Gorra',
        category_id: null,
        published: false,
        public_description: 'Desc',
        image_url: null,
      }
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: productRow, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      supabaseFromMock.mockReturnValue({ insert: insertMock })

      const { createProduct } = await import('./repository.ts')
      const result = await createProduct(mockUser, {
        name: 'Gorra',
        category: 'General',
        categoryId: null,
        published: false,
        publicDescription: 'Desc',
        imageUrl: null,
        color: 'coral',
        variants: [],
      })

      expect(result.id).toBe('p-new')
      expect(result.variants).toEqual([])
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('debería propagar errores del insert', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'insert failed' },
      })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      supabaseFromMock.mockReturnValue({ insert: insertMock })

      const { createProduct } = await import('./repository.ts')
      await expect(
        createProduct(mockUser, {
          name: 'Playera',
          category: 'Ropa',
          categoryId: 'cat1',
          published: true,
          publicDescription: '',
          imageUrl: null,
          color: 'sky',
          variants: [],
        }),
      ).rejects.toThrow('insert failed')
    })

    it('debería propagar errores del RPC create_variant', async () => {
      const productRow = {
        id: 'p-new',
        name: 'Playera',
        category_id: 'cat1',
        published: true,
        public_description: '',
        image_url: null,
      }
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: productRow, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      supabaseFromMock.mockReturnValue({ insert: insertMock })
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'variant creation failed' },
      })

      const { createProduct } = await import('./repository.ts')
      await expect(
        createProduct(
          mockUser,
          {
            name: 'Playera',
            category: 'Ropa',
            categoryId: 'cat1',
            published: true,
            publicDescription: '',
            imageUrl: null,
            color: 'sky',
            variants: [],
          },
          {
            sku: 'PLA-001',
            inventoryCost: 80,
            salePrice: 150,
            stock: 25,
            optionValueIds: [],
          },
        ),
      ).rejects.toThrow('variant creation failed')
    })
  })

  describe('createProductWithVariants', () => {
    it('debería crear producto y todas las variantes', async () => {
      const productRow = {
        id: 'p-new',
        name: 'Playera',
        category_id: 'cat1',
        published: true,
        public_description: '',
        image_url: null,
      }
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: productRow, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      const categoryRow = { name: 'Ropa' }
      const maybeSingleMock = vi
        .fn()
        .mockResolvedValue({ data: categoryRow, error: null })
      const eqCatMock = vi
        .fn()
        .mockReturnValue({ maybeSingle: maybeSingleMock })
      const selectCatMock = vi.fn().mockReturnValue({ eq: eqCatMock })

      supabaseFromMock
        .mockReturnValueOnce({ insert: insertMock })
        .mockReturnValueOnce({ select: selectCatMock })

      mockRpc
        .mockResolvedValueOnce({ data: 'v1', error: null })
        .mockResolvedValueOnce({ data: 'v2', error: null })

      const { createProductWithVariants } = await import('./repository.ts')
      const result = await createProductWithVariants(
        mockUser,
        {
          name: 'Playera',
          categoryId: 'cat1',
          published: true,
          publicDescription: '',
          imageUrl: null,
        },
        [
          {
            sku: 'PLA-001',
            name: 'Negro',
            inventoryCost: 80,
            salePrice: 150,
            stock: 25,
            optionValueIds: [],
          },
          {
            sku: 'PLA-002',
            name: 'Blanco',
            inventoryCost: 80,
            salePrice: 150,
            stock: 10,
            optionValueIds: [],
          },
        ],
      )

      expect(result.id).toBe('p-new')
      expect(result.variants).toHaveLength(2)
      expect(result.variants[0].id).toBe('v1')
      expect(result.variants[1].id).toBe('v2')
      expect(result.category).toBe('Ropa')
      expect(mockRpc).toHaveBeenCalledTimes(2)
    })

    it('debería eliminar el producto si createVariant falla (rollback)', async () => {
      const productRow = {
        id: 'p-new',
        name: 'Playera',
        category_id: 'cat1',
        published: true,
        public_description: '',
        image_url: null,
      }
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: productRow, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseFromMock
        .mockReturnValueOnce({ insert: insertMock })
        .mockReturnValueOnce({ delete: deleteMock })

      mockRpc
        .mockResolvedValueOnce({ data: 'v1', error: null })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'duplicate sku' },
        })

      const { createProductWithVariants } = await import('./repository.ts')
      await expect(
        createProductWithVariants(
          mockUser,
          {
            name: 'Playera',
            categoryId: 'cat1',
            published: true,
            publicDescription: '',
            imageUrl: null,
          },
          [
            {
              sku: 'PLA-001',
              name: 'Negro',
              inventoryCost: 80,
              salePrice: 150,
              stock: 25,
              optionValueIds: [],
            },
            {
              sku: 'PLA-001',
              name: 'Dup',
              inventoryCost: 80,
              salePrice: 150,
              stock: 10,
              optionValueIds: [],
            },
          ],
        ),
      ).rejects.toThrow('duplicate sku')

      expect(deleteMock).toHaveBeenCalled()
      expect(eqMock).toHaveBeenCalledWith('id', 'p-new')
    })

    it('debería resolver el nombre de la categoría desde categories', async () => {
      const productRow = {
        id: 'p-new',
        name: 'Gorra',
        category_id: 'cat2',
        published: true,
        public_description: '',
        image_url: null,
      }
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: productRow, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      const categoryRow = { name: 'Accesorios' }
      const maybeSingleMock = vi
        .fn()
        .mockResolvedValue({ data: categoryRow, error: null })
      const eqCatMock = vi
        .fn()
        .mockReturnValue({ maybeSingle: maybeSingleMock })
      const selectCatMock = vi.fn().mockReturnValue({ eq: eqCatMock })

      supabaseFromMock
        .mockReturnValueOnce({ insert: insertMock })
        .mockReturnValueOnce({ select: selectCatMock })

      mockRpc.mockResolvedValue({ data: 'v1', error: null })

      const { createProductWithVariants } = await import('./repository.ts')
      const result = await createProductWithVariants(
        mockUser,
        {
          name: 'Gorra',
          categoryId: 'cat2',
          published: true,
          publicDescription: '',
          imageUrl: null,
        },
        [
          {
            sku: 'GOR-001',
            name: 'Única',
            inventoryCost: 40,
            salePrice: 80,
            stock: 50,
            optionValueIds: [],
          },
        ],
      )

      expect(result.category).toBe('Accesorios')
    })

    it('debería usar "General" cuando categoryId es null', async () => {
      const productRow = {
        id: 'p-new',
        name: 'Playera',
        category_id: null,
        published: true,
        public_description: '',
        image_url: null,
      }
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: productRow, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectMock })

      supabaseFromMock.mockReturnValue({ insert: insertMock })
      mockRpc.mockResolvedValue({ data: 'v1', error: null })

      const { createProductWithVariants } = await import('./repository.ts')
      const result = await createProductWithVariants(
        mockUser,
        {
          name: 'Playera',
          categoryId: null,
          published: true,
          publicDescription: '',
          imageUrl: null,
        },
        [
          {
            sku: 'PLA-001',
            name: 'Negro',
            inventoryCost: 80,
            salePrice: 150,
            stock: 25,
            optionValueIds: [],
          },
        ],
      )

      expect(result.category).toBe('General')
    })
  })

  describe('Variant mutations', () => {
    describe('createVariant', () => {
      it('debería llamar a create_variant RPC con los datos correctos', async () => {
        mockRpc.mockResolvedValue({ data: 'v-new', error: null })

        const { createVariant } = await import('./repository.ts')
        const result = await createVariant('p1', {
          sku: 'PLA-001',
          name: 'Negro',
          inventoryCost: 80,
          salePrice: 150,
          stock: 25,
          optionValueIds: ['ov1', 'ov2'],
        })

        expect(mockRpc).toHaveBeenCalledWith('create_variant', {
          p_product_id: 'p1',
          p_sku: 'PLA-001',
          p_variant_name: 'Negro',
          p_inventory_cost: 80,
          p_sale_price: 150,
          p_stock: 25,
          p_option_value_ids: ['ov1', 'ov2'],
        })
        expect(result).toBe('v-new')
      })

      it('debería propagar errores del RPC', async () => {
        mockRpc.mockResolvedValue({
          data: null,
          error: { message: 'duplicate sku' },
        })

        const { createVariant } = await import('./repository.ts')
        await expect(
          createVariant('p1', {
            sku: 'PLA-001',
            name: 'Negro',
            inventoryCost: 80,
            salePrice: 150,
            stock: 25,
            optionValueIds: [],
          }),
        ).rejects.toThrow('duplicate sku')
      })
    })

    describe('updateVariantPrice', () => {
      it('debería llamar a update_variant_price RPC', async () => {
        mockRpc.mockResolvedValue({ data: null, error: null })

        const { updateVariantPrice } = await import('./repository.ts')
        await updateVariantPrice('v1', 200)

        expect(mockRpc).toHaveBeenCalledWith('update_variant_price', {
          p_variant_id: 'v1',
          p_sale_price: 200,
        })
      })

      it('debería propagar errores del RPC', async () => {
        mockRpc.mockResolvedValue({
          data: null,
          error: { message: 'variant not found' },
        })

        const { updateVariantPrice } = await import('./repository.ts')
        await expect(updateVariantPrice('v1', 200)).rejects.toThrow(
          'variant not found',
        )
      })
    })

    describe('deleteVariant', () => {
      it('debería llamar a delete_variant RPC', async () => {
        mockRpc.mockResolvedValue({ data: null, error: null })

        const { deleteVariant } = await import('./repository.ts')
        await deleteVariant('v1')

        expect(mockRpc).toHaveBeenCalledWith('delete_variant', {
          p_variant_id: 'v1',
        })
      })

      it('debería propagar errores del RPC', async () => {
        mockRpc.mockResolvedValue({
          data: null,
          error: { message: 'foreign key violation' },
        })

        const { deleteVariant } = await import('./repository.ts')
        await expect(deleteVariant('v1')).rejects.toThrow(
          'foreign key violation',
        )
      })
    })
  })

  describe('loadProductsPage', () => {
    function makeQueryChain(
      data: unknown[],
      count: number,
      error: unknown = null,
    ) {
      const rangeMock = vi.fn().mockResolvedValue({ data, count, error })
      const orderMock = vi.fn().mockReturnValue({ range: rangeMock })
      const eqUserMock = vi.fn().mockReturnValue({ order: orderMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock })
      return {
        select: selectMock,
        _range: rangeMock,
        _order: orderMock,
        _eqUser: eqUserMock,
      }
    }

    function makeHydrationChain() {
      const order2 = vi.fn().mockResolvedValue({ data: [], error: null })
      const eq2 = vi.fn().mockReturnValue({ order: order2 })
      const in2 = vi.fn().mockReturnValue({ eq: eq2 })
      const sel2 = vi.fn().mockReturnValue({ in: in2 })

      const eq3 = vi.fn().mockResolvedValue({ data: [], error: null })
      const sel3 = vi.fn().mockReturnValue({ eq: eq3 })

      return [sel2, sel3] as const
    }

    it('debería paginar resultados correctamente', async () => {
      const mockProducts = [
        {
          id: 'p1',
          name: 'Playera',
          category_id: null,
          published: true,
          public_description: '',
          image_url: null,
        },
      ]
      const mainQuery = makeQueryChain(mockProducts, 1)
      const [sel2, sel3] = makeHydrationChain()

      supabaseFromMock.mockReset()
      supabaseFromMock
        .mockReturnValueOnce({ select: mainQuery.select })
        .mockReturnValueOnce({ select: sel2 })
        .mockReturnValueOnce({ select: sel3 })

      const { loadProductsPage } = await import('./repository.ts')
      const result = await loadProductsPage(mockUser, { page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.totalPages).toBe(1)
    })

    it('debería devolver array vacío cuando stock filter no encuentra variantes', async () => {
      const gtMock = vi.fn().mockResolvedValue({ data: [], error: null })
      const eqStockMock = vi.fn().mockReturnValue({ gt: gtMock })
      const selStockMock = vi.fn().mockReturnValue({ eq: eqStockMock })
      const mainQuery = makeQueryChain([], 0)

      supabaseFromMock.mockReset()
      supabaseFromMock
        .mockReturnValueOnce({ select: mainQuery.select })
        .mockReturnValueOnce({ select: selStockMock })

      const { loadProductsPage } = await import('./repository.ts')
      const result = await loadProductsPage(
        mockUser,
        { page: 1, pageSize: 25 },
        { stock: 'available' },
      )

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })

    it('debería propagar errores de la consulta principal', async () => {
      const mainQuery = makeQueryChain([], 0, { message: 'DB error' })

      supabaseFromMock.mockReset()
      supabaseFromMock.mockReturnValue({ select: mainQuery.select })

      const { loadProductsPage } = await import('./repository.ts')
      await expect(
        loadProductsPage(mockUser, { page: 1, pageSize: 25 }),
      ).rejects.toThrow('DB error')
    })
  })

  describe('loadProductById', () => {
    it('debería devolver el producto hidratado cuando existe', async () => {
      const productRow = {
        id: 'p1',
        name: 'Playera',
        category_id: 'cat1',
        published: true,
        public_description: '',
        image_url: null,
      }
      const maybeSingleMock = vi
        .fn()
        .mockResolvedValue({ data: productRow, error: null })
      const eqIdMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
      const eqUserMock = vi.fn().mockReturnValue({ eq: eqIdMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock })

      const variants = vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })
      const categories = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'cat1', name: 'Ropa' }],
          error: null,
        }),
      })

      supabaseFromMock
        .mockReturnValueOnce({ select: selectMock })
        .mockReturnValueOnce({ select: variants })
        .mockReturnValueOnce({ select: categories })

      const { loadProductById } = await import('./repository.ts')
      const result = await loadProductById(mockUser, 'p1')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('p1')
      expect(result!.name).toBe('Playera')
      expect(result!.category).toBe('Ropa')
    })

    it('debería devolver null cuando el producto no existe', async () => {
      const maybeSingleMock = vi
        .fn()
        .mockResolvedValue({ data: null, error: null })
      const eqIdMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
      const eqUserMock = vi.fn().mockReturnValue({ eq: eqIdMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock })

      supabaseFromMock.mockReturnValue({ select: selectMock })

      const { loadProductById } = await import('./repository.ts')
      const result = await loadProductById(mockUser, 'no-existe')

      expect(result).toBeNull()
    })

    it('debería propagar errores de la consulta', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      })
      const eqIdMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
      const eqUserMock = vi.fn().mockReturnValue({ eq: eqIdMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock })

      supabaseFromMock.mockReturnValue({ select: selectMock })

      const { loadProductById } = await import('./repository.ts')
      await expect(loadProductById(mockUser, 'p1')).rejects.toThrow('DB error')
    })
  })

  describe('loadInventoryAggregates', () => {
    it('debería devolver costTotal, saleTotal y profitTotal', async () => {
      mockRpc.mockResolvedValue({
        data: [{ cost_total: 1000, sale_total: 2500, profit_total: 1500 }],
        error: null,
      })

      const { loadInventoryAggregates } = await import('./repository.ts')
      const result = await loadInventoryAggregates()

      expect(mockRpc).toHaveBeenCalledWith('inventory_aggregates')
      expect(result).toEqual({
        costTotal: 1000,
        saleTotal: 2500,
        profitTotal: 1500,
      })
    })

    it('debería devolver ceros cuando no hay datos', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null })

      const { loadInventoryAggregates } = await import('./repository.ts')
      const result = await loadInventoryAggregates()

      expect(result).toEqual({
        costTotal: 0,
        saleTotal: 0,
        profitTotal: 0,
      })
    })

    it('debería propagar errores del RPC', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      })

      const { loadInventoryAggregates } = await import('./repository.ts')
      await expect(loadInventoryAggregates()).rejects.toThrow('RPC failed')
    })
  })

  describe('loadProducts', () => {
    it('debería cargar productos con variantes y option values', async () => {
      const mockProducts = [
        {
          id: 'p1',
          name: 'Playera',
          category_id: 'cat1',
          published: true,
          public_description: '',
          image_url: null,
        },
      ]
      const mockVariants = [
        {
          id: 'v1',
          product_id: 'p1',
          sku: 'PLA-001',
          name: 'Negro',
          inventory_cost: 80,
          sale_price: 150,
          stock: 25,
        },
      ]
      const mockOptionValues = [
        {
          variant_id: 'v1',
          option_values: { name: 'Negro', option_types: { name: 'Color' } },
        },
      ]
      const mockCategories = [{ id: 'cat1', name: 'Ropa' }]

      const selectFn1 = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      })
      const selectFn2 = vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi
              .fn()
              .mockResolvedValue({ data: mockVariants, error: null }),
          }),
        }),
      })
      const selectFn3 = vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ data: mockOptionValues, error: null }),
      })
      const selectFn4 = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockCategories, error: null }),
      })

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
      expect(result[0].variants[0].optionValues).toEqual([
        { optionType: 'Color', value: 'Negro' },
      ])
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
        {
          id: 'p1',
          name: 'Playera',
          category_id: null,
          published: true,
          public_description: '',
          image_url: null,
        },
      ]

      const selectFn1 = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      })
      const selectFn2 = vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })
      // variantIds is empty → 3rd from() (variant_option_values) is skipped, so 3rd fn is categories
      const selectFn3 = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })

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
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'DB error' },
            }),
          }),
        }),
      })

      const { loadProducts } = await import('./repository.ts')
      await expect(loadProducts(mockUser)).rejects.toThrow('DB error')
    })
  })

  describe('deleteProduct', () => {
    it('debería eliminar el producto por id', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseFromMock.mockReturnValue({
        delete: deleteMock,
      })

      const { deleteProduct } = await import('./repository.ts')
      await deleteProduct('product-abc')

      expect(supabaseFromMock).toHaveBeenCalledWith('products')
      expect(deleteMock).toHaveBeenCalled()
      expect(eqMock).toHaveBeenCalledWith('id', 'product-abc')
    })

    it('debería propagar errores cuando la eliminación falla', async () => {
      const eqMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Foreign key violation' },
      })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseFromMock.mockReturnValue({
        delete: deleteMock,
      })

      const { deleteProduct } = await import('./repository.ts')
      await expect(deleteProduct('p1')).rejects.toThrow('Foreign key violation')
    })

    it('debería resolver sin error cuando la eliminación es exitosa', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseFromMock.mockReturnValue({
        delete: deleteMock,
      })

      const { deleteProduct } = await import('./repository.ts')
      await expect(
        deleteProduct('product-with-orders'),
      ).resolves.toBeUndefined()
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
        p_client_name: '',
      })
      expect(result).toBe('order-123')
    })

    it('debería lanzar error cuando el RPC falla', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Insufficient stock' },
      })
      const { createOrder } = await import('./repository.ts')

      await expect(
        createOrder('client-1', [{ variantId: 'v1', quantity: 1 }], 'paid'),
      ).rejects.toThrow('Insufficient stock')
    })
  })

  describe('updateOrder', () => {
    it('debería llamar a update_order RPC con las líneas normalizadas', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null })
      const { updateOrder } = await import('./repository.ts')

      await updateOrder(
        'order-123',
        'client-1',
        [{ variantId: 'v1', quantity: 3 }],
        'pending',
        'Mariana González',
      )

      expect(mockRpc).toHaveBeenCalledWith('update_order', {
        p_order_id: 'order-123',
        p_client_id: 'client-1',
        p_items: [{ variant_id: 'v1', quantity: 3 }],
        p_payment_status: 'pending',
        p_client_name: 'Mariana González',
      })
    })

    it('debería propagar los errores del RPC', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Insufficient stock' },
      })
      const { updateOrder } = await import('./repository.ts')

      await expect(
        updateOrder(
          'order-123',
          'client-1',
          [{ variantId: 'v1', quantity: 3 }],
          'paid',
        ),
      ).rejects.toThrow('Insufficient stock')
    })
  })

  describe('loadOrders', () => {
    it('debería cargar pedidos con item lines', async () => {
      const mockOrders = [
        {
          id: 'ord-1',
          client_id: 'c1',
          status: 'pending',
          payment_status: 'paid',
          total: 300,
          created_at: '2026-01-15T10:30:00Z',
          order_number: 'PED-001',
        },
      ]
      const mockItems = [
        {
          order_id: 'ord-1',
          variant_id: 'v1',
          quantity: 2,
          sku_snapshot: 'PLA-001',
          product_name_snapshot: 'Playera',
          variant_label_snapshot: 'Negro',
          unit_price: 150,
          unit_cost_snapshot: 80,
          line_total: 300,
        },
      ]

      supabaseFromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi
                .fn()
                .mockResolvedValue({ data: mockOrders, error: null }),
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
        {
          id: 'ord-1',
          client_id: 'c1',
          status: 'delivered',
          payment_status: 'paid',
          total: 300,
          created_at: '2026-01-15T10:30:00Z',
          order_number: 'PED-001',
        },
      ]

      supabaseFromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi
                .fn()
                .mockResolvedValue({ data: mockOrders, error: null }),
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
        {
          id: 'ord-1',
          client_id: 'c1',
          status: 'cancelled',
          payment_status: 'pending',
          total: 300,
          created_at: '2026-01-15T10:30:00Z',
          order_number: 'PED-001',
        },
      ]

      supabaseFromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi
                .fn()
                .mockResolvedValue({ data: mockOrders, error: null }),
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
        {
          id: 'ord-123456',
          client_id: 'c1',
          status: 'pending',
          payment_status: 'paid',
          total: 300,
          created_at: '2026-01-15T10:30:00Z',
          order_number: null,
        },
      ]

      supabaseFromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi
                .fn()
                .mockResolvedValue({ data: mockOrders, error: null }),
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

  describe('loadOrdersPage', () => {
    function makeOrderQueryChain(
      data: unknown[],
      count: number,
      error: unknown = null,
    ) {
      const rangeMock = vi.fn().mockResolvedValue({ data, count, error })
      const orderMock = vi.fn().mockReturnValue({ range: rangeMock })
      const eqUserMock = vi.fn().mockReturnValue({ order: orderMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock })
      return { select: selectMock, _range: rangeMock }
    }

    function makeItemsChain(data: unknown[] = [], error: unknown = null) {
      const inMock = vi.fn().mockResolvedValue({ data, error })
      const selectMock = vi.fn().mockReturnValue({ in: inMock })
      return { select: selectMock }
    }

    it('debería paginar resultados correctamente', async () => {
      const mockOrders = [
        {
          id: 'ord-1',
          client_id: 'c1',
          status: 'pending',
          payment_status: 'paid',
          total: 300,
          paid_amount: 300,
          created_at: '2026-01-15T10:30:00Z',
          order_number: 'PED-001',
          client_name_snapshot: 'Juan',
        },
      ]
      const mainQuery = makeOrderQueryChain(mockOrders, 1)
      const itemsQuery = makeItemsChain([])

      supabaseFromMock.mockReset()
      supabaseFromMock
        .mockReturnValueOnce({ select: mainQuery.select })
        .mockReturnValueOnce({ select: itemsQuery.select })

      const { loadOrdersPage } = await import('./repository.ts')
      const result = await loadOrdersPage(mockUser, { page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.totalPages).toBe(1)
    })

    it('debería filtrar por status', async () => {
      const rangeMock = vi
        .fn()
        .mockResolvedValue({ data: [], count: 0, error: null })
      const orderMock = vi.fn().mockReturnValue({ range: rangeMock })
      const eqStatusMock = vi.fn().mockReturnValue({ order: orderMock })
      const eqUserMock = vi.fn().mockReturnValue({ eq: eqStatusMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock })
      const itemsQuery = makeItemsChain([])

      supabaseFromMock.mockReset()
      supabaseFromMock
        .mockReturnValueOnce({ select: selectMock })
        .mockReturnValueOnce({ select: itemsQuery.select })

      const { loadOrdersPage } = await import('./repository.ts')
      await loadOrdersPage(
        mockUser,
        { page: 1, pageSize: 25 },
        { status: 'delivered' },
      )

      expect(supabaseFromMock).toHaveBeenCalledWith('orders')
    })

    it('debería filtrar por paymentStatus paidOrPartial', async () => {
      const rangeMock = vi
        .fn()
        .mockResolvedValue({ data: [], count: 0, error: null })
      const orderMock = vi.fn().mockReturnValue({ range: rangeMock })
      const inPaymentMock = vi.fn().mockReturnValue({ order: orderMock })
      const eqUserMock = vi.fn().mockReturnValue({ in: inPaymentMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock })
      const itemsQuery = makeItemsChain([])

      supabaseFromMock.mockReset()
      supabaseFromMock
        .mockReturnValueOnce({ select: selectMock })
        .mockReturnValueOnce({ select: itemsQuery.select })

      const { loadOrdersPage } = await import('./repository.ts')
      await loadOrdersPage(
        mockUser,
        { page: 1, pageSize: 25 },
        { paymentStatus: 'paidOrPartial' },
      )

      expect(supabaseFromMock).toHaveBeenCalledWith('orders')
    })

    it('debería propagar errores de la consulta principal', async () => {
      const mainQuery = makeOrderQueryChain([], 0, { message: 'DB error' })

      supabaseFromMock.mockReset()
      supabaseFromMock.mockReturnValue({ select: mainQuery.select })

      const { loadOrdersPage } = await import('./repository.ts')
      await expect(
        loadOrdersPage(mockUser, { page: 1, pageSize: 25 }),
      ).rejects.toThrow('DB error')
    })

    it('debería devolver paginated vacío cuando no hay pedidos', async () => {
      const mainQuery = makeOrderQueryChain([], 0)
      const itemsQuery = makeItemsChain([])

      supabaseFromMock.mockReset()
      supabaseFromMock
        .mockReturnValueOnce({ select: mainQuery.select })
        .mockReturnValueOnce({ select: itemsQuery.select })

      const { loadOrdersPage } = await import('./repository.ts')
      const result = await loadOrdersPage(mockUser, { page: 1, pageSize: 25 })

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
      expect(result.totalPages).toBe(0)
    })
  })

  describe('updateOrderStatus', () => {
    it('debería llamar a update_order_status RPC con pending', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null })

      const { updateOrderStatus } = await import('./repository.ts')
      await updateOrderStatus('ord-1', 'pending')

      expect(mockRpc).toHaveBeenCalledWith('update_order_status', {
        p_order_id: 'ord-1',
        p_status: 'pending',
      })
    })

    it('debería llamar a update_order_status RPC con delivered', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null })

      const { updateOrderStatus } = await import('./repository.ts')
      await updateOrderStatus('ord-1', 'delivered')

      expect(mockRpc).toHaveBeenCalledWith('update_order_status', {
        p_order_id: 'ord-1',
        p_status: 'delivered',
      })
    })

    it('debería propagar errores del RPC', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'order not found' },
      })

      const { updateOrderStatus } = await import('./repository.ts')
      await expect(updateOrderStatus('ord-1', 'delivered')).rejects.toThrow(
        'order not found',
      )
    })
  })

  describe('cancelOrder', () => {
    it('debería llamar a cancel_order RPC', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null })

      const { cancelOrder } = await import('./repository.ts')
      await cancelOrder('ord-1')

      expect(mockRpc).toHaveBeenCalledWith('cancel_order', {
        p_order_id: 'ord-1',
      })
    })

    it('debería propagar errores del RPC', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'already cancelled' },
      })

      const { cancelOrder } = await import('./repository.ts')
      await expect(cancelOrder('ord-1')).rejects.toThrow('already cancelled')
    })
  })

  describe('updateOrderPayment', () => {
    it('debería llamar a update_order_payment RPC con paid', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null })

      const { updateOrderPayment } = await import('./repository.ts')
      await updateOrderPayment('ord-1', 'paid')

      expect(mockRpc).toHaveBeenCalledWith('update_order_payment', {
        p_order_id: 'ord-1',
        p_payment_status: 'paid',
      })
    })

    it('debería llamar a update_order_payment RPC con pending', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null })

      const { updateOrderPayment } = await import('./repository.ts')
      await updateOrderPayment('ord-1', 'pending')

      expect(mockRpc).toHaveBeenCalledWith('update_order_payment', {
        p_order_id: 'ord-1',
        p_payment_status: 'pending',
      })
    })

    it('debería propagar errores del RPC', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'order not found' },
      })

      const { updateOrderPayment } = await import('./repository.ts')
      await expect(updateOrderPayment('ord-1', 'paid')).rejects.toThrow(
        'order not found',
      )
    })
  })
})

describe('Repositorio de pagos parciales', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseFromMock.mockReset()
    mockRpc.mockResolvedValue({ data: null, error: null })
  })

  describe('registerPayment', () => {
    it('debería llamar a register_payment RPC con los datos correctos', async () => {
      mockRpc.mockResolvedValue({ data: { id: 'pay-1' }, error: null })
      const { registerPayment } = await import('./repository.ts')

      await registerPayment('order-1', 50, 'Efectivo')

      expect(mockRpc).toHaveBeenCalledWith('register_payment', {
        p_order_id: 'order-1',
        p_amount: 50,
        p_payment_method: 'Efectivo',
        p_reference: null,
        p_notes: null,
      })
    })

    it('debería enviar reference y notes cuando se proporcionan', async () => {
      mockRpc.mockResolvedValue({ data: { id: 'pay-1' }, error: null })
      const { registerPayment } = await import('./repository.ts')

      await registerPayment(
        'order-1',
        100,
        'Transferencia',
        'REF-123',
        'Primer abono',
      )

      expect(mockRpc).toHaveBeenCalledWith('register_payment', {
        p_order_id: 'order-1',
        p_amount: 100,
        p_payment_method: 'Transferencia',
        p_reference: 'REF-123',
        p_notes: 'Primer abono',
      })
    })

    it('debería lanzar error cuando el RPC falla', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Order is cancelled' },
      })
      const { registerPayment } = await import('./repository.ts')

      await expect(registerPayment('order-1', 50, 'Efectivo')).rejects.toThrow(
        'Order is cancelled',
      )
    })

    it('debería lanzar error cuando el monto excede el saldo', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Payment amount exceeds remaining balance' },
      })
      const { registerPayment } = await import('./repository.ts')

      await expect(registerPayment('order-1', 500, 'Efectivo')).rejects.toThrow(
        'Payment amount exceeds remaining balance',
      )
    })
  })

  describe('loadOrderPayments', () => {
    it('debería cargar los abonos de un pedido', async () => {
      const mockPayments = [
        {
          id: 'pay-1',
          order_id: 'order-1',
          amount: 50,
          payment_method: 'Efectivo',
          reference: null,
          notes: null,
          created_at: '2026-01-15T10:30:00Z',
        },
        {
          id: 'pay-2',
          order_id: 'order-1',
          amount: 30,
          payment_method: 'Transferencia',
          reference: 'REF-456',
          notes: 'Segundo abono',
          created_at: '2026-01-16T14:00:00Z',
        },
      ]

      const orderMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockPayments, error: null }),
        }),
      })
      supabaseFromMock.mockReturnValue({ select: orderMock })

      const { loadOrderPayments } = await import('./repository.ts')
      const result = await loadOrderPayments('order-1')

      expect(supabaseFromMock).toHaveBeenCalledWith('order_payments')
      expect(result).toHaveLength(2)
      expect(result[0].amount).toBe(50)
      expect(result[0].paymentMethod).toBe('Efectivo')
      expect(result[1].reference).toBe('REF-456')
    })

    it('debería devolver array vacío cuando no hay abonos', async () => {
      const orderMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })
      supabaseFromMock.mockReturnValue({ select: orderMock })

      const { loadOrderPayments } = await import('./repository.ts')
      const result = await loadOrderPayments('order-1')

      expect(result).toEqual([])
    })

    it('debería ordenar abonos por fecha ascendente', async () => {
      const mockPayments = [
        {
          id: 'pay-1',
          order_id: 'order-1',
          amount: 50,
          payment_method: 'Efectivo',
          reference: null,
          notes: null,
          created_at: '2026-01-15T10:30:00Z',
        },
        {
          id: 'pay-2',
          order_id: 'order-1',
          amount: 30,
          payment_method: 'Transferencia',
          reference: null,
          notes: null,
          created_at: '2026-01-16T14:00:00Z',
        },
      ]

      const orderMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockPayments, error: null }),
        }),
      })
      supabaseFromMock.mockReturnValue({ select: orderMock })

      const { loadOrderPayments } = await import('./repository.ts')
      const result = await loadOrderPayments('order-1')

      expect(result[0].id).toBe('pay-1')
      expect(result[1].id).toBe('pay-2')
    })

    it('debería lanzar error cuando supabase falla', async () => {
      const orderMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'DB error' },
          }),
        }),
      })
      supabaseFromMock.mockReturnValue({ select: orderMock })

      const { loadOrderPayments } = await import('./repository.ts')
      await expect(loadOrderPayments('order-1')).rejects.toThrow('DB error')
    })
  })
})

describe('Repositorio de catálogo público', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debería cargar el catálogo público con productos', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          business_name: 'Mi Negocio',
          currency: 'MXN',
          whatsapp_number: '5512345678',
          public_intro: 'Hola',
          products: [
            {
              id: 'p1',
              name: 'Playera',
              category: 'Ropa',
              price: 150,
              publicDescription: 'Desc',
              imageUrl: null,
              color: 'sky',
            },
          ],
        },
      ],
      error: null,
    })

    const { loadPublicCatalog } = await import('./repository.ts')
    const result = await loadPublicCatalog('mi-negocio')

    expect(mockRpc).toHaveBeenCalledWith('get_public_catalog', {
      p_slug: 'mi-negocio',
    })
    expect(result).not.toBeNull()
    expect(result!.businessName).toBe('Mi Negocio')
    expect(result!.products).toHaveLength(1)
  })

  it('debería devolver null cuando el RPC retorna un array vacío', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    const { loadPublicCatalog } = await import('./repository.ts')
    const result = await loadPublicCatalog('no-existe')

    expect(result).toBeNull()
  })

  it('debería devolver null cuando el RPC retorna null', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })

    const { loadPublicCatalog } = await import('./repository.ts')
    const result = await loadPublicCatalog('no-existe')

    expect(result).toBeNull()
  })

  it('debería propagar errores del RPC (como columna inexistente)', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'column p.price does not exist', code: '42703' },
    })

    const { loadPublicCatalog } = await import('./repository.ts')

    await expect(loadPublicCatalog('mi-negocio')).rejects.toThrow(
      'column p.price does not exist',
    )
  })
})

describe('Repositorio de settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ data: null, error: null })
  })

  describe('loadSettings', () => {
    it('debería devolver settings mapeados cuando existe la fila', async () => {
      const settingsRow = {
        business_name: 'Mi Negocio',
        currency: 'USD',
        low_stock_threshold: 10,
        public_catalog_enabled: true,
        public_slug: 'mi-negocio',
        whatsapp_number: '5512345678',
        public_intro: 'Hola',
      }
      const maybeSingleMock = vi
        .fn()
        .mockResolvedValue({ data: settingsRow, error: null })
      const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseFromMock.mockReset()
      supabaseFromMock.mockReturnValue({ select: selectMock })

      const { loadSettings } = await import('./repository.ts')
      const result = await loadSettings(mockUser)

      expect(result.businessName).toBe('Mi Negocio')
      expect(result.currency).toBe('USD')
      expect(result.lowStockThreshold).toBe(10)
      expect(result.publicCatalogEnabled).toBe(true)
      expect(result.publicSlug).toBe('mi-negocio')
      expect(result.whatsappNumber).toBe('5512345678')
      expect(result.publicIntro).toBe('Hola')
    })

    it('debería devolver defaultSettings cuando no hay fila', async () => {
      const maybeSingleMock = vi
        .fn()
        .mockResolvedValue({ data: null, error: null })
      const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseFromMock.mockReset()
      supabaseFromMock.mockReturnValue({ select: selectMock })

      const { loadSettings } = await import('./repository.ts')
      const result = await loadSettings(mockUser)

      expect(result.businessName).toBe('Mi negocio')
      expect(result.currency).toBe('MXN')
      expect(result.lowStockThreshold).toBe(5)
      expect(result.publicCatalogEnabled).toBe(false)
    })

    it('debería propagar errores de la consulta', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      })
      const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseFromMock.mockReset()
      supabaseFromMock.mockReturnValue({ select: selectMock })

      const { loadSettings } = await import('./repository.ts')
      await expect(loadSettings(mockUser)).rejects.toThrow('DB error')
    })
  })

  describe('saveSettings', () => {
    it('debería hacer upsert y devolver settings guardados', async () => {
      const savedRow = {
        business_name: 'Nuevo',
        currency: 'EUR',
        low_stock_threshold: 3,
        public_catalog_enabled: false,
        public_slug: '',
        whatsapp_number: '',
        public_intro: '',
      }
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: savedRow, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const upsertMock = vi.fn().mockReturnValue({ select: selectMock })

      supabaseFromMock.mockReset()
      supabaseFromMock.mockReturnValue({ upsert: upsertMock })

      const { saveSettings } = await import('./repository.ts')
      const result = await saveSettings(mockUser, {
        businessName: 'Nuevo',
        currency: 'EUR',
        lowStockThreshold: 3,
        publicCatalogEnabled: false,
        publicSlug: '',
        whatsappNumber: '',
        publicIntro: '',
      })

      expect(result.businessName).toBe('Nuevo')
      expect(result.currency).toBe('EUR')
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          business_name: 'Nuevo',
          currency: 'EUR',
        }),
      )
    })

    it('debería manejar null en campos opcionales', async () => {
      const savedRow = {
        business_name: 'Test',
        currency: 'MXN',
        low_stock_threshold: 5,
        public_catalog_enabled: false,
        public_slug: null,
        whatsapp_number: null,
        public_intro: null,
      }
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: savedRow, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const upsertMock = vi.fn().mockReturnValue({ select: selectMock })

      supabaseFromMock.mockReset()
      supabaseFromMock.mockReturnValue({ upsert: upsertMock })

      const { saveSettings } = await import('./repository.ts')
      const result = await saveSettings(mockUser, {
        businessName: 'Test',
        currency: 'MXN',
        lowStockThreshold: 5,
        publicCatalogEnabled: false,
        publicSlug: null as unknown as string,
        whatsappNumber: null as unknown as string,
        publicIntro: null as unknown as string,
      })

      expect(result.publicSlug).toBe('')
      expect(result.whatsappNumber).toBe('')
      expect(result.publicIntro).toBe('')
    })

    it('debería propagar errores del upsert', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'upsert failed' },
      })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const upsertMock = vi.fn().mockReturnValue({ select: selectMock })

      supabaseFromMock.mockReset()
      supabaseFromMock.mockReturnValue({ upsert: upsertMock })

      const { saveSettings } = await import('./repository.ts')
      await expect(
        saveSettings(mockUser, {
          businessName: 'Test',
          currency: 'MXN',
          lowStockThreshold: 5,
          publicCatalogEnabled: false,
          publicSlug: '',
          whatsappNumber: '',
          publicIntro: '',
        }),
      ).rejects.toThrow('upsert failed')
    })
  })
})

describe('Repositorio de ventas agregadas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ data: null, error: null })
  })

  it('debería llamar a sales_aggregates con el período correcto', async () => {
    mockRpc.mockResolvedValue({
      data: [{ label: 'Ene', total: 1000, orders: 5 }],
      error: null,
    })

    const { loadSalesAggregates } = await import('./repository.ts')
    await loadSalesAggregates('7d')

    expect(mockRpc).toHaveBeenCalledWith('sales_aggregates', {
      p_period: '7d',
    })
  })

  it('debería mapear los resultados correctamente', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { label: 'Ene', total: 1000, orders: 5 },
        { label: 'Feb', total: 2000, orders: 8 },
      ],
      error: null,
    })

    const { loadSalesAggregates } = await import('./repository.ts')
    const result = await loadSalesAggregates('6m')

    expect(result).toHaveLength(2)
    expect(result[0].label).toBe('Ene')
    expect(result[0].total).toBe(1000)
    expect(result[0].orders).toBe(5)
    expect(result[1].label).toBe('Feb')
    expect(result[1].total).toBe(2000)
    expect(result[1].orders).toBe(8)
  })

  it('debería retornar array vacío cuando no hay datos', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    const { loadSalesAggregates } = await import('./repository.ts')
    const result = await loadSalesAggregates('7d')

    expect(result).toEqual([])
  })

  it('debería propagar errores del RPC', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'RPC execution failed' },
    })

    const { loadSalesAggregates } = await import('./repository.ts')
    await expect(loadSalesAggregates('7d')).rejects.toThrow(
      'RPC execution failed',
    )
  })
})
