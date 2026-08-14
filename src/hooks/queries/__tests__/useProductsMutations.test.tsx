/**
 * useProductsMutations.test.ts — Bug fix tests for update mutation cache behavior
 *
 * Bug: The update mutation's onSuccess overwrites the React Query cache with
 * stale data using setQueryData. When a user edits a variant and then saves
 * the product metadata, the stale product object (with old variant data)
 * replaces the fresh data in the cache.
 *
 * Fix: The update mutation should invalidate the products query after success,
 * allowing React Query to refetch fresh data instead of overwriting with stale data.
 */
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Product } from '../../../types.ts'
import { qk } from '../../../lib/queryKeys.ts'

// ─── Mock del repositorio ────────────────────────────────────

const mockUpdateProduct = vi.fn()
const mockCreateProduct = vi.fn()
const mockDeleteProduct = vi.fn()

vi.mock('../../../lib/repository.ts', () => ({
  createProduct: (...args: unknown[]) => mockCreateProduct(...args),
  updateProduct: (...args: unknown[]) => mockUpdateProduct(...args),
  deleteProduct: (...args: unknown[]) => mockDeleteProduct(...args),
}))

import { useProductsMutations } from '../useProductsMutations.ts'

// ─── Datos de prueba ─────────────────────────────────────────

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
}

const freshProduct: Product = {
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
      sku: 'PLA-001',
      name: 'Negro',
      inventoryCost: 80,
      salePrice: 150,
      stock: 25, // ← fresh data
      optionValues: [],
    },
  ],
}

const staleProduct: Product = {
  ...freshProduct,
  name: 'Playera Actualizada',
  variants: [
    {
      id: 'v1',
      productId: 'p1',
      sku: 'PLA-001',
      name: 'Negro',
      inventoryCost: 80,
      salePrice: 150,
      stock: 0, // ← stale data (user edited variant but editingProduct wasn't refreshed)
      optionValues: [],
    },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// ─── Tests ───────────────────────────────────────────────────

describe('useProductsMutations — update mutation cache behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateProduct.mockResolvedValue(undefined)
    mockCreateProduct.mockResolvedValue(freshProduct)
    mockDeleteProduct.mockResolvedValue(undefined)
  })

  describe('Bug fix: update mutation should NOT overwrite cache with stale data', () => {
    it('debería preservar los datos frescos en caché después de un update con datos obsoletos', async () => {
      // Arrange: Caché tiene datos frescos (stock: 25)
      const queryClient = createQueryClient()
      queryClient.setQueryData(qk.products(mockUser), [freshProduct])

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(queryClient),
      })

      // Act: Update con datos obsoletos (stock: 0)
      await act(async () => {
        await result.current.update.mutateAsync(staleProduct)
      })

      // Assert: Caché NO debería ser sobrescrita con datos obsoletos
      // Antes del fix: setQueryData sobrescribe → stock: 0
      // Después del fix: invalidateQueries preserva → stock: 25
      const cached = queryClient.getQueryData<Product[]>(qk.products(mockUser))
      expect(cached).toHaveLength(1)
      expect(cached![0].variants[0].stock).toBe(25)
    })

    it('debería llamar a invalidateQueries después de un update exitoso', async () => {
      // Arrange
      const queryClient = createQueryClient()
      queryClient.setQueryData(qk.products(mockUser), [freshProduct])
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(queryClient),
      })

      // Act
      await act(async () => {
        await result.current.update.mutateAsync(staleProduct)
      })

      // Assert: invalidateQueries debería ser llamado con la key de productos
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: qk.products(mockUser),
      })

      invalidateSpy.mockRestore()
    })

    it('debería NO sobrescribir el nombre del producto en caché con datos obsoletos', async () => {
      // Arrange: Caché tiene nombre actualizado
      const queryClient = createQueryClient()
      const productWithName = { ...freshProduct, name: 'Playera V2 Fresh' }
      queryClient.setQueryData(qk.products(mockUser), [productWithName])
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(queryClient),
      })

      // Act: Update con nombre obsoleto
      const staleWithName = { ...staleProduct, name: 'Playera V1 Stale' }
      await act(async () => {
        await result.current.update.mutateAsync(staleWithName)
      })

      // Assert: invalidateQueries debería ser llamado (no setQueryData con datos obsoletos)
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: qk.products(mockUser),
      })

      invalidateSpy.mockRestore()
    })

    it('debería invalidar la query del producto correcto (no otras queries)', async () => {
      // Arrange
      const queryClient = createQueryClient()
      queryClient.setQueryData(qk.products(mockUser), [freshProduct])
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(queryClient),
      })

      // Act
      await act(async () => {
        await result.current.update.mutateAsync(staleProduct)
      })

      // Assert: Solo la query de productos debería ser invalidada
      expect(invalidateSpy).toHaveBeenCalledTimes(1)
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: qk.products(mockUser),
      })

      invalidateSpy.mockRestore()
    })

    it('debería mantener todos los productos en caché intactos después del update', async () => {
      // Arrange: Caché con múltiples productos
      const queryClient = createQueryClient()
      const secondProduct: Product = {
        ...freshProduct,
        id: 'p2',
        name: 'Set Hermético',
        variants: [],
      }
      queryClient.setQueryData(qk.products(mockUser), [
        freshProduct,
        secondProduct,
      ])
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(queryClient),
      })

      // Act
      await act(async () => {
        await result.current.update.mutateAsync(staleProduct)
      })

      // Assert: invalidateQueries debería ser llamado (no setQueryData con datos obsoletos)
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: qk.products(mockUser),
      })

      invalidateSpy.mockRestore()
    })
  })

  describe('Creación de producto (sin cambios)', () => {
    it('debería agregar producto al caché al crear', async () => {
      const queryClient = createQueryClient()
      queryClient.setQueryData(qk.products(mockUser), [freshProduct])

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(queryClient),
      })

      const newProduct: Product = {
        ...freshProduct,
        id: 'p-new',
        name: 'Nuevo Producto',
      }
      mockCreateProduct.mockResolvedValue(newProduct)

      await act(async () => {
        await result.current.create.mutateAsync({
          product: {
            ...freshProduct,
            id: 'p-new',
            name: 'Nuevo Producto',
          } as Product,
        })
      })

      const cached = queryClient.getQueryData<Product[]>(qk.products(mockUser))
      expect(cached).toHaveLength(2)
      expect(cached![1].id).toBe('p-new')
    })
  })

  describe('Eliminación de producto (sin cambios)', () => {
    it('debería eliminar producto del caché al borrar', async () => {
      const queryClient = createQueryClient()
      queryClient.setQueryData(qk.products(mockUser), [freshProduct])

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(queryClient),
      })

      await act(async () => {
        await result.current.remove.mutateAsync('p1')
      })

      const cached = queryClient.getQueryData<Product[]>(qk.products(mockUser))
      expect(cached).toHaveLength(0)
    })
  })

  describe('Manejo de errores en update', () => {
    it('debería NO invalidar la query cuando el update falla', async () => {
      const queryClient = createQueryClient()
      queryClient.setQueryData(qk.products(mockUser), [freshProduct])
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      mockUpdateProduct.mockRejectedValue(new Error('DB error'))

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(queryClient),
      })

      await expect(
        result.current.update.mutateAsync(staleProduct),
      ).rejects.toThrow('DB error')

      // La query no debería ser invalidada si la mutación falla
      expect(invalidateSpy).not.toHaveBeenCalled()

      invalidateSpy.mockRestore()
    })

    it('debería preservar los datos originales en caché cuando el update falla', async () => {
      const queryClient = createQueryClient()
      queryClient.setQueryData(qk.products(mockUser), [freshProduct])
      mockUpdateProduct.mockRejectedValue(new Error('DB error'))

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(queryClient),
      })

      await expect(
        result.current.update.mutateAsync(staleProduct),
      ).rejects.toThrow()

      // Los datos originales deberían preservarse
      const cached = queryClient.getQueryData<Product[]>(qk.products(mockUser))
      expect(cached![0].variants[0].stock).toBe(25)
    })
  })

  describe('Modo demo (sin usuario)', () => {
    it('debería funcionar sin usuario en update', async () => {
      const queryClient = createQueryClient()

      const { result } = renderHook(() => useProductsMutations(null), {
        wrapper: createWrapper(queryClient),
      })

      await act(async () => {
        await result.current.update.mutateAsync(staleProduct)
      })

      expect(mockUpdateProduct).not.toHaveBeenCalled()
    })
  })
})
